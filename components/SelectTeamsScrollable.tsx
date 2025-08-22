// components/SelectTeamsScrollable.tsx
import {useMemo, useCallback} from "react";
import type { Team } from "@/hooks/usePaginatedUsers";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  teams: Team[]; // teams to render (already filtered by org)
  value?: number | null; // selected teamId
  onChange?: (teamId: number | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export function SelectTeamsScrollable({
  teams,
  value,
  onChange,
  placeholder = "Select team",
  className = "w-[260px]",
  disabled = false,
}: Props) {
  const items = useMemo(
    () =>
      teams.map((t) => ({
        key: t.teamId,
        value: String(t.teamId), // shadcn Select expects string
        label: t.name,
        hint: t.role, // optional: show role in the option
      })),
    [teams]
  );

  const handleChange = useCallback(
    (val: string) => {
      if (!onChange) return;
      const parsed = val ? Number(val) : null;
      onChange(Number.isNaN(parsed as number) ? null : parsed);
    },
    [onChange]
  );

  const hasTeams = items.length > 0;

  return (
    <Select
      value={value != null ? String(value) : undefined}
      onValueChange={handleChange}
      disabled={disabled || !hasTeams}
    >
      <SelectTrigger className={className} aria-label="Team">
        <SelectValue placeholder={hasTeams ? placeholder : "No teams"} />
      </SelectTrigger>

      <SelectContent className="min-w-[max(var(--radix-select-trigger-width),24rem)]">
        <SelectGroup>
          <SelectLabel>Teams</SelectLabel>
          {hasTeams ? (
            items.map((o) => (
              <SelectItem key={o.key} value={o.value}>
                <span className="inline-flex items-start gap-2 whitespace-normal break-words text-left">
                  <span>{o.label}</span>
                </span>
              </SelectItem>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No teams
            </div>
          )}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
