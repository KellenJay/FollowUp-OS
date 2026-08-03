import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { oauthClientFor, MailboxRow } from "@/lib/google/oauth-client";
import { sendStandaloneEmail } from "@/lib/google/send";
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

    const { data: meeting, error: meetingErr } = await supabase
      .from("meetings")
      .select("id, mailbox_id, title, attendee_email")
      .eq("id", id)
      .maybeSingle();
    if (meetingErr || !meeting) {
      return NextResponse.json({ error: meetingErr?.message ?? "Meeting not found" }, { status: 404 });
    }
    await assertOwnsMailbox(meeting.mailbox_id, ownerId);

    // Standalone meetings created from a transcript email with no calendar
    // event never got an attendee_email (only calendar-sourced ones do) —
    // there's no address to send to in that case.
    if (!meeting.attendee_email) {
      return NextResponse.json({ error: "No attendee email on file for this meeting" }, { status: 409 });
    }

    const { data: mailboxRow, error: mailboxErr } = await supabase
      .from("mailboxes")
      .select("id, address, refresh_token_encrypted")
      .eq("id", meeting.mailbox_id)
      .maybeSingle();
    if (mailboxErr || !mailboxRow) {
      return NextResponse.json({ error: mailboxErr?.message ?? "Mailbox not found" }, { status: 404 });
    }

    const authClient = oauthClientFor(mailboxRow as MailboxRow);
    const result = await sendStandaloneEmail(authClient, {
      to: meeting.attendee_email,
      subject: meeting.title ?? "Following up",
      body: text,
    });

    const sentAt = new Date().toISOString();
    const { data: sentRow, error: sentErr } = await supabase
      .from("sent")
      .insert({
        mailbox_id: meeting.mailbox_id,
        gmail_message_id: result.gmailMessageId,
        subject: result.subject,
        body: text,
        origin: "edited",
        sent_at: sentAt,
      })
      .select("id")
      .single();
    if (sentErr) throw new Error(sentErr.message);

    await supabase.from("meetings").update({ state: "sent", updated_at: sentAt }).eq("id", id);

    return NextResponse.json({ ok: true, sentId: sentRow.id, sentAt });
  } catch (err) {
    if (err instanceof OwnershipError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
