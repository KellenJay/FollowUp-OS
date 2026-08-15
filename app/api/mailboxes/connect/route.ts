import { NextResponse } from "next/server";
import { google } from "googleapis";
import { randomBytes } from "crypto";
import { requireOwnerId, OwnershipError } from "@/lib/auth-guard";
import { GOOGLE_SCOPES } from "@/lib/google/scopes";

// Separate from NextAuth's own signIn("google") flow (used at /connect for
// the very first mailbox) — that flow always resolves-or-creates a user by
// whatever email Google returns, which would sign an already-signed-in user
// into a DIFFERENT identity instead of attaching a second mailbox to their
// current one. This hand-rolled flow re-derives the current session in the
// callback instead, so the mailbox always attaches to whoever is already
// signed in. Serves both "Add mailbox" and "Reconnect" — reconnect is just
// running this same consent flow again for an address that already has a row.
const STATE_COOKIE = "mailbox_oauth_state";

export async function GET(request: Request) {
  let ownerId: string;
  try {
    ownerId = await requireOwnerId();
  } catch (err) {
    if (err instanceof OwnershipError) {
      return NextResponse.redirect(new URL("/connect", request.url));
    }
    throw err;
  }
  void ownerId; // only needed to confirm a session exists before leaving the app

  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/mailboxes/callback`;
  const state = randomBytes(16).toString("hex");

  const client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, redirectUri);
  const authUrl = client.generateAuthUrl({
    access_type: "offline",
    // Forces a fresh refresh_token every time, same reasoning as auth.ts's
    // NextAuth provider config — reconnect specifically depends on this.
    prompt: "consent",
    scope: GOOGLE_SCOPES.split(" "),
    state,
  });

  const response = NextResponse.redirect(authUrl);
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}
