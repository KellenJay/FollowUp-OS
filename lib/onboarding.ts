import { supabaseServer } from "@/lib/supabase/server";
import { oauthClientFor, MailboxRow } from "@/lib/google/oauth-client";
import { scanSenderCandidates, SenderCandidate } from "@/lib/google/candidates";

export async function isOnboardingComplete(ownerId: string): Promise<boolean> {
  const supabase = supabaseServer();
  const { data } = await supabase.from("app_settings").select("onboarding_completed_at").eq("owner_id", ownerId).maybeSingle();
  return !!data?.onboarding_completed_at;
}

// A brand-new email/password signup starts with zero mailboxes — distinct
// from "onboarding not complete," which assumes at least one mailbox exists
// to scan candidates from. Checked before the onboarding gate in app/page.tsx.
export async function hasConnectedMailbox(ownerId: string): Promise<boolean> {
  const supabase = supabaseServer();
  const { count } = await supabase
    .from("mailboxes")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId);
  return (count ?? 0) > 0;
}

export async function getOnboardingCandidates(ownerId: string): Promise<SenderCandidate[]> {
  const supabase = supabaseServer();
  const { data: mailboxes } = await supabase
    .from("mailboxes")
    .select("id, address, refresh_token_encrypted")
    .eq("owner_id", ownerId);

  const merged = new Map<string, SenderCandidate>();
  for (const mailbox of mailboxes ?? []) {
    try {
      const auth = oauthClientFor(mailbox as MailboxRow);
      const candidates = await scanSenderCandidates(auth, mailbox.address);
      for (const c of candidates) {
        const existing = merged.get(c.address);
        if (!existing || c.receivedCount + c.sentCount > existing.receivedCount + existing.sentCount) {
          merged.set(c.address, c);
        }
      }
    } catch {
      // A mailbox with an auth problem just contributes no candidates —
      // the regular scan surfaces the reconnect state separately.
      continue;
    }
  }

  return Array.from(merged.values())
    .sort((a, b) => b.receivedCount + b.sentCount - (a.receivedCount + a.sentCount))
    .slice(0, 10);
}

export async function completeOnboarding(
  ownerId: string,
  vipAddresses: string[],
  excludedAddresses: string[]
) {
  const supabase = supabaseServer();

  for (const address of vipAddresses) {
    await supabase.from("senders").upsert(
      { owner_id: ownerId, address: address.toLowerCase().trim(), importance: "vip", source: "onboarding" },
      { onConflict: "owner_id,address" }
    );
  }
  for (const raw of excludedAddresses) {
    const value = raw.toLowerCase().trim();
    if (!value) continue;
    // Accepts either a specific address (someone@x.com) or a bare/@-prefixed
    // domain (x.com / @x.com) — domains are normalized to "@domain" so the
    // classification check below can match "ends with this" cleanly.
    const normalized = value.includes("@") && !value.startsWith("@") ? value : `@${value.replace(/^@/, "")}`;
    await supabase.from("senders").upsert(
      { owner_id: ownerId, address: normalized, importance: "excluded", source: "onboarding" },
      { onConflict: "owner_id,address" }
    );
  }

  await supabase
    .from("app_settings")
    .upsert({ owner_id: ownerId, onboarding_completed_at: new Date().toISOString() }, { onConflict: "owner_id" });
}
