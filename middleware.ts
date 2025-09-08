import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Protects /users from unauthenticated access by checking a simple cookie.
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Only guard the /users route (and subpaths via matcher below)
  const isLoggedIn = req.cookies.get("logged_in")?.value === "true";
  if (!isLoggedIn) {
    const url = new URL("/login", req.url);
    // preserve the intended destination for optional post-login redirect
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/users/:path*"],
};

