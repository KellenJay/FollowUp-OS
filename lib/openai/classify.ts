import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { openaiClient, openaiModel } from "@/lib/openai/client";

// Structured per-call line so Vercel's Runtime Logs/Observability has
// something real to show for each AI call — until now these 4 call sites
// logged nothing on success, only a caught error on failure.
function logAiCall(decisionPoint: string, model: string, startedAt: number, usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null | undefined) {
  console.log(JSON.stringify({
    event: "ai_call",
    decision_point: decisionPoint,
    model,
    latency_ms: Date.now() - startedAt,
    prompt_tokens: usage?.prompt_tokens ?? null,
    completion_tokens: usage?.completion_tokens ?? null,
    total_tokens: usage?.total_tokens ?? null,
  }));
}

const ClassifyAndDraftSchema = z.object({
  classification: z.enum(["needs_reply", "low_confidence"]),
  tier: z.enum(["today", "week", "fyi"]),
  why: z.string(),
  drafts: z
    .array(
      z.object({
        label: z.string(),
        text: z.string(),
      })
    )
    .length(2),
});

export type ClassifyAndDraftResult = z.infer<typeof ClassifyAndDraftSchema>;

export type ThreadForClassification = {
  subject: string;
  body: string;
  senderName: string;
  senderEmail: string;
  mailboxAddress: string;
  messageCount: number;
  waitedHours: number;
  // Both optional, real user-set preferences (app_settings.reply_promise_hours
  // / draft_voice — 2026-08-14 feedback: previously hardcoded Settings text
  // with no connection to actual behavior). Omitted falls back to defaults
  // baked into the base prompt below.
  replyPromiseHours?: number;
  draftVoice?: string;
};

// System prompt encodes the classification judgment call and drafting tone
// validated during the earlier prototype (see CLAUDE.md) — the two example
// drafts below are taken verbatim from that validated prototype's mock data
// as tone anchors, not fabricated for this prompt.
const SYSTEM_PROMPT = `You triage business email for a Strategic Partnership Manager. For each email thread, decide:

1. CLASSIFICATION — "needs_reply" or "low_confidence":
   - "needs_reply": a genuine business conversation with a real person — even a first-time sender, if the content reads like an actual specific ask, question, or opportunity tied to real names/details/deals.
   - "low_confidence": likely cold outreach or ambiguous — generic sales pitches (even personalized ones), vague templated language ("quick call?", "reduce costs by X%", canned value props), or anything where you can't tell if this is a real relationship. A sender who has sent multiple follow-up messages without ever getting a reply is a strong cold-outreach signal, not evidence of a real relationship — judge by the CONTENT's specificity, not just message count.
   - Automated system/product notifications (status alerts, "your project has been paused/resumed", billing receipts, usage reports, no-reply automated senders) are ALWAYS "low_confidence", even when they name specific projects, accounts, or numbers — specificity alone doesn't mean a real person is waiting on a reply. Judge whether a human is actually expecting a response from the recipient, not just whether the content is detailed. Two emails about the same underlying automated event (e.g. a status-change notice followed by its confirmation) should both be classified the same way.

2. TIER — "today" (genuinely time-sensitive/urgent), "week" (normal priority), or "fyi" (low urgency/informational, even if it needs an eventual reply).

3. WHY — one short sentence explaining the classification, referencing something specific from the thread.

4. DRAFTS — exactly two distinct reply options, only useful if classification is "needs_reply" (for "low_confidence" still provide two reasonable draft attempts, since the user may open it anyway). Tone: warm-but-concrete — acknowledge context, commit to ONE specific next step, reference a specific detail from the thread. Never generic pleasantries. Each draft needs a short label describing its angle (e.g. "Direct with numbers", "Cautious, asks first"). Every draft must end with the sign-off "Best,\nEllen" — never a different closing line or name.

Example of the target tone (from a validated real draft, for calibration only — do not reuse this content):
Label: "Direct with numbers"
"Hi Marcus,\\n\\nGreat news on the MSA.\\n\\nFor the 400-employee tier we're looking at €11-14 per seat per year, with the lower end tied to a 24-month term. I'd take €12.50 to your steering group as the working number.\\n\\nThe pilot is 8 weeks - we shortened it after the Braithwaite run showed the baseline stabilises by week six.\\n\\nI'll send the one-pager with both scenarios today so your CFO can model it.\\n\\nBest,\\nEllen"`;

