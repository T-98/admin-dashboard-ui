"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export type OrganizationMembership = {
  organizationId: number;
  role?: string | null;
  organization: { name: string };
};

export type TeamMembership = {
  teamId: number;
  role?: string | null;
  team: { name: string; organizationId: number };
};

export type CurrentUserMap = {
  organizations: OrganizationMembership[];
  teams: TeamMembership[];
};

export const CurrentUserContext = createContext<CurrentUserMap | null>(null);

export function useCurrentUserContext() {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) {
    throw new Error(
      "useCurrentUserContext must be used within CurrentUserProvider"
    );
  }
  return ctx;
}

export function CurrentUserProvider({
  user,
  children,
}: {
  user: { userId: number; email: string };
  children: ReactNode;
}) {
  // Organizations
  const { data: orgs } = useSuspenseQuery({
    queryKey: ["currentUserOrganizations", user.userId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/organizations/${user.userId}`, {
        headers: { "x-email": user.email, "x-password": "password123" }, // demo-only
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load organizations");
      return res.json() as Promise<OrganizationMembership[]>;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Teams
  const { data: teams } = useSuspenseQuery({
    queryKey: ["currentUserTeams", user.userId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/teams/${user.userId}`, {
        headers: { "x-email": user.email, "x-password": "password123" }, // demo-only
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load teams");
      return res.json() as Promise<TeamMembership[]>;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const value = useMemo<CurrentUserMap>(
    () => ({ organizations: orgs ?? [], teams: teams ?? [] }),
    [orgs, teams]
  );

  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
}
