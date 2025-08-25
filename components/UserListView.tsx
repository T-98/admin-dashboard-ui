// components/UserListView.tsx
import { useEffect, useState, useCallback } from "react";
import type { User } from "@/hooks/usePaginatedUsers";
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
import { MoreVertical } from "lucide-react";

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
  searchParams: any;
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
}: Props) {
  const approxShown = Math.min((pageIndex + 1) * take, total);
  const canPrev = pageIndex > 0;
  const disableNext = !hasNext || isFetchingNextPage;

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

      if (defaultOrgId == null) {
        defaultOrgId = u.orgs[0]?.orgId ?? null;
      }
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

      if (defaultTeamId == null) {
        defaultTeamId = teamsInOrg[0]?.teamId ?? null;
      }

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

      // When org changes, reset team to first team in that org
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

  if (isLoading) return <div>Loading users...</div>;
  if (error) return <div className="text-red-600">Error: {error.message}</div>;

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[220px]">Name</TableHead>
            <TableHead className="w-[260px]">Email</TableHead>
            <TableHead className="w-[280px]">Organization</TableHead>
            <TableHead>Org Role</TableHead>
            <TableHead className="text-center">Org Invite Status</TableHead>

            {extraColumns.includes("team") && (
              <TableHead className="w-[280px]">Team</TableHead>
            )}
            {extraColumns.includes("teamRole") && (
              <TableHead>Team Role</TableHead>
            )}
            {extraColumns.includes("teamInviteStatus") && (
              <TableHead className="text-center">Team Invite Status</TableHead>
            )}

            {/* Actions header to keep columns aligned */}
            <TableHead className="text-center">Actions</TableHead>
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
              (orgObj as any)?.organizationInviteStatus ??
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
              (selectedTeam as any)?.teamInviteStatus ?? "—";

            const teamRole =
              selectedTeam?.role ??
              (teamInviteStatus === "PENDING" ? "Pending" : "—");

            return (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell className="truncate">{user.email}</TableCell>

                {/* Organization */}
                <TableCell>
                  <SelectScrollable
                    orgs={user.orgs}
                    value={selectedOrgId}
                    onChange={(orgId) => handleSelectOrg(user.id, orgId)}
                    placeholder="Select organization"
                    className="w-[260px] cursor-pointer"
                  />
                </TableCell>

                {/* Org Role */}
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

                {/* Org Invite Status */}
                <TableCell className="text-center">{orgInviteStatus}</TableCell>

                {/* Team selector (optional) */}
                {extraColumns.includes("team") && (
                  <TableCell>
                    <SelectTeamsScrollable
                      teams={teamsInOrg}
                      value={selectedTeamId}
                      onChange={(teamId) => handleSelectTeam(user.id, teamId)}
                      placeholder="Select team"
                      className="w-[260px] cursor-pointer"
                      disabled={teamsInOrg.length === 0}
                    />
                  </TableCell>
                )}

                {/* Team Role (optional) */}
                {extraColumns.includes("teamRole") && (
                  <TableCell>
                    <Badge
                      variant={teamRole === "LEAD" ? "secondary" : "outline"}
                    >
                      {teamRole}
                    </Badge>
                  </TableCell>
                )}

                {/* Team Invite Status (optional) */}
                {extraColumns.includes("teamInviteStatus") && (
                  <TableCell className="text-center">
                    {teamInviteStatus}
                  </TableCell>
                )}

                {/* Actions */}
                <TableCell className="text-center">
                  <Button variant="outline" className="cursor-pointer">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
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
