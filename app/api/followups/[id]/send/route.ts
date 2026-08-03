import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { oauthClientFor, MailboxRow } from "@/lib/google/oauth-client";
import { sendReplyInThread } from "@/lib/google/send";
import { requireOwnerId, assertOwnsMailbox, OwnershipError } from "@/lib/auth-guard";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const text = body?.text;

  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const supabase = supabaseServer();

  try {
    const ownerId = await requireOwnerId();

    const { data: followup, error: followupErr } = await supabase
      .from("followups")
      .select("id, sent_id, sent:sent_id(mailbox_id, gmail_thread_id)")
      .eq("id", id)
      .maybeSingle();
    if (followupErr || !followup) {
      return NextResponse.json({ error: followupErr?.message ?? "Follow-up not found" }, { status: 404 });
    }

    const originalSent = followup.sent as unknown as { mailbox_id: string; gmail_thread_id: string | null } | null;
    if (!originalSent) {
      return NextResponse.json({ error: "Follow-up not found" }, { status: 404 });
    }
    await assertOwnsMailbox(originalSent.mailbox_id, ownerId);

    if (!originalSent.gmail_thread_id) {
      return NextResponse.json(
        { error: "The original sent message has no recorded Gmail thread to reply into" },
        { status: 409 }
      );
    }

    const { data: mailboxRow, error: mailboxErr } = await supabase
      .from("mailboxes")
      .select("id, address, refresh_token_encrypted")
      .eq("id", originalSent.mailbox_id)
      .maybeSingle();
    if (mailboxErr || !mailboxRow) {
      return NextResponse.json({ error: mailboxErr?.message ?? "Mailbox not found" }, { status: 404 });
    }

    const authClient = oauthClientFor(mailboxRow as MailboxRow);
    // No recipientOverride: the thread's last message is her own original
    // send (that's what "no reply yet" means), so its own "To" header —
    // sendReplyInThread's fallback — is already the right nudge recipient.
    const result = await sendReplyInThread(authClient, {
      gmailThreadId: originalSent.gmail_thread_id,
      body: text,
    });

    const sentAt = new Date().toISOString();
    const { data: sentRow, error: sentErr } = await supabase
      .from("sent")
      .insert({
        mailbox_id: originalSent.mailbox_id,
        gmail_message_id: result.gmailMessageId,
        gmail_thread_id: originalSent.gmail_thread_id,
        subject: result.subject,
        body: text,
        origin: "edited",
        sent_at: sentAt,
      })
      .select("id")
      .single();
    if (sentErr) throw new Error(sentErr.message);

    await supabase.from("followups").update({ status: "sent", updated_at: sentAt }).eq("id", id);

    return NextResponse.json({ ok: true, sentId: sentRow.id, sentAt });
  } catch (err) {
    if (err instanceof OwnershipError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
