// hooks/user-fetcher.ts
import axios from "axios";
import type { PaginatedResponse, SearchParams } from "./usePaginatedUsers";

export async function userFetcher(
  params: SearchParams,
  nextCursor: string | null
) {
  const q = (params.q ?? "").trim();

  const query: Record<string, string> = {
    take: String(params.take ?? 10),
    order: params.order ?? "asc",
  };

  if (q) {
    query.q = q;
    if (params.sortBy) query.sortBy = params.sortBy;
  }
  if ((params as any).organizationName?.trim()) {
    query.organizationName = (params as any).organizationName.trim();
  }
  if ((params as any).teamName?.trim()) {
    query.teamName = (params as any).teamName.trim();
  }
  if (nextCursor) query.nextCursor = nextCursor;

  // Calls Nest directly
  const base = "http://localhost:3000";
  const url = `${base}/api/users/search`;

  const res = await axios.get<PaginatedResponse>(url, {
    params: query,
    headers: {
      // Prefer NEXT_PUBLIC_* if you want to read from env on the client
      "x-email":
        process.env.NEXT_PUBLIC_SEARCH_API_EMAIL ?? "kennith77@hotmail.com",
      "x-password":
        process.env.NEXT_PUBLIC_SEARCH_API_PASSWORD ?? "password123",
    },
  });

  return res.data;
}

export type { PaginatedResponse, SearchParams };