export async function classifyAndDraft(thread: ThreadForClassification): Promise<ClassifyAndDraftResult> {
  const client = openaiClient();

  const replyPromiseHours = thread.replyPromiseHours ?? 24;
  const userPrompt = `Mailbox owner: ${thread.mailboxAddress}
Sender: ${thread.senderName} <${thread.senderEmail}>
Subject: ${thread.subject}
Messages in thread (within scan window): ${thread.messageCount}
Hours waited since last message: ${Math.round(thread.waitedHours)}
The user's reply-promise window is ${replyPromiseHours} hours — weigh this when picking TIER: a needs_reply thread already past or close to this window is "today", comfortably inside it is "week".

Body of the most recent message:
${thread.body.slice(0, 4000)}`;

  const systemPrompt = thread.draftVoice
    ? `${SYSTEM_PROMPT}\n\nThe user has also set a specific voice preference for drafts, which takes priority over the tone guidance above where they conflict: "${thread.draftVoice}"`
    : SYSTEM_PROMPT;

  const startedAt = Date.now();
  const completion = await client.chat.completions.parse({
    model: openaiModel(),
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: zodResponseFormat(ClassifyAndDraftSchema, "classify_and_draft"),
  });
  logAiCall("classify_and_draft", openaiModel(), startedAt, completion.usage);

  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) {
    throw new Error("OpenAI did not return a parsed classify_and_draft response");
  }
  return parsed;
}

const FollowupRelevanceSchema = z.object({
  warranted: z.boolean(),
  why: z.string(),
  drafts: z
    .array(
      z.object({
        label: z.string(),
        text: z.string(),
      })
    )
    .length(2),
});

export type FollowupRelevanceResult = z.infer<typeof FollowupRelevanceSchema>;

export type SentMessageForClassification = {
  subject: string;
  body: string;
  recipientRaw: string; // raw To: header value, may contain multiple addresses
  businessDaysWaited: number;
};

// Confirmed via user feedback (2026-07-29): the Follow-ups list was purely
// mechanical (sent + no reply in N business days, no reasoning) and it
// surfaced noise — self-addressed notes, docs-only attachments, team
// broadcasts, and messages that already said the topic would be covered on
// an upcoming call. This judges relevance once, at first detection, the same
// way classifyAndDraft judges needs-reply threads once.
const FOLLOWUP_SYSTEM_PROMPT = `You decide whether a sent-but-unanswered business email genuinely needs a follow-up nudge, for a Strategic Partnership Manager using an inbox-triage tool.

WARRANTED = true only when this reads like a real, single-recipient (or small, named-group) business ask, proposal, or question where a reply is actually expected and hasn't come yet.

WARRANTED = false when any of these apply:
- The message was sent to the account owner themselves (a personal note/reminder), or is clearly just sharing a document/attachment with no explicit question or ask.
- It was sent to a team, distribution list, or many recipients as an FYI/broadcast rather than a specific ask of one person.
- The message itself already states the topic will be resolved another way soon (e.g. "we'll cover this on our next call", "talk more at the meeting", "I'll follow up with specs during our next call") — nudging again would be redundant with an already-planned touchpoint.
- The content is templated/administrative (out-of-office, calendar logistics, scheduling housekeeping) rather than a substantive ask.

WHY — one short, specific sentence referencing actual content from the message, explaining the verdict either way.

DRAFTS — exactly two distinct follow-up nudge options, only meaningful when WARRANTED is true (still provide two reasonable attempts if false, since the schema requires it, but they'll be discarded). Tone: warm-but-concrete — reference the original ask specifically, don't just say "following up." Each draft needs a short label describing its angle (e.g. "Brief nudge", "Offers to hop on a call"). Every draft must end with the sign-off "Best,\nEllen" — never a different closing line or name.`;

