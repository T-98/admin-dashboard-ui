"use client";

import { Suspense, useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import UserListContainer from "@/components/UserListContainer";
import SearchBar, { ColumnId } from "@/components/search/SearchBar";
import UserTableSkeleton from "@/components/UserTableSkeleton";
import type { SearchParams } from "@/hooks/usePaginatedUsers";
import type { SearchKey } from "@/lib/search-build";
import { CurrentUserProvider } from "@/contexts/CurrentUserContext";

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
          <UserListContainer {...searchKey} extraColumns={extraColumns} />
        </CurrentUserProvider>
      </Suspense>
    </>
  );
}
