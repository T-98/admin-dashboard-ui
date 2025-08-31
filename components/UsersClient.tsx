"use client";

import { Suspense, useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import UserListContainer from "@/components/UserListContainer";
import SearchBar, { ColumnId } from "@/components/search/SearchBar";
import UserTableSkeleton from "@/components/UserTableSkeleton";
import type { SearchParams } from "@/hooks/usePaginatedUsers";
import type { SearchKey } from "@/lib/search-build";
import {
  CurrentUserProvider,
  OrganizationMembership,
  TeamMembership,
} from "@/contexts/CurrentUserContext";
import { RowActionPayload } from "./UserListView";
import type { User, Org, Team } from "@/hooks/usePaginatedUsers";

type Props = SearchParams;

export default function UsersClient(initial: Props) {
  // columns
  const [selected, setSelected] = useState<Set<ColumnId>>(new Set());
  const extraColumns = useMemo(() => Array.from(selected), [selected]);

  // session user bootstrap
  type CurrentUser = { userId: number; name: string; email: string } | null;
  const [user, setUser] = useState<CurrentUser>(null);
  const [checked, setChecked] = useState(false);
  const router = useRouter();

  // search key state (declare BEFORE any early return)
  const [searchKey, setSearchKey] = useState<SearchKey>({
    take: 10,
    order: "asc",
    ...(initial.q ? { q: initial.q } : {}),
    ...(initial.q && initial.sortBy ? { sortBy: initial.sortBy as any } : {}),
  });

  /*
export type RowActionPayload = {
  action: RowAction;
  userName: string;
  userId: number;
  userEmail: string;
  invitedTo: string;
  team?: TeamMembership;
  organization?: OrganizationMembership;
};
*/
  const handleRowAction = (payload: RowActionPayload): string => {
    console.log("Row action triggered for user:", payload.userName);
    switch (payload.action) {
      case "invite-user":
        if (payload.invitedTo === "organization" && payload.organization) {
          handleOrgInvite(payload.organization);
        } else if (payload.team) {
          handleTeamInvite(payload.team);
        }
        return "Invite sent";
      case "delete-user":
        console.log("Deleting user with ID:", payload.userId);
        return handleDelete({
          userId: payload.userId,
          name: payload.userName,
          email: payload.userEmail,
        });
      default:
        console.warn("Unknown action:", payload.action);
        return "Unknown action";
    }
  };

  // export type OrganizationMembership = {
  //   organizationId: number;
  //   role?: string | null;
  //   organization: { name: string };
  // };

  const handleOrgInvite = (organization: OrganizationMembership): string => {
    console.log("Invite action triggered for entities:", organization);
    // Implement the invite logic here, e.g., open a modal or send an API request
    return "Invite action completed";
  };

  const handleTeamInvite = (team: TeamMembership): string => {
    console.log("Invite action triggered for team:", team);
    // Implement the invite logic here, e.g., open a modal or send an API request
    return "Invite action completed";
  };

  const handleDelete = (user: any): string => {
    console.log("Delete action triggered for user:", user);
    // Implement the delete logic here, e.g., open a modal or send an API request
    return "Delete action completed";
  };

  // on mount, check session storage for user; if missing/invalid, redirect to login
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("currentUser");
      const parsed = raw ? (JSON.parse(raw) as CurrentUser) : null;
      if (!parsed?.userId) {
        router.replace("/login");
      } else {
        setUser(parsed);
      }
    } catch {
      router.replace("/login");
    } finally {
      setChecked(true);
    }
  }, [router]);

  if (!checked || !user?.userId) return null;

  return (
    <>
      <SearchBar
        selected={selected}
        onChange={setSelected}
        onQueryChange={setSearchKey}
      />

      <Suspense
        fallback={<UserTableSkeleton rows={10} extraColumns={extraColumns} />}
      >
        <CurrentUserProvider user={{ userId: user.userId, email: user.email }}>
          <UserListContainer
            {...searchKey}
            extraColumns={extraColumns}
            onRowAction={handleRowAction}
          />
          +{" "}
        </CurrentUserProvider>
      </Suspense>
    </>
  );
}
