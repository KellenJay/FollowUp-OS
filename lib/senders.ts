import { supabaseServer } from "@/lib/supabase/server";

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
