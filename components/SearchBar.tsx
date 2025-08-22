"use client";
import { useState, useCallback } from "react";
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

// Stable options: ids are used for state, labels for UI
const COLUMN_OPTIONS = [
  { id: "team", label: "Team" },
  { id: "teamRole", label: "Team Role" },
  { id: "teamInviteStatus", label: "Team Invite Status" },
] as const;

type ColumnId = (typeof COLUMN_OPTIONS)[number]["id"];

export default function SearchBar() {
  const [selected, setSelected] = useState<Set<ColumnId>>(
    () => new Set<ColumnId>() // start empty; prefill if you want defaults
  );

  const toggle = useCallback((id: ColumnId, next: boolean) => {
    setSelected((prev) => {
      const nextSet = new Set(prev);
      if (next) nextSet.add(id);
      else nextSet.delete(id);
      return nextSet;
    });
  }, []);

  // Optional: show a count on the trigger (nice affordance)
  const selectedCount = selected.size;

  return (
    <div className="w-full flex items-center justify-between gap-3 mb-4">
      <div className="relative w-full max-w-4xl">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
        />
        <Input
          type="search"
          placeholder="Search users…"
          className="pl-9"
          aria-label="Search users"
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
