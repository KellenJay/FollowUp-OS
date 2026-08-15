import { supabaseServer } from "@/lib/supabase/server";
import { encryptToken } from "@/lib/crypto";

// Moved out of auth.ts (was a private, unexported helper there) so it can
// also be called from app/api/mailboxes/callback's hand-rolled OAuth flow —
// both paths attach a Google mailbox to an owner_id that's already known
// (either the just-resolved sign-in identity, or the current session's
// user), never resolving identity by email themselves.
export async function upsertMailbox(ownerId: string, address: string, refreshToken: string, expiresAt?: number) {
  const supabase = supabaseServer();
  const { error } = await supabase.from("mailboxes").upsert(
    {
      owner_id: ownerId,
      address,
      state: "ok",
      refresh_token_encrypted: encryptToken(refreshToken),
      token_expires_at: expiresAt ? new Date(expiresAt * 1000).toISOString() : null,
    },
    { onConflict: "owner_id,address" }
  );
  if (error) {
    throw new Error(`Failed to persist mailbox tokens for ${address}: ${error.message}`);
  }
}
