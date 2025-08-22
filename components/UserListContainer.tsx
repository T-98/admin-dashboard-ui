// components/UserListContainer.tsx
"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import UserListView from "./UserListView";
import type { SearchParams } from "@/hooks/usePaginatedUsers";
import { useUsersInfinite } from "@/hooks/useUsersInfinite";
import type { ColumnId } from "@/components/SearchBar";

interface Props extends SearchParams {
  extraColumns?: ColumnId[]; // NEW
}

export default function UserListContainer({
  q,
  sortBy,
  order = "asc",
  take = 10,
  filterBy,
  extraColumns = [], // NEW
}: Props) {
  const params = useMemo(
    () => ({ q, sortBy, order, take, filterBy }),
    [q, sortBy, order, take, filterBy]
  );

  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useUsersInfinite(params);

  const [pageIndex, setPageIndex] = useState(0);
  useEffect(
    () => setPageIndex(0),
    [params.q, params.sortBy, params.order, params.take, params.filterBy]
  );

  const pages = data.pages;
  const current = pages[Math.min(pageIndex, pages.length - 1)];

  const onNext = useCallback(async () => {
    if (pageIndex < pages.length - 1) {
      setPageIndex((i) => i + 1);
      return;
    }
    if (hasNextPage) {
      await fetchNextPage();
      setPageIndex((i) => i + 1);
    }
  }, [pageIndex, pages.length, hasNextPage, fetchNextPage]);

  const onPrevious = useCallback(() => {
    if (pageIndex === 0) return;
    setPageIndex((i) => i - 1);
  }, [pageIndex]);

  const canNext =
    (pageIndex < pages.length - 1 || hasNextPage) && !isFetchingNextPage;

  return (
    <UserListView
      users={current?.users ?? []}
      total={current?.total ?? 0}
      take={take}
      pageIndex={pageIndex}
      isLoading={false}
      error={null}
      onNext={onNext}
      onPrevious={onPrevious}
      hasNext={canNext}
      isFetchingNextPage={isFetchingNextPage}
      extraColumns={extraColumns} // NEW
    />
  );
}
