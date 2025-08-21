// app/api/users/search/route.ts
import { NextResponse } from "next/server";
import { normalizeSearchParams } from "@/lib/normalizeSearchParams";
import { searchUsersServer } from "@/lib/server/searchUsers";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = Object.fromEntries(url.searchParams.entries());
  if (url.searchParams.has("nextCursor")) {
    raw.nextCursor = url.searchParams.get("nextCursor") as string;
  }

  const params = normalizeSearchParams(raw);
  const data = await searchUsersServer({
    ...params,
    nextCursor: (raw.nextCursor as string) || undefined,
  });

  return NextResponse.json(data);
}
