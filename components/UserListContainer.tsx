"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import UserListView from "./UserListView";
import type { SearchParams } from "@/hooks/usePaginatedUsers";
import { useUsersInfinite } from "@/hooks/useUsersInfinite";

interface Props extends SearchParams {}

export default function UserListContainer({
  q,
  sortBy,
  order = "asc",
  take = 10,
  filterBy,
}: Props) {
  const params = useMemo(
    () => ({ q, sortBy, order, take, filterBy }),
    [q, sortBy, order, take, filterBy]
  );

  const {
    data, // { pages: PaginatedResponse[], pageParams: [] }
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage, // doesn't suspend; good for disabling "Next"
  } = useUsersInfinite(params);

  // Local page pointer into the loaded pages array
  const [pageIndex, setPageIndex] = useState(0);

  // When the query key (params) change, reset the index to 0
  useEffect(
    () => setPageIndex(0),
    [params.q, params.sortBy, params.order, params.take, params.filterBy]
  );

  const pages = data.pages;
  const current = pages[Math.min(pageIndex, pages.length - 1)];

  const onNext = useCallback(async () => {
    // If we already have the next page loaded, just advance pointer.
    if (pageIndex < pages.length - 1) {
      setPageIndex((i) => i + 1);
      return;
    }
    // Otherwise, fetch next page if available, then advance.
    if (hasNextPage) {
      await fetchNextPage();
      setPageIndex((i) => i + 1);
    }
  }, [pageIndex, pages.length, hasNextPage, fetchNextPage]);

  const onPrevious = useCallback(() => {
    if (pageIndex === 0) return;
    setPageIndex((i) => i - 1);
  }, [pageIndex]);

  // Enable "Next" if either a page beyond the pointer is already loaded,
  // or the API says there's another page (hasNextPage). Also disable while fetching.
  const canNext =
    (pageIndex < pages.length - 1 || hasNextPage) && !isFetchingNextPage;

  // Compute "Showing X of total" accurately even for skinny pages
  const shownBefore = pages
    .slice(0, pageIndex)
    .reduce((acc, p) => acc + p.users.length, 0);
  const shown = Math.min(
    shownBefore + (current?.users.length ?? 0),
    current?.total ?? 0
  );

  return (
    <UserListView
      users={current?.users ?? []}
      total={current?.total ?? 0}
      take={take}
      pageIndex={pageIndex}
      isLoading={false} // Suspense handled initial load
      error={null} // Use an <ErrorBoundary> up the tree if desired
      onNext={onNext}
      onPrevious={onPrevious}
      hasNext={canNext}
      isFetchingNextPage={isFetchingNextPage}
    />
  );
}
