// lib/env.ts
import "server-only";
import { z } from "zod";

const EnvSchema = z.object({
  NEXT_PUBLIC_API_BASE: z.string().url(),
  SEARCH_API_EMAIL: z.string().email(),
  SEARCH_API_PASSWORD: z.string().min(1),
});

export const ENV = EnvSchema.parse({
  NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE,
  SEARCH_API_EMAIL: process.env.SEARCH_API_EMAIL,
  SEARCH_API_PASSWORD: process.env.SEARCH_API_PASSWORD,
});
