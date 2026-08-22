import { NextResponse } from "next/server";
import { requireOwnerId, OwnershipError } from "@/lib/auth-guard";
import { supabaseServer } from "@/lib/supabase/server";

type DeleteItem = { id: string; kind: "thread" | "followup" | "meeting" };

// Permanent delete for the Dismissed tab's bulk-select action — distinct
// from a normal dismiss (which just flips status) and from the automatic
// retention sweep in lib/dashboard.ts (which only ever removes rows already
// past DISMISSED_RETENTION_DAYS). This lets the owner clear it out on demand
// instead of waiting for the sweep. Only ever touches rows already in the
// dismissed state, scoped to the owner's own mailboxes, as a safety net even
// though the client only ever sends ids sourced from its own Dismissed list.
export async function DELETE(request: Request) {
  const body = await request.json().catch(() => null);
  const items: DeleteItem[] = Array.isArray(body?.items) ? body.items : [];
  if (items.length === 0) {
    return NextResponse.json({ error: "items must be a non-empty array" }, { status: 400 });
  }

  const supabase = supabaseServer();

  try {
    const ownerId = await requireOwnerId();

    const { data: mailboxRows } = await supabase.from("mailboxes").select("id").eq("owner_id", ownerId);
    const mailboxIds = new Set((mailboxRows ?? []).map((m) => m.id));

    const threadIds = items.filter((i) => i.kind === "thread").map((i) => i.id);
    const meetingIds = items.filter((i) => i.kind === "meeting").map((i) => i.id);
    const followupIds = items.filter((i) => i.kind === "followup").map((i) => i.id);

    if (threadIds.length > 0) {
      const { data: rows } = await supabase
        .from("threads")
        .select("id, mailbox_id")
        .in("id", threadIds)
        .eq("status", "dismissed");
      const ownedIds = (rows ?? []).filter((r) => mailboxIds.has(r.mailbox_id)).map((r) => r.id);
      if (ownedIds.length > 0) {
        await supabase.from("threads").delete().in("id", ownedIds);
      }
    }

    if (meetingIds.length > 0) {
      const { data: rows } = await supabase
        .from("meetings")
        .select("id, mailbox_id")
        .in("id", meetingIds)
        .eq("state", "dismissed");
      const ownedIds = (rows ?? []).filter((r) => mailboxIds.has(r.mailbox_id)).map((r) => r.id);
      if (ownedIds.length > 0) {
        await supabase.from("meetings").delete().in("id", ownedIds);
      }
    }

    if (followupIds.length > 0) {
      const { data: rows } = await supabase
        .from("followups")
        .select("id, sent:sent_id(mailbox_id)")
        .in("id", followupIds)
        .eq("status", "dismissed");
      const ownedIds = (rows ?? [])
        .filter((r) => {
          const sent = r.sent as unknown as { mailbox_id: string } | null;
          return sent && mailboxIds.has(sent.mailbox_id);
        })
        .map((r) => r.id);
      if (ownedIds.length > 0) {
        await supabase.from("followups").delete().in("id", ownedIds);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof OwnershipError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
