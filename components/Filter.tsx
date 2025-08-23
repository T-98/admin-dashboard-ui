import {useState} from "react";
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

const Filter = () => {

    const [isApplied, setIsApplied] = useState(false);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" aria-label="Choose visible columns">
          <FunnelPlus />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Filter By</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="p-2">
          <Label className="mb-2">Org</Label>
          <Input
            type="text"
            placeholder="Type org name"
            className="p-2"
            aria-label="Type org name"
          />
        </div>
        <div className="p-2">
          <Label className="mb-2">Team</Label>
          <Input
            type="text"
            placeholder="Type team name"
            className="p-2"
            aria-label="Type team name"
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Filter;
