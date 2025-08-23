import { useState, useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FunnelPlus, FunnelX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Filter() {
  const [orgQuery, setOrgQuery] = useState("");
  const [teamQuery, setTeamQuery] = useState("");

  // Applied if either input has a value (trim to avoid whitespace-only)
  const isApplied = useMemo(
    () => orgQuery.trim().length > 0 || teamQuery.trim().length > 0,
    [orgQuery, teamQuery]
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={isApplied ? "default" : "outline"}
          aria-label={isApplied ? "Edit filters" : "Open filters"}
        >
          {isApplied ? (
            <FunnelX className="h-4 w-4" />
          ) : (
            <FunnelPlus className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Filter By</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="p-2 space-y-2">
          <Label htmlFor="filter-org">Org</Label>
          <Input
            id="filter-org"
            type="text"
            placeholder="Type org name"
            className="p-2"
            aria-label="Type org name"
            value={orgQuery}
            onChange={(e) => setOrgQuery(e.target.value)}
          />
        </div>

        <div className="p-2 space-y-2">
          <Label htmlFor="filter-team">Team</Label>
          <Input
            id="filter-team"
            type="text"
            placeholder="Type team name"
            className="p-2"
            aria-label="Type team name"
            value={teamQuery}
            onChange={(e) => setTeamQuery(e.target.value)}
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
