// lib/search-build.ts
import { z } from "zod";

// Strict allow-list for sortBy
const SortBySchema = z.enum(["mostRelevant", "name", "email", "creationDate"]);

export const ClientSearchInputSchema = z.object({
  q: z.string().trim().optional().default(""),
  sortBy: SortBySchema.optional().nullable(), // we'll drop it if q is empty
  organizationName: z.string().trim().optional(),
  teamName: z.string().trim().optional(),
  // these are fixed by product rules for now, but keep them here for clarity
  take: z.coerce.number().int().min(1).max(100).default(10),
  order: z.literal("asc").default("asc"),
});

export type ClientSearchInput = z.infer<typeof ClientSearchInputSchema>;

export function buildUserSearchQueryFromUI(input: Partial<ClientSearchInput>) {
  const parsed = ClientSearchInputSchema.parse(input);
  const params = new URLSearchParams();

  // always fixed for now
  params.set("take", String(parsed.take));
  params.set("order", parsed.order);

  const q = parsed.q?.trim() ?? "";
  if (q) {
    params.set("q", q);
    if (parsed.sortBy) params.set("sortBy", parsed.sortBy);
  }
  // filters by name
  if (parsed.organizationName?.trim())
    params.set("organizationName", parsed.organizationName.trim());
  if (parsed.teamName?.trim()) params.set("teamName", parsed.teamName.trim());

  return {
    search: params.toString(),
    url: `/api/users/search?${params.toString()}`,
    params: Object.fromEntries(params.entries()),
  };
}
