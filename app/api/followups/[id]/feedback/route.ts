import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireOwnerId, assertOwnsMailbox, OwnershipError } from "@/lib/auth-guard";

// Same shape as app/api/sent/[id]/feedback/route.ts — thumb up/down, an
// optional multi-select tag set, and an optional free-text note, all
// independently updatable. followups has no mailbox_id of its own (see
// lib/auth-guard.ts), so ownership resolves one hop out via sent.mailbox_id.
const VALID_FEEDBACK = ["up", "down", null] as const;

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);

  const update: { feedback?: "up" | "down" | null; feedback_note?: string; feedback_tags?: string[] } = {};

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

  if (body && "tags" in body) {
    const tags = body.tags;
    if (!Array.isArray(tags) || !tags.every((t) => typeof t === "string")) {
      return NextResponse.json({ error: "tags must be an array of strings" }, { status: 400 });
    }
    update.feedback_tags = tags;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "must include 'feedback', 'note', and/or 'tags'" }, { status: 400 });
  }

  const supabase = supabaseServer();

  try {
    const ownerId = await requireOwnerId();

    const { data: followupRow, error: followupErr } = await supabase
      .from("followups")
      .select("sent_id, sent!inner(mailbox_id)")
      .eq("id", id)
      .maybeSingle();
    if (followupErr || !followupRow) {
      return NextResponse.json({ error: followupErr?.message ?? "Follow-up not found" }, { status: 404 });
    }
    const mailboxId = (followupRow as unknown as { sent: { mailbox_id: string } }).sent.mailbox_id;
    await assertOwnsMailbox(mailboxId, ownerId);

    const { error } = await supabase.from("followups").update(update).eq("id", id);
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
