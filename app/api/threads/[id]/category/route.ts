import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireOwnerId, assertOwnsMailbox, OwnershipError } from "@/lib/auth-guard";

// "manual_followup" is a manual override distinct from the sent-message-
// driven `followups` table (see supabase/migrations/0005) — it's Ellen
// deciding to handle an inbox thread herself later, not a nudge about
// something she sent. "dismissed" is included here too since it's the same
// underlying status column — dismiss/restore (Step 6) reuses this endpoint.
const VALID_STATUSES = ["needs_reply", "low_confidence", "manual_followup", "dismissed"] as const;
type ValidStatus = (typeof VALID_STATUSES)[number];

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const status = body?.status as ValidStatus | undefined;

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
  }

  const update: { status: ValidStatus; updated_at: string; low_confidence?: boolean } = {
    status,
    updated_at: new Date().toISOString(),
  };
  // Only touch low_confidence when landing directly in one of these two
  // buckets. Leaving it untouched on a move to dismissed/manual_followup
  // preserves the thread's "true home" so Restore (dashboard.ts) can put it
  // back in the right bucket later, no matter how many moves came before.
  if (status === "needs_reply" || status === "low_confidence") {
    update.low_confidence = status === "low_confidence";
  }

  const supabase = supabaseServer();

  try {
    const ownerId = await requireOwnerId();

    const { data: thread, error: threadErr } = await supabase
      .from("threads")
      .select("mailbox_id")
      .eq("id", id)
      .maybeSingle();
    if (threadErr || !thread) {
      return NextResponse.json({ error: threadErr?.message ?? "Thread not found" }, { status: 404 });
    }
    await assertOwnsMailbox(thread.mailbox_id, ownerId);

    const { error } = await supabase.from("threads").update(update).eq("id", id);
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
