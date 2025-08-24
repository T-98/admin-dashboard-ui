"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { ArrowDownUp } from "lucide-react";

export type SortBy = "mostRelevant" | "name" | "email" | "createdAt" | null;

type Props = {
  value: SortBy; // controlled value (can be null)
  onChange: (next: SortBy) => void;
  queryHasQ?: boolean; // NEW: whether q is non-empty
};

export function Sort({ value, onChange, queryHasQ = false }: Props) {
  // Only considered “active” if a value is chosen AND q is present.
  const isActive = Boolean(queryHasQ && value);

  return (
    <TooltipProvider delayDuration={150}>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant={isActive ? "default" : "outline"} // outline only when effective
                aria-label="Sort options"
              >
                <ArrowDownUp />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="top" align="end">
            Sort Options
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Sort By</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={value ?? ""} // Radix expects string
            onValueChange={(v) => onChange((v || null) as SortBy)}
          >
            <DropdownMenuRadioItem value="mostRelevant">
              Most Relevant
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="email">Email</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="createdAt">
              Creation Date
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}
