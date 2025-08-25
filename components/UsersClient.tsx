// components/UsersClient.tsx
"use client";
import { Suspense, useMemo, useState, useCallback } from "react";
import UserListContainer from "@/components/UserListContainer";
import SearchBar, { ColumnId } from "@/components/search/SearchBar";
import type { SearchParams } from "@/hooks/usePaginatedUsers";
import type { SearchKey } from "@/lib/search-build";
import UserTableSkeleton from "@/components/UserTableSkeleton";

type Props = SearchParams;

export default function UsersClient(initial: Props) {
  const [selected, setSelected] = useState<Set<ColumnId>>(new Set());
  const extraColumns = useMemo(() => Array.from(selected), [selected]);

  // Start with server-provided defaults (q/sortBy/order/take) if you want:
  const [searchKey, setSearchKey] = useState<SearchKey>({
    take: 10,
    order: "asc",
    ...(initial.q ? { q: initial.q } : {}),
    ...(initial.q && initial.sortBy ? { sortBy: initial.sortBy as any } : {}),
    // organizationName/teamName start empty
  });

  const handleQueryChange = useCallback((key: SearchKey) => {
    setSearchKey(key);
  }, []);

  return (
    <>
      <SearchBar
        selected={selected}
        onChange={setSelected}
        onQueryChange={handleQueryChange}
      />
      <Suspense
        fallback={<UserTableSkeleton rows={10} extraColumns={extraColumns} />}
      >
        <UserListContainer {...searchKey} extraColumns={extraColumns} />
      </Suspense>
    </>
  );
}
