// hooks/useUsersInfinite.tsx
import { useMemo } from "react";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import type { PaginatedResponse, SearchParams } from "./usePaginatedUsers";
import { userFetcher } from "./user-fetcher";

export function useUsersInfinite(params: SearchParams) {
  const keyParams = useMemo(
    () => ({
      q: params.q,
      sortBy: params.sortBy,
      order: params.order,
      take: params.take,
      organizationName: params.organizationName,
      teamName: params.teamName,
    }),
    [
      params.q,
      params.sortBy,
      params.order,
      params.take,
      params.organizationName,
      params.teamName,
    ]
  );

  return useSuspenseInfiniteQuery<PaginatedResponse, Error>({
    queryKey: ["users", keyParams],
    queryFn: ({ pageParam = null }) =>
      userFetcher(keyParams, pageParam as string | null),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    getPreviousPageParam: () => undefined,
  });
}
