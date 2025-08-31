// components/UserListView.tsx
import { useEffect, useState, useCallback, useMemo, JSX } from "react";
import type { User, Org, Team } from "@/hooks/usePaginatedUsers";
import type { ColumnId } from "@/components/search/SearchBar";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SelectScrollable } from "./SelectScrollable";
import { SelectTeamsScrollable } from "./SelectTeamsScrollable";
import {
  MoreVertical,
  AtSign,
  LetterText,
  Building,
  BriefcaseBusiness,
  Inbox,
  UsersRound,
  Briefcase,
  Clapperboard,
  CircleCheck,
  Loader,
  CircleX,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import InviteToTeam from "./InviteToTeam";
import {
  TeamMembership,
  OrganizationMembership,
} from "@/contexts/CurrentUserContext";

export type RowAction = "delete-user" | "invite-user";
export type RowActionPayload = {
  action: RowAction;
  userName: string;
  userId: number;
  userEmail: string;
  invitedTo: string;
  team?: TeamMembership;
  organization?: OrganizationMembership;
};
interface Props {
  users: User[];
  total: number;
  take: number;
  pageIndex: number;
  isLoading: boolean;
  error: Error | null;
  onNext: () => void;
  onPrevious: () => void;
  hasNext: boolean;
  isFetchingNextPage: boolean;
  extraColumns?: ColumnId[];
  searchParams: {
    organizationName?: string;
    teamName?: string;
  };
  onRowAction?: (payload: RowActionPayload) => void;
}

interface ExtendedOrg extends Org {
  organizationInviteStatus: string;
}

interface ExtendedTeam extends Team {
  teamInviteStatus: string;
}

export default function UserListView({
  users,
  total,
  take,
  pageIndex,
  isLoading,
  error,
  onNext,
  onPrevious,
  hasNext,
  isFetchingNextPage,
  extraColumns = [],
  searchParams,
  onRowAction,
}: Props) {
  const approxShown = Math.min((pageIndex + 1) * take, total);
  const canPrev = pageIndex > 0;
  const disableNext = !hasNext || isFetchingNextPage;

  const showTeam = extraColumns.includes("team");
  const showTeamRole = extraColumns.includes("teamRole");
  const showTeamInvite = extraColumns.includes("teamInviteStatus");

  // one width to rule them all
  const W_MAIN = "w-[16rem]"; // name, email, org, team
  const W_ROLE = "w-[12rem]"; // org role, team role
  const W_STATUS = "w-[9rem]"; // org invite, team invite
  const W_ACTION = "w-[10rem]"; // actions

  // Selected Org per user
  const [selectedOrgByUser, setSelectedOrgByUser] = useState<
    Record<number, number | null>
  >({});

  // Selected Team per user (depends on selected org)
  const [selectedTeamByUser, setSelectedTeamByUser] = useState<
    Record<number, number | null>
  >({});

  // Initialize selections on page/user or filter changes:
  // - Org -> orgName if provided, else org of teamName if provided, else first org
  // - Team -> teamName within that org if provided, else first team in that org
  useEffect(() => {
    const orgFilter = (searchParams?.organizationName ?? "")
      .trim()
      .toLowerCase();
    const teamFilter = (searchParams?.teamName ?? "").trim().toLowerCase();

    const nextOrg: Record<number, number | null> = {};
    const nextTeam: Record<number, number | null> = {};

    for (const u of users) {
      // 1) Resolve default org
      let defaultOrgId: number | null = null;

      if (orgFilter) {
        const byOrgName = u.orgs.find(
          (o) => o.name.trim().toLowerCase() === orgFilter
        );
        if (byOrgName) defaultOrgId = byOrgName.orgId;
      }

      if (defaultOrgId == null && teamFilter) {
        const byTeamName = u.teams.find(
          (t) => t.name.trim().toLowerCase() === teamFilter
        );
        if (byTeamName) defaultOrgId = byTeamName.orgId;
      }

      if (defaultOrgId == null) defaultOrgId = u.orgs[0]?.orgId ?? null;
      nextOrg[u.id] = defaultOrgId;

      // 2) Resolve default team within the chosen org
      const teamsInOrg =
        defaultOrgId != null
          ? u.teams.filter((t) => t.orgId === defaultOrgId)
          : [];

      let defaultTeamId: number | null = null;

      if (teamFilter) {
        const teamInOrg = teamsInOrg.find(
          (t) => t.name.trim().toLowerCase() === teamFilter
        );
        if (teamInOrg) defaultTeamId = teamInOrg.teamId;
      }

      if (defaultTeamId == null) defaultTeamId = teamsInOrg[0]?.teamId ?? null;

      nextTeam[u.id] = defaultTeamId;
    }

    setSelectedOrgByUser(nextOrg);
    setSelectedTeamByUser(nextTeam);
  }, [users, searchParams?.organizationName, searchParams?.teamName]);

  const handleSelectOrg = useCallback(
    (userId: number, orgId: number | null) => {
      setSelectedOrgByUser((prev) =>
        prev[userId] === orgId ? prev : { ...prev, [userId]: orgId }
      );
      setSelectedTeamByUser((prev) => {
        const user = users.find((u) => u.id === userId);
        if (!user || orgId == null) {
          if (prev[userId] == null) return prev;
          return { ...prev, [userId]: null };
        }
        const teamsInOrg = user.teams.filter((t) => t.orgId === orgId);
        const nextTeamId = teamsInOrg[0]?.teamId ?? null;
        if (prev[userId] === nextTeamId) return prev;
        return { ...prev, [userId]: nextTeamId };
      });
    },
    [users]
  );

  const handleSelectTeam = useCallback(
    (userId: number, teamId: number | null) => {
      setSelectedTeamByUser((prev) =>
        prev[userId] === teamId ? prev : { ...prev, [userId]: teamId }
      );
    },
    []
  );

  // colgroup reflecting visible columns, all the same width
  const cols = useMemo(() => {
    const arr: JSX.Element[] = [
      <col key="name" className={W_MAIN} />,
      <col key="email" className={W_MAIN} />,
      <col key="org" className={W_MAIN} />,
      <col key="orgRole" className={W_ROLE} />,
      <col key="orgInvite" className={W_STATUS} />,
    ];
    if (showTeam) arr.push(<col key="team" className={W_MAIN} />);
    if (showTeamRole) arr.push(<col key="teamRole" className={W_ROLE} />);
    if (showTeamInvite) arr.push(<col key="teamInvite" className={W_STATUS} />);
    arr.push(<col key="actions" className={W_ACTION} />);
    return arr;
  }, [showTeam, showTeamRole, showTeamInvite]);

  if (isLoading) return <div>Loading users...</div>;
  if (error) return <div className="text-red-600">Error: {error.message}</div>;

  return (
    <div className="w-full overflow-x-auto">
      <Table className="table-fixed w-full">
        <colgroup>{cols}</colgroup>
        <TableHeader>
          <TableRow>
            <TableHead>
              <span className="flex items-center gap-2 whitespace-nowrap">
                Name <LetterText size={16} />
              </span>
            </TableHead>
            <TableHead>
              <span className="flex items-center gap-2 whitespace-nowrap">
                Email <AtSign size={16} />
              </span>
            </TableHead>
            <TableHead>
              <span className="flex items-center gap-2 whitespace-nowrap">
                Organization <Building size={16} />
              </span>
            </TableHead>
            <TableHead>
              <span className="flex items-center gap-2 whitespace-nowrap">
                Org Role <BriefcaseBusiness size={16} />
              </span>
            </TableHead>
            <TableHead>
              <span className="flex items-center justify-center gap-2 whitespace-nowrap">
                Org Invite Status <Inbox size={16} />
              </span>
            </TableHead>

            {showTeam && (
              <TableHead>
                <span className="flex items-center gap-2 whitespace-nowrap">
                  Team <UsersRound size={16} />
                </span>
              </TableHead>
            )}
            {showTeamRole && (
              <TableHead>
                <span className="flex items-center gap-2 whitespace-nowrap">
                  Team Role <Briefcase size={16} />
                </span>
              </TableHead>
            )}
            {showTeamInvite && (
              <TableHead>
                <span className="flex items-center justify-center gap-2 whitespace-nowrap">
                  Team Invite Status <Inbox size={16} />
                </span>
              </TableHead>
            )}

            <TableHead>
              <span className="flex items-center justify-center gap-2 whitespace-nowrap">
                Actions <Clapperboard size={16} />
              </span>
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {users.map((user) => {
            // ----- ORG SELECTION / ROLE / INVITE STATUS -----
            const selectedOrgId =
              selectedOrgByUser[user.id] ?? user.orgs[0]?.orgId ?? null;

            const orgObj =
              user.orgs.find((o) => o.orgId === selectedOrgId) ?? null;

            // org invite: if missing but role exists, assume ACCEPTED; if both missing, show PENDING
            const orgInviteStatus =
              (orgObj as ExtendedOrg)?.organizationInviteStatus ??
              (orgObj?.role ? "ACCEPTED" : "PENDING");

            // org role: if missing and invite is PENDING, show "Pending"
            const orgRoleLabel =
              orgObj?.role ?? (orgInviteStatus === "PENDING" ? "Pending" : "—");

            // ----- TEAM SELECTION / ROLE / INVITE STATUS -----
            const teamsInOrg =
              selectedOrgId != null
                ? user.teams.filter((t) => t.orgId === selectedOrgId)
                : [];

            const selectedTeamId =
              selectedTeamByUser[user.id] ??
              (teamsInOrg.length ? teamsInOrg[0].teamId : null);

            const selectedTeam =
              teamsInOrg.find((t) => t.teamId === selectedTeamId) ?? null;

            // team invite always exists per your data model
            const teamInviteStatus =
              (selectedTeam as ExtendedTeam)?.teamInviteStatus ?? "—";

            const teamRole =
              selectedTeam?.role ??
              (teamInviteStatus === "PENDING" ? "Pending" : "—");

            return (
              <TableRow key={user.id}>
                <TableCell className="font-medium truncate">
                  {user.name}
                </TableCell>
                <TableCell className="truncate">{user.email}</TableCell>

                {/* Organization selector */}
                <TableCell>
                  <SelectScrollable
                    orgs={user.orgs}
                    value={selectedOrgId}
                    onChange={(orgId) => handleSelectOrg(user.id, orgId)}
                    placeholder="Select organization"
                    className="w-full cursor-pointer"
                  />
                </TableCell>

                <TableCell>
                  <Badge
                    variant={
                      orgRoleLabel === "OWNER"
                        ? "default"
                        : orgRoleLabel === "ADMIN"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {orgRoleLabel}
                  </Badge>
                </TableCell>

                <TableCell className="text-center whitespace-nowrap">
                  <Badge variant="outline">
                    {orgInviteStatus === "ACCEPTED" ? (
                      <CircleCheck color="#00bd1f" />
                    ) : orgInviteStatus === "PENDING" ? (
                      <Loader color="#d1b202" />
                    ) : (
                      <CircleX color="#fa0000" />
                    )}
                    {orgInviteStatus}
                  </Badge>
                </TableCell>

                {showTeam && (
                  <TableCell>
                    <SelectTeamsScrollable
                      teams={teamsInOrg}
                      value={selectedTeamId}
                      onChange={(teamId) => handleSelectTeam(user.id, teamId)}
                      placeholder="Select team"
                      className="w-full cursor-pointer"
                      disabled={teamsInOrg.length === 0}
                    />
                  </TableCell>
                )}

                {showTeamRole && (
                  <TableCell>
                    <Badge
                      variant={teamRole === "LEAD" ? "secondary" : "outline"}
                    >
                      {teamRole}
                    </Badge>
                  </TableCell>
                )}

                {showTeamInvite && (
                  <TableCell className="text-center whitespace-nowrap">
                    <Badge variant="outline">
                      {teamInviteStatus === "ACCEPTED" ? (
                        <CircleCheck color="#00bd1f" />
                      ) : teamInviteStatus === "PENDING" ? (
                        <Loader color="#d1b202" />
                      ) : (
                        <CircleX color="#fa0000" />
                      )}
                      {teamInviteStatus}
                    </Badge>
                  </TableCell>
                )}

                {/* Actions */}
                <TableCell className="text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          Invite User
                        </DropdownMenuSubTrigger>

                        <DropdownMenuSubContent alignOffset={8}>
                          <div
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1"
                          >
                            <InviteToTeam
                              userName={user.name}
                              userEmail={user.email}
                              userId={user.id}
                              onRowAction={onRowAction}
                            />
                          </div>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>

                      <DropdownMenuItem
                        variant="destructive"
                        //Never call handler on an event directly, always wrap in another function to avoid immediate call
                        onSelect={() =>
                          console.log("Delete user:", user.name, user.email)
                        }
                      >
                        Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="mt-6 flex justify-between items-center">
        <Pagination>
          <PaginationContent className="gap-2">
            <PaginationItem>
              <PaginationPrevious
                href="#"
                aria-disabled={!canPrev}
                onClick={(e) => {
                  e.preventDefault();
                  if (canPrev) onPrevious();
                }}
                className={!canPrev ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>

            <PaginationItem className="pointer-events-none select-none px-2">
              <span
                className="text-sm text-muted-foreground"
                aria-live="polite"
                aria-atomic="true"
              >
                Showing {approxShown} of {total}
              </span>
            </PaginationItem>

            <PaginationItem>
              <PaginationNext
                href="#"
                aria-disabled={disableNext || undefined}
                aria-busy={isFetchingNextPage || undefined}
                onClick={(e) => {
                  e.preventDefault();
                  if (!disableNext) onNext();
                }}
                className={[
                  "relative pr-6",
                  disableNext ? "pointer-events-none opacity-50" : "",
                  isFetchingNextPage
                    ? [
                        "[&>svg]:invisible",
                        "after:content-[''] after:absolute after:right-4",
                        "after:top-1/2 after:-translate-y-1/2",
                        "after:h-3 after:w-3 after:rounded-full",
                        "after:border-2 after:border-current after:border-t-transparent",
                        "after:animate-spin",
                      ].join(" ")
                    : "",
                ].join(" ")}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
