import { signOut } from "@/auth";
import { NextResponse } from "next/server";

// public/app.js is vanilla JS with no React context, so it can't use the
// next-auth/react signOut() helper — this route lets it trigger the same
// signOut() used by app/connect/page.tsx's server-action forms, via a plain
// fetch. redirect:false stops it throwing NEXT_REDIRECT; app.js does the
// navigation itself once the session cookie is cleared.
export async function POST() {
  await signOut({ redirect: false });
  return NextResponse.json({ ok: true });
}
