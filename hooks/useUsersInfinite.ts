import { useMemo } from "react";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import type { PaginatedResponse, SearchParams } from "./usePaginatedUsers";
import { userFetcher } from "./user-fetcher";

// Forward-only cursor pagination: nextCursor only.
export function useUsersInfinite(params: SearchParams) {
    
  const keyParams = useMemo(
    () => ({
      q: params.q,
      sortBy: params.sortBy,
      order: params.order,
      take: params.take,
      filterBy: params.filterBy,
    }),
    [params.q, params.sortBy, params.order, params.take, params.filterBy]
  );

  return useSuspenseInfiniteQuery<PaginatedResponse, Error>({
    queryKey: ["users", keyParams],
    queryFn: ({ pageParam = null }: { pageParam?: unknown }) =>
      userFetcher(keyParams, pageParam as string | null), // React Query provides pageParam as unknown, cast to expected type
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    // We don't have a prev cursor from the API; we just move the local index back.
    getPreviousPageParam: () => undefined,
  });
}
