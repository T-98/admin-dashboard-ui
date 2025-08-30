"use client";

import { Suspense, useMemo, useState, useEffect, createContext } from "react";
import { useRouter } from "next/navigation";
import { useSuspenseQuery } from "@tanstack/react-query";
import UserListContainer from "@/components/UserListContainer";
import SearchBar, { ColumnId } from "@/components/search/SearchBar";
import UserTableSkeleton from "@/components/UserTableSkeleton";
import type { SearchParams } from "@/hooks/usePaginatedUsers";
import type { SearchKey } from "@/lib/search-build";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3000";

type Props = SearchParams;

function CurrentUserBootstrap({
  user,
}: {
  user: { userId: number; email: string };
}) {
  useSuspenseQuery({
    queryKey: ["currentUserOrganizations", user.userId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/organizations/${user.userId}`, {
        headers: { "x-email": user.email, "x-password": "JaiGuru69" },
      });
      if (!res.ok) throw new Error("Failed to load organizations");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useSuspenseQuery({
    queryKey: ["currentUserTeams", user.userId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/teams/${user.userId}`, {
        headers: { "x-email": user.email, "x-password": "JaiGuru69" },
      });
      if (!res.ok) throw new Error("Failed to load teams");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  return null;
}

export default function UsersClient(initial: Props) {
  // 1) Hooks first, always
  const [selected, setSelected] = useState<Set<ColumnId>>(new Set());
  const extraColumns = useMemo(() => Array.from(selected), [selected]);

  type CurrentUser = { userId: number; name: string; email: string } | null;
  const [user, setUser] = useState<CurrentUser>(null);
  const [checked, setChecked] = useState(false);
  const router = useRouter();

  // Search key state MUST be declared before any early return
  const [searchKey, setSearchKey] = useState<SearchKey>({
    take: 10,
    order: "asc",
    ...(initial.q ? { q: initial.q } : {}),
    ...(initial.q && initial.sortBy ? { sortBy: initial.sortBy as any } : {}),
  });

  // 2) Side effects
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

  // 2) Now it’s safe to guard the UI
  if (!checked || !user?.userId) return null;

  // 3) Render
  return (
    <>
      <Suspense fallback={null}>
        <CurrentUserBootstrap
          user={{ userId: user.userId, email: user.email }}
        />
      </Suspense>

      <SearchBar
        selected={selected}
        onChange={setSelected}
        onQueryChange={setSearchKey}
      />

      <Suspense
        fallback={<UserTableSkeleton rows={10} extraColumns={extraColumns} />}
      >
        <UserListContainer {...searchKey} extraColumns={extraColumns} />
      </Suspense>
    </>
  );
}
