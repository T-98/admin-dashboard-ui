"use client";

import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
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
import { FunnelPlus, FunnelX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  orgQuery: string;
  teamQuery: string;
  onOrgChange: (v: string) => void;
  onTeamChange: (v: string) => void;
};

export default function Filter({
  orgQuery,
  teamQuery,
  onOrgChange,
  onTeamChange,
}: Props) {
  const isApplied = orgQuery.trim().length > 0 || teamQuery.trim().length > 0;

  return (
    <TooltipProvider delayDuration={150}>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent side="top" align="end">
            <p>Filters</p>
          </TooltipContent>
        </Tooltip>
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
              onChange={(e) => onOrgChange(e.target.value)}
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
              onChange={(e) => onTeamChange(e.target.value)}
            />
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}
