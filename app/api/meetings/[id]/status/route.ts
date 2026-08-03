import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireOwnerId, assertOwnsMailbox, OwnershipError } from "@/lib/auth-guard";

// Separate table/id from threads and followups — a post-meeting card's
// "Skip this call" needs its own endpoint against meetings.state (see
// supabase/migrations/0006 for the added 'dismissed' value).
const VALID_STATES = ["waiting", "found", "none", "dismissed"] as const;
type ValidState = (typeof VALID_STATES)[number];

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const state = body?.state as ValidState | undefined;

  if (!state || !VALID_STATES.includes(state)) {
    return NextResponse.json({ error: `state must be one of: ${VALID_STATES.join(", ")}` }, { status: 400 });
  }

  const supabase = supabaseServer();

  try {
    const ownerId = await requireOwnerId();

    const { data: meeting, error: meetingErr } = await supabase
      .from("meetings")
      .select("mailbox_id")
      .eq("id", id)
      .maybeSingle();
    if (meetingErr || !meeting) {
      return NextResponse.json({ error: meetingErr?.message ?? "Meeting not found" }, { status: 404 });
    }
    await assertOwnsMailbox(meeting.mailbox_id, ownerId);

    const { error } = await supabase
      .from("meetings")
      .update({ state, updated_at: new Date().toISOString() })
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
