import { Fragment } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useCurrentUserContext } from "@/contexts/CurrentUserContext";
import type { RowActionPayload } from "./UserListView";
interface Props {
  userName: string;
  userId: number;
  userEmail: string;
  onRowAction?: (payload: RowActionPayload) => void;
}

const InviteToTeam = ({ userName, userEmail, userId, onRowAction }: Props) => {
  const { organizations: invitingUserOrgs, teams: invitingUserTeams } =
    useCurrentUserContext();

  return (
    <ScrollArea className="h-72 w-48 rounded-md border">
      <div className="p-4">
        <h4 className="mb-3 text-sm leading-none font-medium">Orgs</h4>
        <div className="space-y-2">
          {invitingUserOrgs.map((org) => (
            <Fragment key={org.organizationId}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-full justify-start px-2 text-xs truncate"
                aria-label={`Organization ${org.organization.name}`}
                onClick={(e) => {
                  e.stopPropagation(); // keep Radix from handling it as a menu click
                  onRowAction?.({
                    action: "invite-user",
                    userId,
                    userName,
                    userEmail,
                    invitedTo: "organization",
                    organization: {
                      organizationId: Number(org.organizationId),
                      role: org.role || undefined,
                      organization: { name: org.organization.name },
                    },
                  });
                }}
              >
                {org.organization.name}
              </Button>
              <Separator />
            </Fragment>
          ))}
        </div>

        <h4 className="mt-4 mb-3 text-sm leading-none font-medium">Teams</h4>
        <div className="space-y-2">
          {invitingUserTeams.map((team) => (
            <Fragment key={team.teamId}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-full justify-start px-2 text-xs truncate"
                aria-label={`Team ${team.team.name}`}
                onClick={
                  onRowAction
                    ? () =>
                        onRowAction({
                          action: "invite-user",
                          userId: userId,
                          userName: userName,
                          userEmail: userEmail,
                          invitedTo: "team",
                          team: {
                            teamId: Number(team.teamId),
                            role: team.role || undefined,
                            team: { name: team.team.name },
                          },
                        })
                    : undefined
                }
              >
                {team.team.name}
              </Button>
              <Separator />
            </Fragment>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
};

export default InviteToTeam;
