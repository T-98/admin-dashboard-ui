"use client";
import { Suspense, useMemo, useState } from "react";
import UserListContainer from "@/components/UserListContainer";
import SearchBar, { ColumnId } from "@/components/search/SearchBar";
import type { SearchParams } from "@/hooks/usePaginatedUsers";

type Props = SearchParams;

export default function UsersClient(props: Props) {
  const [selected, setSelected] = useState<Set<ColumnId>>(new Set());
  const extraColumns = useMemo(() => Array.from(selected), [selected]);

  return (
    <>
      <SearchBar selected={selected} onChange={setSelected} />
      <Suspense fallback={<div>Loading users...</div>}>
        <UserListContainer {...props} extraColumns={extraColumns} />
      </Suspense>
    </>
  );
}
