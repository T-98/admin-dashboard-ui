import "server-only";
import type { PaginatedResponse } from "@/hooks/usePaginatedUsers";
import type { NormalizedSearchParams } from "@/lib/normalizeSearchParams";
import { ENV } from "@/lib/env";

type Input = NormalizedSearchParams & { nextCursor?: string | null };

export async function searchUsersServer(
  input: Input
): Promise<PaginatedResponse> {
  const qs = new URLSearchParams();

  const q = input.q?.trim() ?? "";
  if (q) {
    qs.set("q", q);
    if (input.sortBy) qs.set("sortBy", input.sortBy);
  }

  qs.set("take", String(input.take)); // always 10 for now
  qs.set("order", input.order ?? "asc");

  if (input.organizationName)
    qs.set("organizationName", input.organizationName);
  if (input.teamName) qs.set("teamName", input.teamName);
  if (input.nextCursor) qs.set("nextCursor", input.nextCursor);

  const base = ENV.NEXT_PUBLIC_API_BASE;
  const res = await fetch(`${base}/api/users/search?${qs.toString()}`, {
    method: "GET",
    headers: {
      "x-email": process.env.SEARCH_API_EMAIL ?? "",
      "x-password": process.env.SEARCH_API_PASSWORD ?? "",
    },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Upstream failed: ${res.status}`);
  return (await res.json()) as PaginatedResponse;
}
