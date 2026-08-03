import { gmail_v1, google } from "googleapis";
import type { GoogleAuthClient } from "@/lib/google/oauth-client";

export type ScannedThread = {
  gmailThreadId: string;
  subject: string;
  snippet: string;
  body: string;
  senderName: string;
  senderEmail: string;
  waitedHours: number;
  messageCount: number;
  lastMessageAt: string;
};

export type ScannedTranscript = {
  gmailThreadId: string;
  subject: string;
  body: string;
  senderEmail: string;
  receivedAt: string;
};

export type ScannedSentMessage = {
  gmailMessageId: string;
  gmailThreadId: string;
  subject: string;
  body: string;
  recipientName: string;
  recipientEmail: string;
  recipientRaw: string; // full To: header, may list multiple recipients — used to detect team/broadcast sends
  sentAt: string;
  awaitingReply: boolean;
};

export type ContactHistoryMessage = {
  subject: string;
  snippet: string;
  date: string;
};

const NOREPLY_PATTERN = /no-?reply|do-?not-?reply|notifications?@|mailer-daemon/i;

// Auto-generated calendar RSVP/OOO notifications — never something to
// compose a reply to, so no point surfacing them as low-confidence either.
const CALENDAR_NOTIFICATION_PATTERN =
  /^(re:\s*)?(accepted|declined|tentative|updated invitation|invitation|canceled event|out of office|automatic reply)\b/i;

// Known meeting-recorder/transcript tools (per PRD.md's phase 3 notes:
// Optiverse and Otter today, Granola/Apollo/Loom/etc. as optional integrations
// later) plus a keyword fallback, since new tools appear under domains we
// won't have listed yet. Emails matching either are meeting summaries, not
// threads awaiting a reply — see PRD.md phase 3.
const TRANSCRIPT_SENDER_DOMAINS = [
  "otter.ai",
  "optiverse.io",
  "optiverse.com",
  "fireflies.ai",
  "granola.ai",
  "apollo.io",
  "avoma.com",
  "grain.com",
  "fathom.video",
  "gong.io",
];
const TRANSCRIPT_KEYWORD_PATTERN = /meeting summary|meeting notes|call recap|transcript|action items/i;

function looksLikeTranscriptEmail(senderEmail: string, subject: string, snippet: string): boolean {
  const domain = senderEmail.split("@")[1] ?? "";
  if (TRANSCRIPT_SENDER_DOMAINS.some((d) => domain.endsWith(d))) return true;
  return TRANSCRIPT_KEYWORD_PATTERN.test(subject) || TRANSCRIPT_KEYWORD_PATTERN.test(snippet);
}

