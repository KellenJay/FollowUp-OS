import { NextResponse } from "next/server";
import { google } from "googleapis";
import { requireOwnerId, OwnershipError } from "@/lib/auth-guard";
import { upsertMailbox } from "@/lib/mailboxes";
import { upsertOwnerName } from "@/lib/account";

const STATE_COOKIE = "mailbox_oauth_state";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  const expectedState = request.headers
    .get("cookie")
    ?.split("; ")
    .find((c) => c.startsWith(`${STATE_COOKIE}=`))
    ?.slice(STATE_COOKIE.length + 1);

  const failRedirect = (reason: string) => {
    const res = NextResponse.redirect(new URL(`/?mailboxError=${encodeURIComponent(reason)}`, request.url));
    res.cookies.delete(STATE_COOKIE);
    return res;
  };

  if (!code) return failRedirect("Google sign-in was cancelled or denied");
  if (!returnedState || !expectedState || returnedState !== expectedState) {
    return failRedirect("Sign-in link expired, try again");
  }

  let ownerId: string;
  try {
    ownerId = await requireOwnerId();
  } catch (err) {
    if (err instanceof OwnershipError) {
      return NextResponse.redirect(new URL("/connect", request.url));
    }
    throw err;
  }

  const origin = url.origin;
  const redirectUri = `${origin}/api/mailboxes/callback`;
  const client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, redirectUri);

  try {
    const { tokens } = await client.getToken(code);
    if (!tokens.refresh_token) {
      return failRedirect("Google didn't grant offline access, try again and approve all permissions");
    }
    client.setCredentials(tokens);

    const oauth2 = google.oauth2({ auth: client, version: "v2" });
    const { data: profile } = await oauth2.userinfo.get();
    if (!profile.email) {
      return failRedirect("Couldn't read the connected account's email address");
    }

    await upsertMailbox(
      ownerId,
      profile.email,
      tokens.refresh_token,
      tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : undefined
    );
    if (profile.name) {
      await upsertOwnerName(ownerId, profile.name);
    }

    const res = NextResponse.redirect(new URL("/?mailboxConnected=1", request.url));
    res.cookies.delete(STATE_COOKIE);
    return res;
  } catch (err) {
    return failRedirect((err as Error).message || "Couldn't connect that mailbox");
  }
}
