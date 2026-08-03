import { supabaseServer } from "@/lib/supabase/server";
import { avatarFor, initialsFor } from "@/lib/avatar";

const PLACEHOLDER_DRAFT_TEXT =
  "AI-drafted replies aren't wired up yet — that lands in the next build step. Use the custom reply box below for now, or reply directly in Gmail.";

function placeholderDrafts() {
  return [
    { label: "Draft (coming soon)", tone: "#e8e2f8", toneText: "#54459b", text: PLACEHOLDER_DRAFT_TEXT },
    { label: "Draft (coming soon)", tone: "#e8e2f8", toneText: "#54459b", text: PLACEHOLDER_DRAFT_TEXT },
  ];
}

function formatWaited(hours: number): string {
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

function formatTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const day = d.toLocaleDateString("en-US", { weekday: "short" });
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${day} ${time}`;
}

function formatSync(iso: string | null): string {
  if (!iso) return "not scanned yet";
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "scanned just now";
  if (minutes < 60) return `scanned ${minutes} min ago`;
  return `scanned ${Math.round(minutes / 60)} h ago`;
}

const DOT_COLORS = ["#0b8ee8", "#8b7fd4", "#3fb27f", "#e8801f", "#d98aa8"];
const DRAFT_TONES = [
  { tone: "#dcf0e6", toneText: "#2b7355" },
  { tone: "#e8e2f8", toneText: "#54459b" },
];

export async function loadDashboard(ownerId: string) {
  const supabase = supabaseServer();

  const { data: mailboxRows = [] } = await supabase
    .from("mailboxes")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: true });

  const mailboxIds = (mailboxRows ?? []).map((m) => m.id);
  const mailboxAddressById = new Map((mailboxRows ?? []).map((m) => [m.id, m.address]));

  const [{ data: threadRows = [] }, { data: sentRows = [] }, { data: meetingRows = [] }, { data: followupRows = [] }] =
    mailboxIds.length === 0
      ? [{ data: [] }, { data: [] }, { data: [] }, { data: [] }]
      : await Promise.all([
          // Includes 'dismissed' now (see restore/dismiss below) — the
          // Dismissed tab needs to read real persisted state across
          // sessions, not just what happened to be dismissed this session.
          supabase.from("threads").select("*").in("mailbox_id", mailboxIds),
          supabase.from("sent").select("*").in("mailbox_id", mailboxIds).order("sent_at", { ascending: false }),
          supabase.from("meetings").select("*").in("mailbox_id", mailboxIds),
          supabase
            .from("followups")
            .select("*, sent!inner(id, mailbox_id, subject, body, sent_at)")
            .in("sent.mailbox_id", mailboxIds)
            .in("status", ["pending", "dismissed"]),
        ]);

  const drafts: Record<string, ReturnType<typeof placeholderDrafts>> = {};

  const threadIds = (threadRows ?? []).map((t) => t.id);
  const { data: aiDraftRows = [] } =
    threadIds.length === 0
      ? { data: [] }
      : await supabase
          .from("drafts")
          .select("thread_id, label, body, created_at")
          .in("thread_id", threadIds)
          .eq("source", "ai")
          .order("created_at", { ascending: true });

  const aiDraftsByThread = new Map<string, { label: string; tone: string; toneText: string; text: string }[]>();
  for (const row of aiDraftRows ?? []) {
    const list = aiDraftsByThread.get(row.thread_id) ?? [];
    if (list.length < 2) {
      list.push({ label: row.label ?? "Draft", ...DRAFT_TONES[list.length], text: row.body });
      aiDraftsByThread.set(row.thread_id, list);
    }
  }

  const needsReply = (threadRows ?? [])
    .filter((t) => t.status === "needs_reply")
    .map((t) => {
      drafts[t.id] = aiDraftsByThread.get(t.id) ?? placeholderDrafts();
      return {
        id: t.id,
        origin: "needs_reply" as const,
        status: "needs_reply" as const,
        tier: t.tier,
        waited: formatWaited(t.waited_hours ?? 0),
        name: t.sender_name,
        org: t.sender_org,
        initials: initialsFor(t.sender_name || t.sender_email || ""),
        av: avatarFor(t.sender_email ?? ""),
        subject: t.subject,
        // The collapsed card shows this line at a glance — the AI's
        // reasoning is far more useful there than a raw Gmail snippet, which
        // is still available in full once the card is expanded (t.body).
        snippet: t.why,
        mailbox: mailboxAddressById.get(t.mailbox_id),
        time: formatTime(t.updated_at),
        body: t.body,
        why: t.why,
      };
    });

  const lowConf = (threadRows ?? [])
    .filter((t) => t.status === "low_confidence")
    .map((t) => {
      drafts[t.id] = aiDraftsByThread.get(t.id) ?? placeholderDrafts();
      return {
        id: t.id,
        origin: "low_confidence" as const,
        status: "low_confidence" as const,
        tier: t.tier,
        waited: formatWaited(t.waited_hours ?? 0),
        low: true,
        name: t.sender_name,
        org: t.sender_org,
        initials: initialsFor(t.sender_name || t.sender_email || ""),
        av: avatarFor(t.sender_email ?? ""),
        subject: t.subject,
        snippet: t.why,
        mailbox: mailboxAddressById.get(t.mailbox_id),
        time: formatTime(t.updated_at),
        body: t.body,
        why: t.why,
      };
    });

  function sentFollowUpVals(f: NonNullable<typeof followupRows>[number]) {
    const sent = (f as unknown as { sent: { id: string; mailbox_id: string; subject: string; body: string; sent_at: string } }).sent;
    drafts[f.id] = placeholderDrafts();
    return {
      id: f.id,
      origin: "sent" as const,
      status: f.status,
      days: f.business_days_waited,
      sent: `Sent ${formatTime(sent.sent_at)}`,
      mailbox: mailboxAddressById.get(sent.mailbox_id),
      name: "",
      org: "",
      initials: "?",
      av: avatarFor(sent.id),
      subject: sent.subject,
      // nudge_reasoning is now real AI-generated reasoning (see scan.ts's
      // classifyFollowupRelevance), not a restated day-count, so it's worth
      // showing as the collapsed summary — same pattern as needs-reply's why.
      snippet: f.nudge_reasoning,
      body: sent.body,
      nudge: f.nudge_reasoning,
    };
  }

  const sentFollowUps = (followupRows ?? []).filter((f) => f.status === "pending").map(sentFollowUpVals);
  const dismissedSentFollowUps = (followupRows ?? []).filter((f) => f.status === "dismissed").map(sentFollowUpVals);

  // Threads Ellen manually moved to "Follow-up" from the category dropdown
  // (see supabase/migrations/0005) — a different concept from sentFollowUps
  // above (this is an inbox thread from someone else, not a message she
  // sent), but merged into the same Follow-ups tab per her 2026-07-29
  // decision. Carries the full needs-reply/low-confidence shape (tier,
  // waited, time, why, low) too, not just the follow-up shape, so the
  // client can move it back to Needs-reply/Low-confidence without a refetch.
  const manualFollowUps = (threadRows ?? [])
    .filter((t) => t.status === "manual_followup")
    .map((t) => {
      drafts[t.id] = aiDraftsByThread.get(t.id) ?? placeholderDrafts();
      return {
        id: t.id,
        origin: "manual" as const,
        status: "manual_followup" as const,
        tier: t.tier,
        low: t.low_confidence,
        waited: formatWaited(t.waited_hours ?? 0),
        name: t.sender_name,
        org: t.sender_org,
        initials: initialsFor(t.sender_name || t.sender_email || ""),
        av: avatarFor(t.sender_email ?? ""),
        subject: t.subject,
        snippet: t.why,
        body: t.body,
        why: t.why,
        nudge: t.why,
        sent: `Flagged ${formatTime(t.updated_at)}`,
        time: formatTime(t.updated_at),
        mailbox: mailboxAddressById.get(t.mailbox_id),
        days: 0,
      };
    });

  const followUps = [...sentFollowUps, ...manualFollowUps];

  // Dismissed tab — merges dismissed inbox threads (restore goes back to
  // whichever of needs-reply/low-confidence they'd naturally belong to,
  // read from the low_confidence flag, which the category-move endpoint
  // deliberately leaves untouched on a dismiss/manual_followup transition
  // so this "true home" survives however many moves preceded the dismiss)
  // and dismissed sent-message follow-ups (a different table/restore path
  // entirely — see /api/followups/:id/status).
  const dismissedThreads = (threadRows ?? [])
    .filter((t) => t.status === "dismissed")
    .map((t) => {
      drafts[t.id] = aiDraftsByThread.get(t.id) ?? placeholderDrafts();
      const origin: "low_confidence" | "needs_reply" = t.low_confidence ? "low_confidence" : "needs_reply";
      return {
        id: t.id,
        origin,
        status: "dismissed" as const,
        tier: t.tier,
        low: t.low_confidence,
        waited: formatWaited(t.waited_hours ?? 0),
        name: t.sender_name,
        org: t.sender_org,
        initials: initialsFor(t.sender_name || t.sender_email || ""),
        av: avatarFor(t.sender_email ?? ""),
        subject: t.subject,
        snippet: t.why,
        mailbox: mailboxAddressById.get(t.mailbox_id),
        time: formatTime(t.updated_at),
        body: t.body,
        why: t.why,
        meta: t.low_confidence ? "low confidence" : "needed reply",
      };
    });

  const dismissedFollowUps = dismissedSentFollowUps.map((f) => ({ ...f, meta: "follow-up" }));

  // Sent tab shows only messages actually sent through this app — Gmail
  // Sent-folder history we scan for follow-up-eligibility purposes
  // (origin: "direct_in_gmail") stays out of this list per Ellen's
  // 2026-07-27 correction; it still feeds `followUps` above.
  const sent = (sentRows ?? [])
    .filter((s) => s.origin !== "direct_in_gmail")
    .map((s) => ({
      id: s.id,
      name: "",
      org: "",
      initials: "?",
      av: avatarFor(s.id),
      subject: s.subject,
      mailbox: mailboxAddressById.get(s.mailbox_id),
      time: `sent ${formatTime(s.sent_at)}`,
      origin: s.origin,
      body: s.body,
      feedback: s.feedback,
      feedbackNote: s.feedback_note,
    }));

  function meetingVals(m: NonNullable<typeof meetingRows>[number]) {
    // Real AI-generated drafts now live directly on the row (see 0007 —
    // the shared `drafts` table's thread_id column is a foreign key to
    // threads only, so meetings needed their own storage). Apply the same
    // tone/color assignment used for threads' drafts so the client-facing
    // shape matches exactly.
    // Defensive fallback if migration 0007 hasn't run yet (m.drafts would
    // then be undefined, not []) — confirmed 2026-08-02 this can otherwise
    // crash loadDashboard entirely and take the whole app down with it, not
    // just meetings, so this can never be allowed to throw here.
    const meetingDrafts = m.drafts ?? [];
    if ((m.state === "found" || m.state === "none") && meetingDrafts.length > 0) {
      drafts[m.id] = meetingDrafts.slice(0, 2).map((d, i) => ({ label: d.label, ...DRAFT_TONES[i], text: d.text }));
    } else if (m.state === "found" || m.state === "none") {
      drafts[m.id] = placeholderDrafts();
    }
    // "Waiting for transcript · X of Y min" pill needs real elapsed/total
    // minutes — these were never wired up, which showed as "undefined of
    // undefined min" and a NaN% progress bar for every waiting meeting.
    const of = m.ended_at && m.wait_deadline
      ? Math.round((new Date(m.wait_deadline).getTime() - new Date(m.ended_at).getTime()) / 60_000)
      : 30;
    const mins = m.ended_at
      ? Math.min(of, Math.max(0, Math.round((Date.now() - new Date(m.ended_at).getTime()) / 60_000)))
      : 0;
    return {
      id: m.id,
      meeting: true,
      origin: "meeting" as const,
      state: m.state,
      title: m.title,
      name: m.attendee_name,
      org: m.attendee_org,
      initials: initialsFor(m.attendee_name || "?"),
      av: avatarFor(m.attendee_name || m.id),
      ended: m.ended_at ? `Ended ${formatTime(m.ended_at)}` : "",
      mailbox: mailboxAddressById.get(m.mailbox_id),
      subject: m.title,
      summary: m.summary,
      actions: m.action_items,
      // "none" state's blurb reuses the same `summary` column (the
      // fallback-drafted-from-history text) rather than a separate column —
      // the client's fallback UI just reads it as `fallback`.
      fallback: m.state === "none" ? m.summary : "",
      tool: m.transcript_source,
      mins,
      of,
    };
  }

  const meetings = (meetingRows ?? []).filter((m) => m.state !== "dismissed" && m.state !== "sent").map(meetingVals);

  // Restore target is derived from what's already on the row (has a
  // transcript summary landed, or not) rather than a separately-stored
  // "previous state" column — mirrors how thread restore derives its target
  // from low_confidence instead of persisting its own history.
  const dismissedMeetings = (meetingRows ?? [])
    .filter((m) => m.state === "dismissed")
    .map((m) => {
      const restoreState: "found" | "waiting" = m.summary ? "found" : "waiting";
      return {
        ...meetingVals(m),
        status: "dismissed" as const,
        restoreState,
        meta: "post-meeting",
      };
    });

  const dismissed = [...dismissedThreads, ...dismissedFollowUps, ...dismissedMeetings];

  const mailboxes = (mailboxRows ?? []).map((m, i) => ({
    address: m.address,
    // threadRows now includes dismissed rows too (fetched above for the
    // Dismissed tab) — exclude them here so a dismissed thread doesn't
    // inflate the sidebar's active-count badge.
    count: (threadRows ?? []).filter((t) => t.mailbox_id === m.id && t.status !== "sent" && t.status !== "dismissed").length,
    dot: DOT_COLORS[i % DOT_COLORS.length],
    role: `Connected · ${m.address.split("@")[1] ?? ""}`,
    state: m.state,
    sync: formatSync(m.last_scanned_at),
  }));

  return { mailboxes, threads: needsReply, lowConf, followUps, sent, meetings, dismissed, drafts };
}
