import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useCurrentUserContext } from "@/contexts/CurrentUserContext";

const InviteToTeam = () => {
  const { organizations, teams } = useCurrentUserContext();

  return (
    <ScrollArea className="h-72 w-48 rounded-md border">
      <div className="p-4">
        <h4 className="mb-3 text-sm leading-none font-medium">Orgs</h4>
        <div className="space-y-2">
          {organizations.map((org) => (
            <React.Fragment key={org.organizationId}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-full justify-start px-2 text-xs truncate"
                aria-label={`Organization ${org.organization.name}`}
              >
                {org.organization.name}
              </Button>
              <Separator />
            </React.Fragment>
          ))}
        </div>

        <h4 className="mt-4 mb-3 text-sm leading-none font-medium">Teams</h4>
        <div className="space-y-2">
          {teams.map((team) => (
            <React.Fragment key={team.teamId}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-full justify-start px-2 text-xs truncate"
                aria-label={`Team ${team.team.name}`}
              >
                {team.team.name}
              </Button>
              <Separator />
            </React.Fragment>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
};

export default InviteToTeam;
