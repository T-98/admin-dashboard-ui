"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import Filter from "./Filter";
import { Sort, type SortBy } from "./Sort";
import { buildUserSearchQueryFromUI, type SearchKey } from "@/lib/search-build";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

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
};

export default function SearchBar({
  selected,
  onChange,
  onQueryChange,
}: Props) {
  // Local, immediate UI state
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState<SortBy | null>(null);
  const [orgQuery, setOrgQuery] = useState("");
  const [teamQuery, setTeamQuery] = useState("");

  // Debounced values used to build the actual request
  const dq = useDebouncedValue(q, 500);
  const dOrg = useDebouncedValue(orgQuery, 500);
  const dTeam = useDebouncedValue(teamQuery, 500);

  const toggle = useCallback(
    (id: ColumnId, next: boolean) => {
      const s = new Set(selected);
      next ? s.add(id) : s.delete(id);
      onChange(s);
    },
    [selected, onChange]
  );

  // Build the query from *debounced* text inputs
  const built = useMemo(
    () =>
      buildUserSearchQueryFromUI({
        q: dq,
        sortBy, // helper already suppresses sortBy if q is empty
        organizationName: dOrg,
        teamName: dTeam,
      }),
    [dq, sortBy, dOrg, dTeam]
  );

  // Emit to parent so it can trigger data fetching
  useEffect(() => {
    onQueryChange?.(built.key);
    // eslint-disable-next-line no-console
    console.debug("[SearchBar] built (debounced):", built.url, built.key);
  }, [built, onQueryChange]);

  // Optional: flush debounce on Enter for instant search
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "Enter") return;
      const immediate = buildUserSearchQueryFromUI({
        q, // use raw value to flush
        sortBy,
        organizationName: orgQuery,
        teamName: teamQuery,
      });
      onQueryChange?.(immediate.key);
      // eslint-disable-next-line no-console
      console.debug(
        "[SearchBar] built (enter-flush):",
        immediate.url,
        immediate.key
      );
    },
    [q, sortBy, orgQuery, teamQuery, onQueryChange]
  );

  const selectedCount = selected.size;
  const queryHasQ = q.trim().length > 0;

  return (
    <div className="w-full flex items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-2 flex-1">
        <div className="relative w-full flex justify-between">
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
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* Sort is not debounced (discrete control) */}
        <Sort value={sortBy} onChange={setSortBy} queryHasQ={queryHasQ} />

        {/* Filter inputs are debounced via dOrg/dTeam */}
        <Filter
          orgQuery={orgQuery}
          teamQuery={teamQuery}
          onOrgChange={setOrgQuery}
          onTeamChange={setTeamQuery}
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" aria-label="Choose visible columns">
            Columns{selectedCount ? ` (${selectedCount})` : ""}
          </Button>
        </DropdownMenuTrigger>

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
    </div>
  );
}
