// lib/env.ts
import "server-only";
import { z } from "zod";

const EnvSchema = z.object({
  API_BASE_URL: z.string().url(),
  SEARCH_API_EMAIL: z.string().email(),
  SEARCH_API_PASSWORD: z.string().min(1),
});

export const ENV = EnvSchema.parse({
  API_BASE_URL: process.env.API_BASE_URL,
  SEARCH_API_EMAIL: process.env.SEARCH_API_EMAIL,
  SEARCH_API_PASSWORD: process.env.SEARCH_API_PASSWORD,
});
