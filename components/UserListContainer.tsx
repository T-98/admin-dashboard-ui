// components/UserListContainer.tsx
"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import UserListView, { RowActionPayload } from "./UserListView";
import type { SearchParams } from "@/hooks/usePaginatedUsers";
import { useUsersInfinite } from "@/hooks/useUsersInfinite";
import type { ColumnId } from "@/components/search/SearchBar";
import type { CurrentUser } from "./UsersClient";

interface Props extends SearchParams {
  extraColumns?: ColumnId[];
  onRowAction?: (payload: RowActionPayload) => string;
  currentUser: CurrentUser;
}

export default function UserListContainer({
  q,
  sortBy,
  order = "asc",
  take = 10,
  organizationName,
  teamName,
  extraColumns = [],
  onRowAction,
  currentUser,
}: Props) {
  const params = useMemo(
    () => ({ q, sortBy, order, take, organizationName, teamName }),
    [q, sortBy, order, take, organizationName, teamName]
  );

  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useUsersInfinite(params, currentUser);

  const [pageIndex, setPageIndex] = useState(0);
  useEffect(
    () => setPageIndex(0),
    [
      params.q,
      params.sortBy,
      params.order,
      params.take,
      params.organizationName,
      params.teamName,
    ]
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

  const handleRowAction = useCallback((p: RowActionPayload) => {
    switch (p.action) {
      case "invite-user":
        // trigger mutation / open dialog / toast
        console.log("Invite user:", p.userName, p.userEmail);
        break;
      case "delete-user":
        // confirm + mutation
        console.log("Delete user:", p.userName, p.userEmail);
        break;
    }
  }, []);

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
      extraColumns={extraColumns}
      searchParams={params}
      onRowAction={onRowAction}
    />
  );
}
