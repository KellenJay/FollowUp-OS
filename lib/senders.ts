import { supabaseServer } from "@/lib/supabase/server";
import { avatarFor, initialsFor } from "@/lib/avatar";
import { getOnboardingCandidates } from "@/lib/onboarding";

export type SenderImportance = "vip" | "excluded" | "normal";

export type SenderLookup = (email: string) => SenderImportance;

// Loads the owner's sender-importance table once per scan rather than
// per-thread, then returns a cheap synchronous lookup — checks an exact
// address match first, falling back to a domain match for entries stored as
// "@domain.com" (from the onboarding exclude-list, which accepts either).
export async function loadSenderLookup(ownerId: string): Promise<SenderLookup> {
  const supabase = supabaseServer();
  const { data } = await supabase.from("senders").select("address, importance").eq("owner_id", ownerId);

  const exact = new Map<string, SenderImportance>();
  const domains = new Map<string, SenderImportance>();
  for (const row of data ?? []) {
    if (row.address.startsWith("@")) {
      domains.set(row.address.slice(1), row.importance);
    } else {
      exact.set(row.address, row.importance);
    }
  }

  return (email: string) => {
    const lower = email.toLowerCase();
    if (exact.has(lower)) return exact.get(lower)!;
    const domain = lower.split("@")[1];
    if (domain && domains.has(domain)) return domains.get(domain)!;
    return "normal";
  };
}

export type VipSender = {
  id: string;
  address: string;
  name: string | null;
  messageCount: number;
  mutualCount: number;
  lastContactAt: string | null;
  av: string;
  initials: string;
};

export async function listVips(ownerId: string): Promise<VipSender[]> {
  const supabase = supabaseServer();
  const { data } = await supabase
    .from("senders")
    .select("id, address, name, message_count, mutual_count, last_contact_at")
    .eq("owner_id", ownerId)
    .eq("importance", "vip")
    .order("mutual_count", { ascending: false });

  return (data ?? []).map((s) => ({
    id: s.id,
    address: s.address,
    name: s.name,
    messageCount: s.message_count,
    mutualCount: s.mutual_count,
    lastContactAt: s.last_contact_at,
    av: avatarFor(s.address),
    initials: initialsFor(s.name || s.address),
  }));
}

// Re-runs the same candidate scan onboarding uses, then drops anyone already
// vip/excluded so this only ever surfaces genuinely new suggestions.
export async function listVipSuggestions(ownerId: string) {
  const supabase = supabaseServer();
  const [candidates, existing] = await Promise.all([
    getOnboardingCandidates(ownerId),
    supabase.from("senders").select("address").eq("owner_id", ownerId).neq("importance", "normal"),
  ]);
  const taken = new Set((existing.data ?? []).map((s) => s.address));
  return candidates.filter((c) => !taken.has(c.address.toLowerCase()));
}

export async function addVip(ownerId: string, address: string, name?: string): Promise<VipSender> {
  const supabase = supabaseServer();
  const normalized = address.toLowerCase().trim();
  const { data, error } = await supabase
    .from("senders")
    .upsert(
      { owner_id: ownerId, address: normalized, ...(name ? { name } : {}), importance: "vip", source: "manual" },
      { onConflict: "owner_id,address" }
    )
    .select("id, address, name, message_count, mutual_count, last_contact_at")
    .single();
  if (error) throw new Error(error.message);

  return {
    id: data.id,
    address: data.address,
    name: data.name,
    messageCount: data.message_count,
    mutualCount: data.mutual_count,
    lastContactAt: data.last_contact_at,
    av: avatarFor(data.address),
    initials: initialsFor(data.name || data.address),
  };
}

// Downgrades back to "normal" rather than deleting the row, so any tracked
// message_count/mutual_count history survives re-adding them later.
export async function removeVip(ownerId: string, id: string): Promise<boolean> {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("senders")
    .update({ importance: "normal" })
    .eq("id", id)
    .eq("owner_id", ownerId)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return !!data;
}
