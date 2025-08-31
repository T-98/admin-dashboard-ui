import { Fragment, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useCurrentUserContext } from "@/contexts/CurrentUserContext";
import type { RowActionPayload } from "./UserListView";

type Role = "ADMIN" | "MEMBER";

interface Props {
  userName: string;
  userId: number;
  userEmail: string;
  onRowAction?: (payload: RowActionPayload) => void;
}

// Debounce rapid clicks to avoid multiple invites and
// disable the specific org/team button until the action settles.

const Invite = ({ userName, userEmail, userId, onRowAction }: Props) => {
  const { organizations: invitingUserOrgs, teams: invitingUserTeams } =
    useCurrentUserContext();

  const [role, setRole] = useState<Role>("MEMBER"); // default
  // Track pending invites per target (e.g., org:123, team:456)
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const pendingRef = useRef<Record<string, boolean>>({});

  const setPendingFor = (key: string, value: boolean) => {
    if (value) {
      pendingRef.current[key] = true;
      setPending((prev) => ({ ...prev, [key]: true }));
    } else {
      delete pendingRef.current[key];
      setPending((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const isPending = (key: string) => !!pendingRef.current[key];

  const handleInvite = async (key: string, payload: RowActionPayload) => {
    if (isPending(key)) return; // debounce rapid clicks
    setPendingFor(key, true);
    try {
      const maybePromise: any = onRowAction?.(payload);
      if (maybePromise && typeof maybePromise.then === "function") {
        await maybePromise; // wait for caller to resolve
      } else {
        // Fallback: brief lock to absorb double-clicks
        await new Promise((r) => setTimeout(r, 1000));
      }
      // Optionally, show toast on success (not implemented here)
    } catch (_err) {
      // Optionally, show toast on failure (not implemented here)
    } finally {
      setPendingFor(key, false);
    }
  };

  return (
    <ScrollArea className="h-72 w-56 rounded-md border">
      <div className="p-3">
        {/* Compact role picker */}
        <div className="mb-3">
          <p className="text-xs font-medium mb-2">Assign role</p>
          <RadioGroup
            value={role}
            onValueChange={(v) => setRole(v as Role)}
            className="grid grid-cols-2 gap-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem id="role-member" value="MEMBER" />
              <Label htmlFor="role-member" className="text-xs">
                Member
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem id="role-admin" value="ADMIN" />
              <Label htmlFor="role-admin" className="text-xs">
                Admin
              </Label>
            </div>
          </RadioGroup>
        </div>

        <Separator className="my-2" />

        <h4 className="mb-2 text-sm leading-none font-medium">Orgs</h4>
        <div className="space-y-2">
          {invitingUserOrgs.map((org) => (
            <Fragment key={org.organizationId}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-full justify-start px-2 text-xs truncate"
                aria-label={`Organization ${org.organization.name}`}
                disabled={isPending(`org:${org.organizationId}`)}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleInvite(`org:${org.organizationId}`, {
                    action: "invite-user",
                    userId,
                    userName,
                    userEmail,
                    invitedTo: "organization",
                    organization: {
                      organizationId: Number(org.organizationId),
                      // assign the INVITEE's role from picker
                      role,
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

        <h4 className="mt-4 mb-2 text-sm leading-none font-medium">Teams</h4>
        <div className="space-y-2">
          {invitingUserTeams.map((team) => (
            <Fragment key={team.teamId}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-full justify-start px-2 text-xs truncate"
                aria-label={`Team ${team.team.name}`}
                disabled={isPending(`team:${team.teamId}`)}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleInvite(`team:${team.teamId}`, {
                    action: "invite-user",
                    userId,
                    userName,
                    userEmail,
                    invitedTo: "team",
                    team: {
                      teamId: Number(team.teamId),
                      // assign the INVITEE's role from picker
                      role,
                      team: { name: team.team.name },
                    },
                  });
                }}
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

export default Invite;
