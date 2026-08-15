import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireOwnerId, assertOwnsMailbox, OwnershipError } from "@/lib/auth-guard";

// No soft-delete state exists on mailboxes (only ok/reauth/sync) and
// threads/sent/meetings all cascade-delete off mailbox_id — so removing a
// mailbox permanently deletes its history. The client shows a confirm dialog
// before calling this; there is no undo.
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const ownerId = await requireOwnerId();
    await assertOwnsMailbox(id, ownerId);

    const supabase = supabaseServer();
    const { error } = await supabase.from("mailboxes").delete().eq("id", id);
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
