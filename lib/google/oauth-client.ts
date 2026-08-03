import { google } from "googleapis";
import { decryptToken } from "@/lib/crypto";

export type MailboxRow = {
  id: string;
  address: string;
  refresh_token_encrypted: string | null;
};

// Derived from googleapis' own google.auth.OAuth2 rather than imported
// separately from google-auth-library — googleapis bundles its own nested
// copy of that package, and TypeScript treats the two as incompatible types
// despite being structurally identical.
export type GoogleAuthClient = InstanceType<typeof google.auth.OAuth2>;

// Builds an authenticated OAuth2 client for a given stored mailbox. googleapis
// refreshes the access token automatically on first use as long as a
// refresh_token is set — we never store/reuse access tokens ourselves.
export function oauthClientFor(mailbox: MailboxRow) {
  if (!mailbox.refresh_token_encrypted) {
    throw new Error(`Mailbox ${mailbox.address} has no stored refresh token`);
  }
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  client.setCredentials({
    refresh_token: decryptToken(mailbox.refresh_token_encrypted),
  });
  return client;
}
