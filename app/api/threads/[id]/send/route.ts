import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { oauthClientFor, MailboxRow } from "@/lib/google/oauth-client";
import { sendReplyInThread } from "@/lib/google/send";
import { requireOwnerId, assertOwnsMailbox, OwnershipError } from "@/lib/auth-guard";

// Needs-reply / low-confidence / manual-followup — all three are just
// different `threads.status` values, all reply-in-thread the same way.
const VALID_ORIGINS = ["option_a", "option_b", "edited", "custom"] as const;
type ValidOrigin = (typeof VALID_ORIGINS)[number];

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const text = body?.text;
  const origin = (body?.origin as ValidOrigin | undefined) ?? "edited";

  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }
  if (!VALID_ORIGINS.includes(origin)) {
    return NextResponse.json({ error: `origin must be one of: ${VALID_ORIGINS.join(", ")}` }, { status: 400 });
  }

  const supabase = supabaseServer();

  try {
    const ownerId = await requireOwnerId();

    const { data: thread, error: threadErr } = await supabase
      .from("threads")
      .select("id, mailbox_id, gmail_thread_id, subject, sender_email")
      .eq("id", id)
      .maybeSingle();
    if (threadErr || !thread) {
      return NextResponse.json({ error: threadErr?.message ?? "Thread not found" }, { status: 404 });
    }
    await assertOwnsMailbox(thread.mailbox_id, ownerId);

    const { data: mailboxRow, error: mailboxErr } = await supabase
      .from("mailboxes")
      .select("id, address, refresh_token_encrypted")
      .eq("id", thread.mailbox_id)
      .maybeSingle();
    if (mailboxErr || !mailboxRow) {
      return NextResponse.json({ error: mailboxErr?.message ?? "Mailbox not found" }, { status: 404 });
    }

    const authClient = oauthClientFor(mailboxRow as MailboxRow);
    const result = await sendReplyInThread(authClient, {
      gmailThreadId: thread.gmail_thread_id,
      body: text,
      recipientOverride: thread.sender_email ?? undefined,
    });

    const sentAt = new Date().toISOString();
    const { data: sentRow, error: sentErr } = await supabase
      .from("sent")
      .insert({
        thread_id: thread.id,
        mailbox_id: thread.mailbox_id,
        gmail_message_id: result.gmailMessageId,
        gmail_thread_id: thread.gmail_thread_id,
        subject: result.subject,
        body: text,
        origin,
        sent_at: sentAt,
      })
      .select("id")
      .single();
    if (sentErr) throw new Error(sentErr.message);

    await supabase.from("threads").update({ status: "sent", updated_at: sentAt }).eq("id", thread.id);

    return NextResponse.json({ ok: true, sentId: sentRow.id, sentAt });
  } catch (err) {
    if (err instanceof OwnershipError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
