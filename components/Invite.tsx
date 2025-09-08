import { Fragment, useRef, useState, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useCurrentUserContext } from "@/contexts/CurrentUserContext";
import type { RowActionPayload } from "./UserListView";

export type OrgRole = "ADMIN" | "MEMBER";
type TeamRole = "LEAD" | "MEMBER";

interface Props {
  userName: string;
  userId: number;
  userEmail: string;
  userOrgs: Array<{
    orgId: number;
    name: string;
    role: string;
  }>;
  onRowAction?: (payload: RowActionPayload) => void;
}

const Invite = ({
  userName,
  userEmail,
  userId,
  userOrgs,
  onRowAction,
}: Props) => {
  const { organizations: invitingUserOrgs, teams: invitingUserTeams } =
    useCurrentUserContext();

  // Fast lookup: orgId -> org membership
  const orgById = useMemo(() => {
    const m = new Map<number, (typeof invitingUserOrgs)[number]>();
    for (const org of invitingUserOrgs) m.set(org.organizationId, org);
    return m;
  }, [invitingUserOrgs]);

  const [orgRole, setOrgRole] = useState<OrgRole>("MEMBER");
  const [teamRole, setTeamRole] = useState<TeamRole>("MEMBER");

  // pending guard (per target)
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const pendingRef = useRef<Record<string, boolean>>({});
  const setPendingFor = (key: string, value: boolean) => {
    if (value) {
      pendingRef.current[key] = true;
      setPending((p) => ({ ...p, [key]: true }));
    } else {
      delete pendingRef.current[key];
      setPending((p) => {
        const n = { ...p };
        delete n[key];
        return n;
      });
    }
  };
  const isPending = (key: string) => !!pendingRef.current[key];

  const handleInvite = async (key: string, payload: RowActionPayload) => {
    if (isPending(key)) return;
    setPendingFor(key, true);
    try {
      const maybe = onRowAction?.(payload);
      if (maybe && typeof (maybe as any).then === "function") {
        await (maybe as Promise<unknown>);
      } else {
        await new Promise((r) => setTimeout(r, 500));
      }
    } finally {
      setPendingFor(key, false);
    }
  };
  // Org roles: MEMBER, ADMIN; Team roles: MEMBER, LEAD
  return (
    <ScrollArea className="h-72 w-56 rounded-md border">
      <div className="p-3">
        {/* Organization role picker */}
        <div className="mb-3">
          <p className="text-xs font-medium mb-2">Organization role</p>
          <RadioGroup
            value={orgRole}
            onValueChange={(v) => setOrgRole(v as OrgRole)}
            className="grid grid-cols-2 gap-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem id="org-role-member" value="MEMBER" />
              <Label htmlFor="org-role-member" className="text-xs">
                Member
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem id="org-role-admin" value="ADMIN" />
              <Label htmlFor="org-role-admin" className="text-xs">
                Admin
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Team role picker */}
        <div className="mb-3">
          <p className="text-xs font-medium mb-2">Team role</p>
          <RadioGroup
            value={teamRole}
            onValueChange={(v) => setTeamRole(v as TeamRole)}
            className="grid grid-cols-2 gap-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem id="team-role-member" value="MEMBER" />
              <Label htmlFor="team-role-member" className="text-xs">
                Member
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem id="team-role-lead" value="LEAD" />
              <Label htmlFor="team-role-lead" className="text-xs">
                Lead
              </Label>
            </div>
          </RadioGroup>
        </div>

        <Separator className="my-2" />

        {/* Orgs */}
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
                      organizationId: org.organizationId,
                      role: orgRole, // org role assigned to the invitee
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

        {/* Teams (derive org via team.team.organizationId) */}
        <h4 className="mt-4 mb-2 text-sm leading-none font-medium">Teams</h4>
        <div className="space-y-2">
          {invitingUserTeams.map((team) => {
            const orgId = team.team.organizationId; // ← you added this
            const org = orgById.get(orgId);
            const disabled = !org || isPending(`team:${team.teamId}`);
            const label = org
              ? `${team.team.name}`
              : `${team.team.name} (no org)`;
            return (
              <Fragment key={team.teamId}>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-full justify-start px-2 text-xs truncate"
                  aria-label={`Team ${team.team.name}`}
                  disabled={disabled}
                  title={
                    org ? `Org: ${org.organization.name}` : "Org not found"
                  }
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!org) return; // safety
                    // Find the invitee's org matching this team's orgId; default to MEMBER if not found
                    const inviteeOrg = userOrgs.find(
                      (item) => item.orgId === orgId
                    );
                    handleInvite(`team:${team.teamId}`, {
                      action: "invite-user",
                      userId,
                      userName,
                      userEmail,
                      invitedTo: "team",
                      // include BOTH team and organization in payload
                      organization: {
                        organizationId: org.organizationId,
                        role: inviteeOrg?.role ?? "MEMBER", // org role for the invitee (fallback to MEMBER), backend will validate
                        organization: { name: org.organization.name },
                      },
                      team: {
                        teamId: team.teamId,
                        role: teamRole, // team role for the invitee
                        team: { name: team.team.name, organizationId: orgId },
                      },
                    });
                  }}
                >
                  {label}
                </Button>
                <Separator />
              </Fragment>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
};

export default Invite;