function getHeader(headers: gmail_v1.Schema$MessagePartHeader[] | undefined, name: string): string {
  return headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function parseFromHeader(value: string): { name: string; email: string } {
  const match = value.match(/^(.*?)\s*<(.+)>$/);
  if (match) {
    return { name: match[1].replace(/"/g, "").trim() || match[2], email: match[2].trim().toLowerCase() };
  }
  return { name: value.trim(), email: value.trim().toLowerCase() };
}

// Cuts a message body at the point where quoted/prior-message content
// starts, so the preview shows only what this specific sender actually
// wrote — not the whole reply chain (client "View in Gmail" already covers
// full history). Matches the common quote-boundary conventions across Gmail,
// Outlook, and Yahoo Mail (the biggest offender for verbose forwarded
// headers in practice).
const QUOTE_BOUNDARY_PATTERNS = [
  /^[ \t]*On .{0,140}wrote:[ \t]*$/im,
  /^-{2,}[ \t]*Original Message[ \t]*-{2,}/im,
  /^From:[ \t].+\n(Sent|Date):[ \t].+\n(To:[ \t].+\n)?(Cc:[ \t].+\n)?Subject:[ \t].+/im,
  /^_{5,}[ \t]*$/m,
  /^>{1,}/m,
];

function stripQuotedContent(body: string): string {
  let cutIndex = body.length;
  for (const pattern of QUOTE_BOUNDARY_PATTERNS) {
    const match = body.match(pattern);
    if (match?.index !== undefined && match.index < cutIndex) cutIndex = match.index;
  }
  return body
    .slice(0, cutIndex)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function decodeBody(payload: gmail_v1.Schema$MessagePart | undefined): string {
  return stripQuotedContent(extractRawBody(payload));
}

// HTML emails (especially templated/dashboard-style ones) commonly encode
// punctuation as entities — left undecoded, they show up literally in the
// preview (e.g. "don&#x27;t", "10%&nbsp;of"), confirmed as a real readability
// complaint from a BalancewiseIQ-style report email during testing.
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'");
}

function extractRawBody(payload: gmail_v1.Schema$MessagePart | undefined): string {
  if (!payload) return "";

  function findPart(part: gmail_v1.Schema$MessagePart, mimeType: string): gmail_v1.Schema$MessagePart | null {
    if (part.mimeType === mimeType && part.body?.data) return part;
    for (const child of part.parts ?? []) {
      const found = findPart(child, mimeType);
      if (found) return found;
    }
    return null;
  }

  const plain = findPart(payload, "text/plain");
  if (plain?.body?.data) {
    return Buffer.from(plain.body.data, "base64url").toString("utf8");
  }

  const html = findPart(payload, "text/html");
  if (html?.body?.data) {
    const raw = Buffer.from(html.body.data, "base64url").toString("utf8");
    // Strip <style>/<script> blocks with their contents first — a plain
    // tag-strip leaves embedded CSS ("@media (max-width...") as visible text,
    // since removing only the wrapper tags doesn't remove what was between them.
    const withoutStyleScript = raw
      .replace(/<!--[\s\S]*?-->/g, " ") // MSO/Outlook conditional comments etc.
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ");
    return decodeHtmlEntities(withoutStyleScript.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
  }

  if (payload.body?.data) {
    return Buffer.from(payload.body.data, "base64url").toString("utf8");
  }

  return "";
}

function isFromAddress(headers: gmail_v1.Schema$MessagePartHeader[] | undefined, address: string): boolean {
  const from = parseFromHeader(getHeader(headers, "From"));
  return from.email.toLowerCase() === address.toLowerCase();
}

const INBOX_SCAN_DAYS = 7;
const INBOX_SCAN_MAX_CANDIDATES = 30;
const INBOX_QUEUE_CAP = 25; // keep the active queue at "actually triageable" size

// Gmail's tab categories, filtered client-side by labelIds — the `category:`
// and `label:category_*` search-string operators look like they should work
// (they're documented Gmail search syntax) but return zero results via the
// API on this account, confirmed by direct testing. CATEGORY_UPDATES is
// deliberately NOT excluded here even though it's borderline: meeting-
// transcript emails (Otter, Optiverse) land in Updates too, and we still
// need to see those to route them to the meetings table below.
const EXCLUDED_CATEGORIES = ["CATEGORY_PROMOTIONS", "CATEGORY_SOCIAL", "CATEGORY_FORUMS"];

export async function scanInboxThreads(
  auth: GoogleAuthClient,
  mailboxAddress: string,
  days = INBOX_SCAN_DAYS
): Promise<{ threads: ScannedThread[]; transcripts: ScannedTranscript[] }> {
  const gmail = google.gmail({ version: "v1", auth });
  const list = await gmail.users.threads.list({
    userId: "me",
    q: `in:inbox newer_than:${days}d`,
    maxResults: INBOX_SCAN_MAX_CANDIDATES,
  });

  const threads: ScannedThread[] = [];
  const transcripts: ScannedTranscript[] = [];

  for (const threadRef of list.data.threads ?? []) {
    if (!threadRef.id) continue;
    if (threads.length >= INBOX_QUEUE_CAP) break;

    const { data: thread } = await gmail.users.threads.get({
      userId: "me",
      id: threadRef.id,
      format: "full",
    });

    const messages = thread.messages ?? [];
    if (messages.length === 0) continue;

    const last = messages[messages.length - 1];
    const headers = last.payload?.headers;

    if ((last.labelIds ?? []).some((l) => EXCLUDED_CATEGORIES.includes(l))) continue;

    // Last message is from us — she already replied, nothing to surface.
    if (isFromAddress(headers, mailboxAddress)) continue;

    const from = parseFromHeader(getHeader(headers, "From"));
    if (NOREPLY_PATTERN.test(from.email)) continue; // automated sender — skip per PRD

    const subject = getHeader(headers, "Subject") || "(no subject)";
    if (CALENDAR_NOTIFICATION_PATTERN.test(subject)) continue;

    const snippet = last.snippet ?? "";

    if (looksLikeTranscriptEmail(from.email, subject, snippet)) {
      transcripts.push({
        gmailThreadId: threadRef.id,
        subject,
        body: decodeBody(last.payload),
        senderEmail: from.email,
        receivedAt: last.internalDate ? new Date(Number(last.internalDate)).toISOString() : new Date().toISOString(),
      });
      continue;
    }

    const lastMessageAt = last.internalDate ? new Date(Number(last.internalDate)) : new Date();

    threads.push({
      gmailThreadId: threadRef.id,
      subject,
      snippet,
      body: decodeBody(last.payload),
      senderName: from.name,
      senderEmail: from.email,
      waitedHours: Math.max(0, (Date.now() - lastMessageAt.getTime()) / 3_600_000),
      messageCount: messages.length,
      lastMessageAt: lastMessageAt.toISOString(),
    });
  }

  return { threads, transcripts };
}

// Checks one specific thread directly, regardless of scan window/category —
// used to verify a previously-tracked thread has actually been answered
// before reconciling it out of the active queue. Never infer "answered" just
// because a thread fell outside a scan's candidate list; that list is bounded
// by window/category/cap for cost reasons and absence there proves nothing.
export async function hasBeenAnsweredSince(
  auth: GoogleAuthClient,
  gmailThreadId: string,
  mailboxAddress: string
): Promise<boolean> {
  const gmail = google.gmail({ version: "v1", auth });
  const { data: thread } = await gmail.users.threads.get({
    userId: "me",
    id: gmailThreadId,
    format: "metadata",
    metadataHeaders: ["From"],
  });
  const messages = thread.messages ?? [];
  if (messages.length === 0) return false;
  const last = messages[messages.length - 1];
  return isFromAddress(last.payload?.headers, mailboxAddress);
}

export async function scanSentMessages(
  auth: GoogleAuthClient,
  mailboxAddress: string,
  days = 30
): Promise<ScannedSentMessage[]> {
  const gmail = google.gmail({ version: "v1", auth });
  const list = await gmail.users.messages.list({
    userId: "me",
    q: `in:sent newer_than:${days}d`,
    maxResults: 40,
  });

  const results: ScannedSentMessage[] = [];
  const seenThreads = new Set<string>();

  for (const msgRef of list.data.messages ?? []) {
    if (!msgRef.id || !msgRef.threadId || seenThreads.has(msgRef.threadId)) continue;
    seenThreads.add(msgRef.threadId);

    const { data: thread } = await gmail.users.threads.get({
      userId: "me",
      id: msgRef.threadId,
      format: "full",
    });

    const messages = thread.messages ?? [];
    if (messages.length === 0) continue;

    const last = messages[messages.length - 1];
    const headers = last.payload?.headers;
    // Only care about threads where our own sent message is still the most
    // recent one — if someone replied since, it's resolved, not a follow-up.
    const awaitingReply = isFromAddress(headers, mailboxAddress);

    // Find the specific sent message that matches this list entry, to use
    // its own recipient/subject/body rather than the thread's latest.
    const sentMessage = messages.find((m) => m.id === msgRef.id) ?? last;
    const sentHeaders = sentMessage.payload?.headers;
    const toRaw = getHeader(sentHeaders, "To");
    const to = parseFromHeader(toRaw);
    const sentAt = sentMessage.internalDate ? new Date(Number(sentMessage.internalDate)) : new Date();

    results.push({
      gmailMessageId: msgRef.id,
      gmailThreadId: msgRef.threadId,
      subject: getHeader(sentHeaders, "Subject") || "(no subject)",
      body: decodeBody(sentMessage.payload),
      recipientName: to.name,
      recipientEmail: to.email,
      recipientRaw: toRaw,
      sentAt: sentAt.toISOString(),
      awaitingReply,
    });
  }

  return results;
}

// PRD phase 3 fallback: "if no transcript arrives within the window, fall
// back to the recent email thread history with that contact (last ~10
// messages) to infer context." Uses metadata format (subject + snippet
// only, no body fetch) since this just needs enough context for a draft,
// not full message content.
export async function scanRecentHistoryWithContact(
  auth: GoogleAuthClient,
  contactEmail: string,
  limit = 10
): Promise<ContactHistoryMessage[]> {
  const gmail = google.gmail({ version: "v1", auth });
  const list = await gmail.users.messages.list({
    userId: "me",
    q: `(from:${contactEmail} OR to:${contactEmail})`,
    maxResults: limit,
  });

  const results: ContactHistoryMessage[] = [];
  for (const ref of list.data.messages ?? []) {
    if (!ref.id) continue;
    const { data: msg } = await gmail.users.messages.get({
      userId: "me",
      id: ref.id,
      format: "metadata",
      metadataHeaders: ["Subject", "Date"],
    });
    results.push({
      subject: getHeader(msg.payload?.headers, "Subject") || "(no subject)",
      snippet: msg.snippet ?? "",
      date: getHeader(msg.payload?.headers, "Date") || "",
    });
  }

  return results;
}
