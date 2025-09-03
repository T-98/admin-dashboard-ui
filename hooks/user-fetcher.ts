// hooks/user-fetcher.ts
import axios from "axios";
import type { PaginatedResponse, SearchParams } from "./usePaginatedUsers";
import type { CurrentUser } from "@/components/UsersClient";

// Note: If you need auth headers, consider using context or a global state
// to provide the necessary credentials to the fetcher function.
// For this example, we'll assume no auth is needed or it's handled globally.

export async function userFetcher(
  params: SearchParams,
  nextCursor: string | null,
  currentUser: CurrentUser
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
  const base = process.env.NEXT_PUBLIC_API_BASE;
  const url = `${base}/api/users/search`;

  const res = await axios.get<PaginatedResponse>(url, {
    params: query,
    headers: {
      // Prefer NEXT_PUBLIC_* if you want to read from env on the client
      "x-email": process.env.NEXT_PUBLIC_SEARCH_API_EMAIL ?? currentUser?.email,
      "x-password":
        process.env.NEXT_PUBLIC_SEARCH_API_PASSWORD ?? currentUser?.password,
    },
  });

  return res.data;
}

export type { PaginatedResponse, SearchParams };
