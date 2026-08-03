import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireOwnerId, assertOwnsMailbox, OwnershipError } from "@/lib/auth-guard";

// Separate from /api/threads/:id/category — a sent-message follow-up lives
// in the `followups` table (keyed by sent_id, not a thread), so "Stop
// chasing" / undo needs its own endpoint against the right table and its
// own status enum ('pending' | 'dismissed' | 'sent', per 0001_init.sql).
const VALID_STATUSES = ["pending", "dismissed"] as const;
type ValidStatus = (typeof VALID_STATUSES)[number];

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const status = body?.status as ValidStatus | undefined;

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
  }

  const supabase = supabaseServer();

  try {
    const ownerId = await requireOwnerId();

    const { data: followup, error: followupErr } = await supabase
      .from("followups")
      .select("sent:sent_id(mailbox_id)")
      .eq("id", id)
      .maybeSingle();
    const mailboxId = (followup?.sent as unknown as { mailbox_id: string } | null)?.mailbox_id;
    if (followupErr || !mailboxId) {
      return NextResponse.json({ error: followupErr?.message ?? "Follow-up not found" }, { status: 404 });
    }
    await assertOwnsMailbox(mailboxId, ownerId);

    const { error } = await supabase
      .from("followups")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof OwnershipError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
