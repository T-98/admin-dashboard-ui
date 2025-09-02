// components/search/SearchBar.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Columns3Cog } from "lucide-react";
import Filter from "./Filter";
import { Sort, type SortBy } from "./Sort";
import { buildUserSearchQueryFromUI, type SearchKey } from "@/lib/search-build";

export const COLUMN_OPTIONS = [
  { id: "team", label: "Team" },
  { id: "teamRole", label: "Team Role" },
  { id: "teamInviteStatus", label: "Team Invite Status" },
] as const;

export type ColumnId = (typeof COLUMN_OPTIONS)[number]["id"];

type Props = {
  selected: Set<ColumnId>;
  onChange: (next: Set<ColumnId>) => void;
  onQueryChange?: (key: SearchKey) => void;
  /** debounce for main q */
  debounceMs?: number;
  /** debounce for org/team filters (defaults to 1000ms per request) */
  filterDebounceMs?: number;
};

export default function SearchBar({
  selected,
  onChange,
  onQueryChange,
  debounceMs = 300,
  filterDebounceMs = 1000, // << 1s for org/team filters
}: Props) {
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState<SortBy | null>(null);
  const [orgQuery, setOrgQuery] = useState("");
  const [teamQuery, setTeamQuery] = useState("");
  const [take, setTake] = useState<number>(10);

  // Debounced copies
  const [dq, setDq] = useState(q);
  const [dOrg, setDOrg] = useState(orgQuery);
  const [dTeam, setDTeam] = useState(teamQuery);

  // timers to allow explicit flush (Enter)
  const qTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const orgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const teamTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // signature to de-dupe emissions
  const lastEmittedRef = useRef<string>("");

  // debounce q
  useEffect(() => {
    if (qTimerRef.current) clearTimeout(qTimerRef.current);
    qTimerRef.current = setTimeout(() => {
      setDq(q);
      qTimerRef.current = null;
    }, debounceMs);
    return () => {
      if (qTimerRef.current) {
        clearTimeout(qTimerRef.current);
        qTimerRef.current = null;
      }
    };
  }, [q, debounceMs]);

  // debounce org
  useEffect(() => {
    if (orgTimerRef.current) clearTimeout(orgTimerRef.current);
    orgTimerRef.current = setTimeout(() => {
      setDOrg(orgQuery);
      orgTimerRef.current = null;
    }, filterDebounceMs);
    return () => {
      if (orgTimerRef.current) {
        clearTimeout(orgTimerRef.current);
        orgTimerRef.current = null;
      }
    };
  }, [orgQuery, filterDebounceMs]);

  // debounce team
  useEffect(() => {
    if (teamTimerRef.current) clearTimeout(teamTimerRef.current);
    teamTimerRef.current = setTimeout(() => {
      setDTeam(teamQuery);
      teamTimerRef.current = null;
    }, filterDebounceMs);
    return () => {
      if (teamTimerRef.current) {
        clearTimeout(teamTimerRef.current);
        teamTimerRef.current = null;
      }
    };
  }, [teamQuery, filterDebounceMs]);

  // Build with *debounced* values
  const builtDebounced = useMemo(
    () =>
      buildUserSearchQueryFromUI({
        q: dq,
        sortBy,
        organizationName: dOrg,
        teamName: dTeam,
        take,
      }),
    [dq, dOrg, dTeam, sortBy, take]
  );

  // Emit when debounced build changes
  useEffect(() => {
    if (!onQueryChange) return;
    const sig = builtDebounced.url;
    if (sig !== lastEmittedRef.current) {
      lastEmittedRef.current = sig;
      onQueryChange(builtDebounced.key);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builtDebounced]);

  // Submit (Enter): cancel all timers, sync debounced values, emit immediately
  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (qTimerRef.current) {
        clearTimeout(qTimerRef.current);
        qTimerRef.current = null;
      }
      if (orgTimerRef.current) {
        clearTimeout(orgTimerRef.current);
        orgTimerRef.current = null;
      }
      if (teamTimerRef.current) {
        clearTimeout(teamTimerRef.current);
        teamTimerRef.current = null;
      }

      // sync debounced copies to raw values
      setDq(q);
      setDOrg(orgQuery);
      setDTeam(teamQuery);

      // build from raw
      const builtNow = buildUserSearchQueryFromUI({
        q,
        sortBy,
        organizationName: orgQuery,
        teamName: teamQuery,
        take,
      });

      const sig = builtNow.url;
      if (sig !== lastEmittedRef.current) {
        lastEmittedRef.current = sig;
        onQueryChange?.(builtNow.key);
      }
    },
    [q, orgQuery, teamQuery, sortBy, take, onQueryChange]
  );

  const toggle = useCallback(
    (id: ColumnId, next: boolean) => {
      const s = new Set(selected);
      next ? s.add(id) : s.delete(id);
      onChange(s);
    },
    [selected, onChange]
  );

  const selectedCount = selected.size;
  const hasQ = q.trim().length > 0;

  return (
    <div className="w-full flex items-center justify-between gap-3 mb-4">
      <form onSubmit={onSubmit} className="flex items-center gap-2 flex-1">
        <div className="relative w-full">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          />
          <Input
            id="search"
            type="search"
            placeholder="Search users…"
            className="pl-9"
            aria-label="Search users"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <Sort value={sortBy} onChange={setSortBy} queryHasQ={hasQ} />

        {/* Pass raw values; SearchBar debounces before emitting */}
        <Filter
          orgQuery={orgQuery}
          teamQuery={teamQuery}
          onOrgChange={setOrgQuery}
          onTeamChange={setTeamQuery}
        />

        {/* Page size (take) */}
        <div className="flex items-center gap-2 ml-2">
          <label htmlFor="take" className="text-sm text-muted-foreground">
            Page size
          </label>
          <Input
            id="take"
            type="number"
            inputMode="numeric"
            min={1}
            max={100}
            className="w-24"
            value={take}
            onChange={(e) => {
              const next = Math.trunc(e.currentTarget.valueAsNumber);
              if (Number.isNaN(next)) return; // ignore transient NaN
              const clamped = Math.max(1, Math.min(100, next));
              setTake(clamped);
            }}
          />
        </div>

        <button type="submit" className="hidden" aria-hidden="true" />
      </form>

      <TooltipProvider delayDuration={150}>
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" aria-label="Toggle Columns">
                  <Columns3Cog className="mr-1 h-4 w-4" />
                  {selectedCount ? `(${selectedCount})` : ""}
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="top" align="end">
              Toggle Columns
            </TooltipContent>
          </Tooltip>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {COLUMN_OPTIONS.map((opt) => (
              <DropdownMenuCheckboxItem
                key={opt.id}
                checked={selected.has(opt.id)}
                onCheckedChange={(checked) => toggle(opt.id, Boolean(checked))}
              >
                {opt.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipProvider>
    </div>
  );
}
