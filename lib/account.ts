import { supabaseServer } from "@/lib/supabase/server";

// Moved out of auth.ts (was private there) so app/api/mailboxes/callback can
// also backfill the display name when a user connects a Google mailbox that
// isn't their first sign-in (e.g. an email/password signup adding a Gmail
// mailbox later).
export async function upsertOwnerName(ownerId: string, name: string) {
  const supabase = supabaseServer();
  await supabase.from("app_settings").upsert({ owner_id: ownerId, owner_name: name }, { onConflict: "owner_id" });
}

export type AccountSettings = {
  ownerName: string | null;
  replyPromiseHours: number;
  draftVoice: string | null;
};

export async function getAccountSettings(ownerId: string): Promise<AccountSettings> {
  const supabase = supabaseServer();
  const { data } = await supabase
    .from("app_settings")
    .select("owner_name, reply_promise_hours, draft_voice")
    .eq("owner_id", ownerId)
    .maybeSingle();
  return {
    ownerName: data?.owner_name ?? null,
    // Column default is 24, but a pre-migration row (or one never touched
    // since) can still come back null via the select — same fallback.
    replyPromiseHours: data?.reply_promise_hours ?? 24,
    draftVoice: data?.draft_voice ?? null,
  };
}

export async function updateAccountSettings(
  ownerId: string,
  fields: { name?: string; replyPromiseHours?: number; draftVoice?: string }
): Promise<void> {
  const supabase = supabaseServer();
  const payload: { owner_id: string; owner_name?: string; reply_promise_hours?: number; draft_voice?: string } = {
    owner_id: ownerId,
  };
  if (fields.name !== undefined) payload.owner_name = fields.name;
  if (fields.replyPromiseHours !== undefined) payload.reply_promise_hours = fields.replyPromiseHours;
  if (fields.draftVoice !== undefined) payload.draft_voice = fields.draftVoice;
  await supabase.from("app_settings").upsert(payload, { onConflict: "owner_id" });
}
