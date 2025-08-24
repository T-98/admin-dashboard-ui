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
  debounceMs?: number;
};

export default function SearchBar({
  selected,
  onChange,
  onQueryChange,
  debounceMs = 300,
}: Props) {
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState<SortBy | null>(null);
  const [orgQuery, setOrgQuery] = useState("");
  const [teamQuery, setTeamQuery] = useState("");

  // Debounce for q
  const [dq, setDq] = useState(q);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Use a string signature for dedupe (built URL is perfect)
  const lastEmittedRef = useRef<string>("");

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDq(q);
      timerRef.current = null;
    }, debounceMs);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [q, debounceMs]);

  const builtDebounced = useMemo(
    () =>
      buildUserSearchQueryFromUI({
        q: dq,
        sortBy,
        organizationName: orgQuery,
        teamName: teamQuery,
      }),
    [dq, sortBy, orgQuery, teamQuery]
  );

  // Emit debounced key when builtDebounced changes (typing path)
  useEffect(() => {
    if (!onQueryChange) return;
    const sig = builtDebounced.url; // string signature
    if (sig !== lastEmittedRef.current) {
      lastEmittedRef.current = sig;
      onQueryChange(builtDebounced.key); // still emit structured key
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builtDebounced]);

  // Submit handler (Enter): cancel timer, emit raw q immediately, sync dq
  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      const builtNow = buildUserSearchQueryFromUI({
        q,
        sortBy,
        organizationName: orgQuery,
        teamName: teamQuery,
      });
      setDq(q);
      const sig = builtNow.url; // string signature
      if (sig !== lastEmittedRef.current) {
        lastEmittedRef.current = sig;
        onQueryChange?.(builtNow.key);
      }
    },
    [q, sortBy, orgQuery, teamQuery, onQueryChange]
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

        <Filter
          orgQuery={orgQuery}
          teamQuery={teamQuery}
          onOrgChange={setOrgQuery}
          onTeamChange={setTeamQuery}
        />

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
