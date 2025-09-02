// lib/search-build.ts
import { z } from "zod";

export const SortBySchema = z.enum(["mostRelevant", "name", "email", "createdAt"]);

export type SortBy = z.infer<typeof SortBySchema>;

// This is the normalized shape we’ll use as the React Query key and fetch params.
export type SearchKey = {
  q?: string; // trimmed, optional
  sortBy?: SortBy; // only present if q is non-empty
  organizationName?: string; // trimmed, optional
  teamName?: string; // trimmed, optional
  take: number; // page size (1-100)
  order: "asc"; // always asc
};

type BuildInput = {
  q?: string;
  sortBy?: SortBy | null;
  organizationName?: string;
  teamName?: string;
  take?: number; // optional, defaults to 10
};

export function buildUserSearchQueryFromUI(input: BuildInput) {
  const qTrim = (input.q ?? "").trim();
  const orgTrim = (input.organizationName ?? "").trim();
  const teamTrim = (input.teamName ?? "").trim();
  // sanitize take
  const rawTake = typeof input.take === "number" && Number.isFinite(input.take)
    ? Math.trunc(input.take)
    : 10;
  const take = Math.max(1, Math.min(100, rawTake));

  // Build the normalized key object (what we’ll feed to React Query + fetcher)
  const key: SearchKey = {
    take,
    order: "asc",
    ...(qTrim ? { q: qTrim } : {}),
    ...(qTrim && input.sortBy ? { sortBy: input.sortBy } : {}),
    ...(orgTrim ? { organizationName: orgTrim } : {}),
    ...(teamTrim ? { teamName: teamTrim } : {}),
  };

  // Also provide a URLSearchParams version (handy for debugging)
  const qs = new URLSearchParams();
  qs.set("take", String(key.take));
  qs.set("order", key.order);
  if (key.q) qs.set("q", key.q);
  if (key.sortBy) qs.set("sortBy", key.sortBy);
  if (key.organizationName) qs.set("organizationName", key.organizationName);
  if (key.teamName) qs.set("teamName", key.teamName);

  return {
    key,
    params: Object.fromEntries(qs.entries()),
    search: qs.toString(),
    url: `/api/users/search?${qs.toString()}`,
  };
}
