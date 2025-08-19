// hooks/usePaginatedUsers.ts
import { useInfiniteQuery } from "@tanstack/react-query";
import { userFetcher} from "./user-fetcher";


export interface Org {
  orgId: number;
  name: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
}

export interface Team {
  teamId: number;
  name: string;
  role: "LEAD" | "MEMBER" | "VIEWER";
  orgId: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  organizationIds: number[];
  teamIds: number[];
  orgs: Org[];
  teams: Team[];
}

export interface SearchParams {
  q?: string;
  sortBy?: string;
  order?: "asc" | "desc";
  take?: number;
}

export interface PaginatedResponse {
  users: User[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

export function usePaginatedUsers(params: SearchParams) {
  return useInfiniteQuery<PaginatedResponse>({
    queryKey: ["users", params],
    queryFn: ({ pageParam = null }) => userFetcher(params, pageParam),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: null,
  });
}
