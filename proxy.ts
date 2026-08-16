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
  // "/" itself is public (renders the marketing landing page for signed-out
  // visitors; app/page.tsx redirects signed-in users onward) — exact match
  // only, since PUBLIC_PATHS uses startsWith and "/" would otherwise prefix-
  // match every path and disable the gate entirely.
  const isRoot = req.nextUrl.pathname === "/";
  // /api/mcp is the ONLY route an external AI assistant calls directly — it
  // has no NextAuth session cookie to send, and authenticates itself via its
  // own bearer token instead (see lib/mcp-auth.ts, enforced inside the route
  // by withMcpAuth). Exact match, not startsWith via PUBLIC_PATHS: a prefix
  // match here would also expose /api/mcp-token, which is session-gated on
  // purpose (it's called from the logged-in web UI, not by the assistant).
  const isMcpRoute = req.nextUrl.pathname === "/api/mcp";
  const isPublic = isRoot || isMcpRoute || PUBLIC_PATHS.some((p) => req.nextUrl.pathname.startsWith(p));
  if (!req.auth?.user && !isPublic) {
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/connect", req.nextUrl.origin));
  }
});

export const config = {
  // Excludes any path containing a dot (static assets under public/ — app.js,
  // styles.css, landing-logo.png, etc.) in addition to _next internals, since
  // the landing page at "/" needs its own asset requests to reach public/
  // unauthenticated too. No real page route in this app has a dot in it.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
