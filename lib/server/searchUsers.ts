// lib/server/searchUsers.ts
import "server-only";
import type { PaginatedResponse } from "@/hooks/usePaginatedUsers";
import type { NormalizedSearchParams } from "@/lib/normalizeSearchParams";
import { ENV } from "@/lib/env";

type Input = NormalizedSearchParams & { nextCursor?: string | null };

export async function searchUsersServer(
  input: Input
): Promise<PaginatedResponse> {
  const qs = new URLSearchParams();
  if (input.q) qs.set("q", input.q);
  if (input.sortBy) qs.set("sortBy", input.sortBy);
  if (input.order) qs.set("order", input.order);
  if (typeof input.take === "number") qs.set("take", String(input.take));
  if (input.filterBy) qs.set("filterBy", input.filterBy);
  if (input.nextCursor) qs.set("nextCursor", input.nextCursor);

  const res = await fetch(
    `${ENV.API_BASE_URL}/api/users/search?${qs.toString()}`,
    {
      method: "GET",
      headers: {
        "x-email": ENV.SEARCH_API_EMAIL,
        "x-password": ENV.SEARCH_API_PASSWORD,
      },
      cache: "no-store",
    }
  );

  if (!res.ok) throw new Error(`Upstream failed: ${res.status}`);
  return (await res.json()) as PaginatedResponse;
}
