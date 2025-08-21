// components/SelectScrollable.tsx
import {useCallback, useMemo} from "react";
import type { Org } from "@/hooks/usePaginatedUsers";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SelectScrollableProps = {
  /** List of orgs to render in the dropdown */
  orgs: Org[];
  /** Controlled selected orgId (number). Omit for uncontrolled usage. */
  value?: number | null;
  /** Called with the selected orgId (number) or null when cleared (if you add a clear control). */
  onChange?: (orgId: number | null) => void;
  /** Placeholder text when no selection */
  placeholder?: string;
  /** Optional className for the trigger */
  className?: string;
  /** Disable the select */
  disabled?: boolean;
};

export function SelectScrollable({
  orgs,
  value,
  onChange,
  placeholder = "Select organization",
  className = "w-[280px]",
  disabled = false,
}: SelectScrollableProps) {
  // Memoize options to avoid re-creating items on each render
  const items = useMemo(
    () =>
      orgs.map((org) => ({
        key: org.orgId,
        value: String(org.orgId), // shadcn Select expects string values
        label: org.name,
        hint: org.role, // optional: show role in the option
      })),
    [orgs]
  );

  const handleChange = useCallback(
    (val: string) => {
      if (onChange) {
        const parsed = val ? Number(val) : null;
        onChange(Number.isNaN(parsed as number) ? null : parsed);
      }
    },
    [onChange]
  );

  const hasOrgs = items.length > 0;

  return (
    <Select
      // Controlled if `value` provided; uncontrolled otherwise
      value={value != null ? String(value) : undefined}
      onValueChange={handleChange}
      disabled={disabled || !hasOrgs}
    >
      <SelectTrigger className={className} aria-label="Organization">
        <SelectValue placeholder={hasOrgs ? placeholder : "No organizations"} />
      </SelectTrigger>

      <SelectContent>
        <SelectGroup>
          <SelectLabel>Organizations</SelectLabel>
          {hasOrgs ? (
            items.map((o) => (
              <SelectItem key={o.key} value={o.value}>
                {/* Label with optional role hint */}
                <span className="inline-flex items-center gap-2">
                  <span>{o.label}</span>
                  {o.hint && (
                    <span className="text-xs text-muted-foreground">
                      — {o.hint}
                    </span>
                  )}
                </span>
              </SelectItem>
            ))
          ) : (
            // Non-interactive placeholder when list is empty
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No organizations
            </div>
          )}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
