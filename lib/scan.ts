import { supabaseServer } from "@/lib/supabase/server";
import { oauthClientFor, MailboxRow } from "@/lib/google/oauth-client";
import { scanInboxThreads, scanSentMessages, scanRecentHistoryWithContact, hasBeenAnsweredSince } from "@/lib/google/gmail";
import { scanRecentMeetings } from "@/lib/google/calendar";
import { loadSenderLookup, SenderLookup } from "@/lib/senders";
import { classifyAndDraft, classifyFollowupRelevance, summarizeTranscript, draftFallbackFollowup } from "@/lib/openai/classify";

// Strips diacritics so "Ellen Ivanović" (Workspace profile) matches "Ellen
// Ivanovic" (a plain-ASCII display name on a different, e.g. personal,
// account) — confirmed as the actual mismatch during testing.
const COMBINING_DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g");

function normalizeName(name: string): string {
  return name.trim().toLowerCase().normalize("NFD").replace(COMBINING_DIACRITICS, "");
}

function businessDaysBetween(from: Date, to: Date): number {
  let count = 0;
  const cur = new Date(from);
  while (cur < to) {
    cur.setDate(cur.getDate() + 1);
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
}

// Best-effort only — reliably naming "who this meeting was with" from free
// text is a job for Claude (Step 5), not a regex. This just keeps a
// transcript email from showing up with a blank attendee in the meantime.
function guessAttendeeName(body: string): string {
  const match = body.match(/\b(?:with|between you and|and)\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)?)/);
  return match ? match[1] : "";
}

export type ScanProgress = (done: number, total: number, mailboxAddress?: string) => void;

// onProgress is per-mailbox granularity, not per-item — scanMailbox's five
// AI-call-bearing phases (classification, stale-thread reconciliation,
// follow-up judging, transcript summaries, expired-meeting fallbacks) each
// only touch NEW items, so the true item count isn't knowable without doing
// the diffing work first. Finer-grained progress would need restructuring
// this into a count-then-execute two-pass pipeline — not done here; this is
// real, honest progress at the resolution that's cheap to report.
export async function runScan(ownerId: string, onProgress?: ScanProgress) {
  const supabase = supabaseServer();

  const { data: mailboxes, error: mailboxError } = await supabase
    .from("mailboxes")
    .select("id, address, refresh_token_encrypted, scan_paused")
    .eq("owner_id", ownerId)
    .eq("scan_paused", false);

  if (mailboxError) throw new Error(`Failed to load mailboxes: ${mailboxError.message}`);

  const senderLookup = await loadSenderLookup(ownerId);
  const { data: settings } = await supabase
    .from("app_settings")
    .select("owner_name, reply_promise_hours, draft_voice")
    .eq("owner_id", ownerId)
    .maybeSingle();
  const ownerName = settings?.owner_name ? normalizeName(settings.owner_name) : null;
  const replyPromiseHours = settings?.reply_promise_hours ?? 24;
  const draftVoice = settings?.draft_voice ?? undefined;

  const summary: Record<string, string> = {};
  const total = (mailboxes ?? []).length;
  onProgress?.(0, total);

  let i = 0;
  for (const mailbox of mailboxes ?? []) {
    try {
      await scanMailbox(mailbox as MailboxRow, senderLookup, ownerName, replyPromiseHours, draftVoice);
      await supabase
        .from("mailboxes")
        .update({ state: "ok", last_scanned_at: new Date().toISOString() })
        .eq("id", mailbox.id);
      summary[mailbox.address] = "ok";
    } catch (err) {
      // A single mailbox's auth/API failure shouldn't take down the whole
      // scan — flag it for reconnect and keep going with the rest.
      await supabase.from("mailboxes").update({ state: "reauth" }).eq("id", mailbox.id);
      summary[mailbox.address] = `error: ${(err as Error).message}`;
    }
    i += 1;
    onProgress?.(i, total, mailbox.address);
  }

  return summary;
}

