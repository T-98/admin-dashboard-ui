"use client";

import { Suspense, useMemo, useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
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
import axios from "axios";
import { toast } from "sonner";

type Props = SearchParams;

export default function UsersClient(initial: Props) {
  // columns
  const [selected, setSelected] = useState<Set<ColumnId>>(new Set());
  const extraColumns = useMemo(() => Array.from(selected), [selected]);

  // session user bootstrap
  type CurrentUser = {
    userId: number;
    name: string;
    email: string;
    password: string;
  } | null;

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

  // ✅ Org invite mutation
  const inviteToOrg = useMutation({
    mutationKey: ["inviteToOrg"],
    mutationFn: async ({
      organization,
      invitedUser,
      auth,
    }: {
      organization: OrganizationMembership;
      invitedUser: { userName: string; userId: number; userEmail: string };
      auth: { email: string; password: string };
    }) => {
      return axios.post(
        "http://localhost:3000/api/invites",
        {
          email: invitedUser.userEmail,
          invitedUserId: invitedUser.userId,
          orgRole: organization.role,
          organizationId: organization.organizationId,
          organizationName: organization.organization.name,
        },
        {
          headers: {
            "x-email": auth.email,
            "x-password": auth.password,
          },
          validateStatus: () => true, // let us handle non-2xx
        }
      );
    },
    onSuccess: (res, vars) => {
      if (res.status >= 200 && res.status < 300) {
        toast.success("Invite sent", {
          description: `Invited ${vars.invitedUser.userEmail} to ${
            vars.organization.organization.name
          } as ${vars.organization.role ?? "MEMBER"}.`,
        });
      } else {
        const msg =
          (res.data as any)?.message ||
          `Failed to send invite (HTTP ${res.status})`;
        toast.error("Invite failed", { description: msg });
      }
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      toast.error("Network error", { description: msg });
    },
  });

  // ✅ Team invite mutation
  const inviteToTeam = useMutation({
    mutationKey: ["inviteToTeam"],
    mutationFn: async ({
      payload,
      auth,
    }: {
      payload: {
        email: string;
        orgRole: string;
        organizationId: number;
        organizationName: string;
        teamRole: string;
        teamId: number;
        teamName: string;
        invitedUserId: number;
      };
      auth: { email: string; password: string };
    }) => {
      return axios.post("http://localhost:3000/api/invites", payload, {
        headers: {
          "x-email": auth.email,
          "x-password": auth.password,
        },
        validateStatus: () => true,
      });
    },
    onSuccess: (res, vars) => {
      if (res.status >= 200 && res.status < 300) {
        toast.success("Team invite sent", {
          description: `Invited ${vars.payload.email} to ${vars.payload.teamName} (${vars.payload.organizationName}) as ${vars.payload.teamRole}.`,
        });
      } else {
        const msg =
          (res.data as any)?.message ||
          `Failed to send team invite (HTTP ${res.status})`;
        toast.error("Team invite failed", { description: msg });
      }
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      toast.error("Network error", { description: msg });
    },
  });

  const handleRowAction = (payload: RowActionPayload): string => {
    console.log("Row action triggered for user:", payload.userName);

    switch (payload.action) {
      case "invite-user": {
        // ORG invites
        if (payload.invitedTo === "organization" && payload.organization) {
          return handleOrgInvite(payload.organization, {
            userName: payload.userName,
            userId: payload.userId,
            userEmail: payload.userEmail,
          });
        }

        // TEAM invites
        if (payload.invitedTo === "team" && payload.team) {
          // You currently don't pass organization with team payloads.
          // Prevent fall-through to "delete-user".
          if (!payload.organization) {
            console.warn("Team invite missing organization; ignoring invite.");
            return "Invite action ignored";
          }
          return handleTeamInvite(payload.organization, payload.team, {
            userName: payload.userName,
            userId: payload.userId,
            userEmail: payload.userEmail,
          });
        }

        // Nothing matched → explicitly return to avoid fall-through
        return "Invite action ignored";
      }

      case "delete-user": {
        console.log("Deleting user with ID:", payload.userId);
        return handleDelete({
          userId: payload.userId,
          name: payload.userName,
          email: payload.userEmail,
        });
      }

      default: {
        console.warn("Unknown action:", payload.action);
        return "Unknown action";
      }
    }
  };

// 🔁 Uses the org mutation
const handleOrgInvite = (
  organization: OrganizationMembership,
  invitedUser: { userName: string; userId: number; userEmail: string }
): string => {
  inviteToOrg
    .mutateAsync({
      organization,
      invitedUser,
      auth: { email: user?.email || "", password: user?.password || "" },
    })
    .catch(() => {});
  return "Invite action completed";
};

// 🔁 Uses the team mutation with your required payload
const handleTeamInvite = (
  org: OrganizationMembership,
  team: TeamMembership,
  invitedUser: { userName: string; userId: number; userEmail: string }
): string => {
  const payload = {
    email: invitedUser.userEmail,
    orgRole: org.role ?? "MEMBER",
    organizationId: org.organizationId,
    organizationName: org.organization.name,
    teamRole: team.role ?? "MEMBER",
    teamId: team.teamId,
    teamName: team.team?.name ?? "",
    invitedUserId: invitedUser.userId,
  };

  inviteToTeam
    .mutateAsync({
      payload,
      auth: { email: user?.email || "", password: user?.password || "" },
    })
    .catch(() => {});
  return "Invite action completed";
};

  const handleDelete = (user: any): string => {
    console.log("Delete action triggered for user:", user);
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
