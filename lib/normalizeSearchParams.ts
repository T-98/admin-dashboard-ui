// lib/normalizeSearchParams.ts
import "server-only";
import { z } from "zod";

const fromQuery = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (Array.isArray(v) ? v[0] : v), schema);

export const SearchParamsSchema = z.object({
  q: fromQuery(z.string().trim().optional()).default(""),
  sortBy: fromQuery(z.string().trim().optional()).default("name"),
  order: fromQuery(z.enum(["asc", "desc"]).optional()).catch("asc"),
  take: fromQuery(z.coerce.number().int().min(1).max(100).optional()).default(
    10
  ),
  filterBy: fromQuery(z.string().trim().optional()).optional(),
});

export type NormalizedSearchParams = z.infer<typeof SearchParamsSchema>;

export function normalizeSearchParams(raw: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (raw && typeof (raw as any).then === "function") {
    throw new Error(
      "normalizeSearchParams received a Promise. Resolve it first."
    );
  }
  return SearchParamsSchema.parse(raw);
}