async function scanMailbox(
  mailbox: MailboxRow,
  senderLookup: SenderLookup,
  ownerName: string | null,
  replyPromiseHours: number,
  draftVoice: string | undefined
) {
  const supabase = supabaseServer();
  const auth = oauthClientFor(mailbox);

  const [{ threads: rawThreads, transcripts }, sentMessages, meetings] = await Promise.all([
    scanInboxThreads(auth, mailbox.address),
    scanSentMessages(auth, mailbox.address),
    scanRecentMeetings(auth, mailbox.address),
  ]);

  // A message whose sender display name is literally the account owner's
  // own name (e.g. a note sent from a personal account to a work one) isn't
  // someone else awaiting a reply — it's Ellen, from a different address.
  const ownerFiltered = ownerName
    ? rawThreads.filter((t) => normalizeName(t.senderName) !== ownerName)
    : rawThreads;

  // No one sends a real email with a blank subject line — a missing subject
  // means junk/automated noise, not a genuine thread worth ever surfacing.
  // getHeader() in lib/google/gmail.ts substitutes the literal string
  // "(no subject)" for a missing Subject header, not an empty string.
  const threads = ownerFiltered.filter((t) => t.subject.trim().length > 0 && t.subject.trim().toLowerCase() !== "(no subject)");

  // --- Threads (needs-reply / low-confidence) ---
  const { data: existingThreads } = await supabase
    .from("threads")
    .select("gmail_thread_id, status")
    .eq("mailbox_id", mailbox.id);

  const existingByGmailId = new Map((existingThreads ?? []).map((t) => [t.gmail_thread_id, t.status]));
  const scannedGmailIds = new Set(threads.map((t) => t.gmailThreadId));

  for (const t of threads) {
    // Never resurrect a thread the user deliberately dismissed — dismiss is
    // reversible only via the explicit "restore" action, not by rescanning.
    const existingStatus = existingByGmailId.get(t.gmailThreadId);
    if (existingStatus === "dismissed") continue;

    const importance = senderLookup(t.senderEmail);
    if (importance === "excluded") continue; // onboarding exclude-list — never surface at all

    if (existingStatus) {
      // Already classified in a prior scan — refresh the cosmetic fields
      // only. Re-running the OpenAI call on every scan for unchanged
      // threads would just re-bill for the same answer.
      await supabase
        .from("threads")
        .update({
          snippet: t.snippet,
          body: t.body,
          waited_hours: Math.round(t.waitedHours),
          updated_at: new Date().toISOString(),
        })
        .eq("mailbox_id", mailbox.id)
        .eq("gmail_thread_id", t.gmailThreadId);
      continue;
    }

    // Genuinely new thread — classify + draft. A VIP flag from onboarding
    // overrides the classification result (always needs-reply) but still
    // uses the model's tier/why/drafts, since importance ≠ urgency.
    let result;
    try {
      result = await classifyAndDraft({
        subject: t.subject,
        body: t.body,
        senderName: t.senderName,
        senderEmail: t.senderEmail,
        mailboxAddress: mailbox.address,
        messageCount: t.messageCount,
        waitedHours: t.waitedHours,
        replyPromiseHours,
        draftVoice,
      });
    } catch (err) {
      result = {
        classification: "low_confidence" as const,
        tier: "fyi" as const,
        why: `Classification failed (${(err as Error).message}), needs manual review`,
        drafts: [],
      };
    }

    const status = importance === "vip" ? "needs_reply" : result.classification;
    const { data: threadRow, error: threadError } = await supabase
      .from("threads")
      .upsert(
        {
          mailbox_id: mailbox.id,
          gmail_thread_id: t.gmailThreadId,
          tier: result.tier,
          status,
          low_confidence: status === "low_confidence",
          subject: t.subject,
          snippet: t.snippet,
          body: t.body,
          sender_name: t.senderName,
          sender_org: t.senderEmail.split("@")[1] ?? "",
          sender_email: t.senderEmail,
          why: importance === "vip" ? `${result.why} (marked important during onboarding)` : result.why,
          waited_hours: Math.round(t.waitedHours),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "mailbox_id,gmail_thread_id" }
      )
      .select("id")
      .single();

    if (threadError || !threadRow) continue;

    if (result.drafts.length > 0) {
      await supabase.from("drafts").insert(
        result.drafts.map((d) => ({
          thread_id: threadRow.id,
          label: d.label,
          body: d.text,
          source: "ai" as const,
        }))
      );
    }
  }

  // A thread that was needs-reply/low-confidence last scan but isn't in this
  // scan's fresh results might mean she's replied since — OR it might just
  // have fallen outside this scan's window/category/cap for reasons
  // unrelated to being answered. Absence from the candidate list proves
  // nothing on its own, so verify each one directly against Gmail before
  // touching it. (This was a real bug: an earlier version assumed absence
  // meant "answered" and wrongly reconciled genuine unanswered threads —
  // including a transcript email — into "sent" the moment the scan window
  // was tightened.)
  const transcriptIds = new Set(transcripts.map((t) => t.gmailThreadId));
  const staleIds = (existingThreads ?? [])
    .filter((t) => ["needs_reply", "low_confidence"].includes(t.status) && !scannedGmailIds.has(t.gmail_thread_id))
    .map((t) => t.gmail_thread_id);

  for (const gmailThreadId of staleIds) {
    // Now recognized as a meeting-transcript email — it shouldn't live in
    // threads at all, answered or not. The transcripts loop below handles
    // filing it into meetings; just remove the stale threads-table row.
    if (transcriptIds.has(gmailThreadId)) {
      await supabase.from("threads").delete().eq("mailbox_id", mailbox.id).eq("gmail_thread_id", gmailThreadId);
      continue;
    }

    const answered = await hasBeenAnsweredSince(auth, gmailThreadId, mailbox.address);
    if (!answered) continue; // still genuinely awaiting reply — leave it as-is

    const { data: row } = await supabase
      .from("threads")
      .select("id, mailbox_id, subject, body")
      .eq("mailbox_id", mailbox.id)
      .eq("gmail_thread_id", gmailThreadId)
      .single();
    if (!row) continue;

    await supabase.from("threads").update({ status: "sent" }).eq("id", row.id);
    const { data: existingSent } = await supabase.from("sent").select("id").eq("thread_id", row.id).maybeSingle();
    if (!existingSent) {
      await supabase.from("sent").insert({
        thread_id: row.id,
        mailbox_id: row.mailbox_id,
        subject: row.subject,
        body: row.body,
        origin: "direct_in_gmail",
      });
    }
  }

  // --- Sent + follow-ups ---
  for (const s of sentMessages) {
    const { data: existingSent } = await supabase
      .from("sent")
      .select("id")
      .eq("mailbox_id", mailbox.id)
      .eq("gmail_message_id", s.gmailMessageId)
      .maybeSingle();

    let sentId = existingSent?.id;
    if (!sentId) {
      const { data: inserted, error } = await supabase
        .from("sent")
        .insert({
          mailbox_id: mailbox.id,
          gmail_message_id: s.gmailMessageId,
          gmail_thread_id: s.gmailThreadId,
          subject: s.subject,
          body: s.body,
          origin: "direct_in_gmail",
          sent_at: s.sentAt,
        })
        .select("id")
        .single();
      if (error) throw new Error(`Failed to insert sent message: ${error.message}`);
      sentId = inserted.id;
    }

    if (s.awaitingReply) {
      const businessDays = businessDaysBetween(new Date(s.sentAt), new Date());
      const { data: existingFollowup } = await supabase
        .from("followups")
        .select("id")
        .eq("sent_id", sentId)
        .maybeSingle();

      if (existingFollowup) {
        // Already judged relevant in a prior scan — refresh the day count
        // only. Re-classifying on every scan would just re-bill for the same
        // verdict (same reasoning as the threads loop above).
        await supabase
          .from("followups")
          .update({ business_days_waited: businessDays, updated_at: new Date().toISOString() })
          .eq("id", existingFollowup.id);
      } else {
        // Genuinely new follow-up candidate — judge whether a nudge is
        // actually warranted (confirmed with Ellen 2026-07-29: mechanical
        // day-count alone surfaced noise — self-sent docs, team broadcasts,
        // messages that already said the topic would be covered on an
        // upcoming call). Fail open (still surface it) if classification
        // errors, same as the threads loop — never silently drop on error.
        let relevance;
        try {
          relevance = await classifyFollowupRelevance({
            subject: s.subject,
            body: s.body,
            recipientRaw: s.recipientRaw,
            businessDaysWaited: businessDays,
          });
        } catch (err) {
          relevance = {
            warranted: true,
            why: `Classification failed (${(err as Error).message}), flagged for manual review`,
            drafts: [],
          };
        }

        if (relevance.warranted) {
          await supabase.from("followups").insert({
            sent_id: sentId,
            business_days_waited: businessDays,
            nudge_reasoning: relevance.why,
            drafts: relevance.drafts,
          });
        }
      }
    }
  }

  // --- Meetings (from Calendar) ---
  // A dismissed meeting must never be resurrected by the next scan just
  // because its calendar event is still inside the scan window — the
  // unconditional upsert below used to reset state to "waiting" every time,
  // which would have silently undone any dismiss the moment the next scan
  // ran. Same "never resurrect a manual dismiss" rule already applied to
  // threads (see the existingStatus === "dismissed" check further up).
  const { data: existingMeetingRows } = await supabase
    .from("meetings")
    .select("calendar_event_id, state")
    .eq("mailbox_id", mailbox.id);
  const existingMeetingState = new Map((existingMeetingRows ?? []).map((m) => [m.calendar_event_id, m.state]));

  for (const m of meetings) {
    if (existingMeetingState.get(m.calendarEventId) === "dismissed") continue;

    await supabase.from("meetings").upsert(
      {
        mailbox_id: mailbox.id,
        calendar_event_id: m.calendarEventId,
        title: m.title,
        attendee_name: m.attendeeName,
        attendee_org: m.attendeeOrg,
        attendee_email: m.attendeeEmail,
        state: "waiting",
        ended_at: m.endedAt,
        wait_deadline: new Date(new Date(m.endedAt).getTime() + 30 * 60_000).toISOString(),
      },
      { onConflict: "mailbox_id,calendar_event_id" }
    );
  }

  // --- Transcript emails (Otter/Optiverse/etc.) ---
  // These are meeting summaries, not inbox threads — link each to whichever
  // calendar-sourced meeting it's most likely about (ended within 3 hours of
  // the email), or create a standalone entry if no calendar event matches
  // (e.g. a call outside Calendar, or the calendar scan found nothing).
  for (const t of transcripts) {
    const receivedAt = new Date(t.receivedAt);
    const { data: waitingMeetings } = await supabase
      .from("meetings")
      .select("id, ended_at, title, attendee_name")
      .eq("mailbox_id", mailbox.id)
      .eq("state", "waiting");

    const match = (waitingMeetings ?? []).find((m) => {
      if (!m.ended_at) return false;
      return Math.abs(receivedAt.getTime() - new Date(m.ended_at).getTime()) < 3 * 3_600_000;
    });

    if (match) {
      // Real summarization + action items + drafts — this used to just
      // store the raw transcript email as "summary" (see 0007 migration
      // note), which is why long transcripts showed as an unreadable wall
      // of text with no action items. Fail open (store the truncated raw
      // body) on an AI error rather than losing the transcript entirely.
      let result;
      try {
        result = await summarizeTranscript({
          title: match.title ?? t.subject,
          attendeeName: match.attendee_name ?? "",
          transcriptBody: t.body,
        });
      } catch (err) {
        result = {
          summary: `Summarization failed (${(err as Error).message}), see full transcript in Gmail.`,
          actionItems: [] as string[],
          drafts: [] as { label: string; text: string }[],
        };
      }

      // The waitingMeetings query above already scopes to state === "waiting",
      // so this can never touch a dismissed row.
      await supabase
        .from("meetings")
        .update({
          state: "found",
          summary: result.summary,
          action_items: result.actionItems,
          drafts: result.drafts,
          transcript_source: t.senderEmail.split("@")[1] ?? t.senderEmail,
          updated_at: new Date().toISOString(),
        })
        .eq("id", match.id);
    } else {
      const standaloneId = `email-${t.gmailThreadId}`;
      const { data: existingStandalone } = await supabase
        .from("meetings")
        .select("state")
        .eq("mailbox_id", mailbox.id)
        .eq("calendar_event_id", standaloneId)
        .maybeSingle();
      if (existingStandalone?.state === "dismissed") continue;

      const standaloneTitle = t.subject;
      const standaloneAttendee = guessAttendeeName(t.body);
      let standaloneResult;
      try {
        standaloneResult = await summarizeTranscript({
          title: standaloneTitle,
          attendeeName: standaloneAttendee,
          transcriptBody: t.body,
        });
      } catch (err) {
        standaloneResult = {
          summary: `Summarization failed (${(err as Error).message}), see full transcript in Gmail.`,
          actionItems: [] as string[],
          drafts: [] as { label: string; text: string }[],
        };
      }

      await supabase.from("meetings").upsert(
        {
          mailbox_id: mailbox.id,
          calendar_event_id: standaloneId,
          title: standaloneTitle,
          attendee_name: standaloneAttendee,
          state: "found",
          summary: standaloneResult.summary,
          action_items: standaloneResult.actionItems,
          drafts: standaloneResult.drafts,
          transcript_source: t.senderEmail.split("@")[1] ?? t.senderEmail,
          ended_at: t.receivedAt,
        },
        { onConflict: "mailbox_id,calendar_event_id" }
      );
    }
  }

  // --- Expired waiting meetings (PRD phase 3 fallback) ---
  // Runs after the transcripts loop above so a transcript arriving exactly
  // at the deadline still gets matched first, not preempted by this. A
  // meeting sitting at "waiting" past its 30-minute wait_deadline with no
  // transcript needs to resolve to something — it was never transitioning
  // out of "waiting" at all before this, so it just sat at 100% forever.
  const nowIso = new Date().toISOString();
  const { data: expiredMeetings } = await supabase
    .from("meetings")
    .select("id, title, attendee_name, attendee_email")
    .eq("mailbox_id", mailbox.id)
    .eq("state", "waiting")
    .lt("wait_deadline", nowIso);

  for (const m of expiredMeetings ?? []) {
    // Only calendar-sourced meetings have an attendee_email to search
    // Gmail history with — a transcript-originated standalone entry is
    // always created directly in "found" state, so it never reaches here.
    let history: Awaited<ReturnType<typeof scanRecentHistoryWithContact>> = [];
    if (m.attendee_email) {
      try {
        history = await scanRecentHistoryWithContact(auth, m.attendee_email);
      } catch {
        history = [];
      }
    }

    let fallback;
    try {
      fallback = await draftFallbackFollowup({
        title: m.title ?? "",
        attendeeName: m.attendee_name ?? "",
        recentHistory: history,
      });
    } catch (err) {
      fallback = {
        summary: `No transcript found, and drafting from email history failed (${(err as Error).message}).`,
        drafts: [] as { label: string; text: string }[],
      };
    }

    await supabase
      .from("meetings")
      .update({
        state: "none",
        summary: fallback.summary,
        drafts: fallback.drafts,
        updated_at: new Date().toISOString(),
      })
      .eq("id", m.id);
  }
}
