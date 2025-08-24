// app/api/users/route.ts
import { NextResponse } from "next/server";
import { ENV } from "@/lib/env";

export async function GET(req: Request) {
  const url = new URL(req.url);

  const upstream = await fetch(
    `${ENV.API_BASE_URL}/api/users/search?${url.searchParams.toString()}`,
    {
      headers: {
        "x-email": process.env.SEARCH_API_EMAIL ?? "",
        "x-password": process.env.SEARCH_API_PASSWORD ?? "",
      },
      cache: "no-store",
    }
  );

  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
