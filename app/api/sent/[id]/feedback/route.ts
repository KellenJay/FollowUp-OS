import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireOwnerId, assertOwnsMailbox, OwnershipError } from "@/lib/auth-guard";

// Thumbs up/down + an optional free-text note on a resolved/sent thread —
// both columns already existed on `sent` (migration 0002), just never had
// a real persistence path; the UI only toggled client-side local state.
const VALID_FEEDBACK = ["up", "down", null] as const;

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);

  const update: { feedback?: "up" | "down" | null; feedback_note?: string } = {};

  if (body && "feedback" in body) {
    const feedback = body.feedback;
    if (!VALID_FEEDBACK.includes(feedback)) {
      return NextResponse.json({ error: "feedback must be 'up', 'down', or null" }, { status: 400 });
    }
    update.feedback = feedback;
  }

  if (body && "note" in body) {
    if (typeof body.note !== "string") {
      return NextResponse.json({ error: "note must be a string" }, { status: 400 });
    }
    update.feedback_note = body.note;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "must include 'feedback' and/or 'note'" }, { status: 400 });
  }

  const supabase = supabaseServer();

  try {
    const ownerId = await requireOwnerId();

    const { data: sentRow, error: sentErr } = await supabase
      .from("sent")
      .select("mailbox_id")
      .eq("id", id)
      .maybeSingle();
    if (sentErr || !sentRow) {
      return NextResponse.json({ error: sentErr?.message ?? "Sent message not found" }, { status: 404 });
    }
    await assertOwnsMailbox(sentRow.mailbox_id, ownerId);

    const { error } = await supabase.from("sent").update(update).eq("id", id);
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