export async function classifyFollowupRelevance(
  message: SentMessageForClassification
): Promise<FollowupRelevanceResult> {
  const client = openaiClient();

  const userPrompt = `Sent to: ${message.recipientRaw}
Subject: ${message.subject}
Business days waited with no reply: ${message.businessDaysWaited}

Body of the sent message:
${message.body.slice(0, 4000)}`;

  const startedAt = Date.now();
  const completion = await client.chat.completions.parse({
    model: openaiModel(),
    messages: [
      { role: "system", content: FOLLOWUP_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    response_format: zodResponseFormat(FollowupRelevanceSchema, "followup_relevance"),
  });
  logAiCall("followup_relevance", openaiModel(), startedAt, completion.usage);

  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) {
    throw new Error("OpenAI did not return a parsed followup_relevance response");
  }
  return parsed;
}

const TranscriptSummarySchema = z.object({
  summary: z.string(),
  actionItems: z.array(z.string()),
  drafts: z
    .array(
      z.object({
        label: z.string(),
        text: z.string(),
      })
    )
    .length(2),
});

export type TranscriptSummaryResult = z.infer<typeof TranscriptSummarySchema>;

export type TranscriptForSummary = {
  title: string;
  attendeeName: string;
  transcriptBody: string;
};

// Confirmed via user feedback (2026-08-02): this step never existed — scan.ts
// was storing the raw transcript email (sometimes many thousands of
// characters, full of tool-generated boilerplate) directly as "summary",
// which is why the collapsed card showed a wall of text and "view call
// notes" never had anything to show (action_items was never populated by
// any code path). This mirrors classifyAndDraft's one-call-per-item pattern.
const TRANSCRIPT_SYSTEM_PROMPT = `You summarize a call transcript (from a meeting-recorder tool like Otter or Optiverse) for a Strategic Partnership Manager, for a post-meeting follow-up dashboard.

1. SUMMARY — 2-3 SHORT sentences maximum, for a collapsed card the user glances at. Cover who it was with and the single most important outcome or decision. Never quote large chunks of the transcript verbatim, and never include tool-generated boilerplate (join links, timestamps, speaker-diarization noise).

2. ACTION ITEMS — a short list of concrete next steps mentioned in the call, phrased as "Person: does what" (e.g. "You: send the security questionnaire", "Priya: confirm the pilot sites by Friday"). Omit if the call genuinely had none — return an empty list rather than inventing one.

3. DRAFTS — exactly two distinct follow-up note options referencing specific details/action items from the call. Tone: warm-but-concrete, one specific next step per draft, never generic pleasantries. Each needs a short label describing its angle. Every draft must end with the sign-off "Best,\nEllen" — never a different closing line or name.`;

export async function summarizeTranscript(input: TranscriptForSummary): Promise<TranscriptSummaryResult> {
  const client = openaiClient();

  const userPrompt = `Meeting: ${input.title}
Attendee: ${input.attendeeName}

Transcript:
${input.transcriptBody.slice(0, 12000)}`;

  const startedAt = Date.now();
  const completion = await client.chat.completions.parse({
    model: openaiModel(),
    messages: [
      { role: "system", content: TRANSCRIPT_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    response_format: zodResponseFormat(TranscriptSummarySchema, "transcript_summary"),
  });
  logAiCall("transcript_summary", openaiModel(), startedAt, completion.usage);

  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) {
    throw new Error("OpenAI did not return a parsed transcript_summary response");
  }
  return parsed;
}

const FallbackFollowupSchema = z.object({
  summary: z.string(),
  drafts: z
    .array(
      z.object({
        label: z.string(),
        text: z.string(),
      })
    )
    .length(2),
});

export type FallbackFollowupResult = z.infer<typeof FallbackFollowupSchema>;

export type MeetingForFallback = {
  title: string;
  attendeeName: string;
  recentHistory: { subject: string; snippet: string; date: string }[];
};

// PRD phase 3: "if no transcript arrives within the window... fall back to
// the recent email thread history with that contact... infer context, draft
// a generic-but-informed follow-up, and flag that no transcript was found."
const FALLBACK_SYSTEM_PROMPT = `A call ended and no meeting-recorder transcript arrived within the 30-minute wait window, for a Strategic Partnership Manager's post-meeting follow-up dashboard. Infer context from this contact's recent email history instead.

1. SUMMARY — 1-2 short sentences. Explicitly note that no transcript was found, then give whatever context the recent email history suggests about the relationship/topic (or say the history gave little context, if that's true — don't invent specifics that aren't supported by the messages shown).

2. DRAFTS — exactly two distinct generic-but-informed follow-up note options ("great to catch up — following up on X" style, where X is grounded in the email history if possible). Tone: warm-but-concrete, never generic pleasantries. Each needs a short label describing its angle. Every draft must end with the sign-off "Best,\nEllen" — never a different closing line or name.`;

export async function draftFallbackFollowup(input: MeetingForFallback): Promise<FallbackFollowupResult> {
  const client = openaiClient();

  const historyText = input.recentHistory.length
    ? input.recentHistory.map((h) => `- ${h.date}: "${h.subject}" — ${h.snippet}`).join("\n")
    : "(no recent email history found with this contact)";

  const userPrompt = `Meeting: ${input.title}
Attendee: ${input.attendeeName}

Recent email history with this contact (most relevant available):
${historyText}`;

  const startedAt = Date.now();
  const completion = await client.chat.completions.parse({
    model: openaiModel(),
    messages: [
      { role: "system", content: FALLBACK_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    response_format: zodResponseFormat(FallbackFollowupSchema, "fallback_followup"),
  });
  logAiCall("fallback_followup", openaiModel(), startedAt, completion.usage);

  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) {
    throw new Error("OpenAI did not return a parsed fallback_followup response");
  }
  return parsed;
}
