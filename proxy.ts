import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Renamed from middleware.ts (Next.js 16 deprecated that file convention in
// favor of proxy.ts — confirmed against the installed next@16.2.12 loader:
// it looks for a named `proxy` export, falling back to `default`). Same
// runtime contract either way, so no change to the auth logic itself.
//
// Centralizes "is anyone signed in at all" — the 7+ mutation routes (see
// lib/auth-guard.ts) still call auth() themselves to get session.user.id
// for real ownership checks; this is just the default-on gate so a new
// route can't ship with no auth check at all by omission.
const PUBLIC_PATHS = ["/connect", "/signup", "/api/auth", "/api/signup", "/privacy", "/terms"];

export const proxy = auth((req) => {
  const isPublic = PUBLIC_PATHS.some((p) => req.nextUrl.pathname.startsWith(p));
  if (!req.auth?.user && !isPublic) {
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/connect", req.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
