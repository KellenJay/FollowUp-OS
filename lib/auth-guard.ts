import { auth } from "@/auth";
import { supabaseServer } from "@/lib/supabase/server";

// Carries the right HTTP status so every route can map it the same way —
// unauthenticated is a real 401, but "this resource isn't yours" is always
// a 404, never 403: a caller shouldn't be able to distinguish "doesn't
// exist" from "not yours" by status code alone.
export class OwnershipError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function requireOwnerId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new OwnershipError("Not signed in", 401);
  return session.user.id;
}

// The one ownership primitive every mutation route needs — every resource
// (threads, sent, meetings, and followups one hop further via sent) resolves
// to a mailbox_id, and every mailbox belongs to exactly one owner.
export async function assertOwnsMailbox(mailboxId: string, ownerId: string): Promise<void> {
  const supabase = supabaseServer();
  const { data } = await supabase
    .from("mailboxes")
    .select("id")
    .eq("id", mailboxId)
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (!data) throw new OwnershipError("Not found", 404);
}
