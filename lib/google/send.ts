import { gmail_v1, google } from "googleapis";
import type { GoogleAuthClient } from "@/lib/google/oauth-client";

function getHeader(headers: gmail_v1.Schema$MessagePartHeader[] | undefined, name: string): string {
  return headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function ensureReplySubject(subject: string): string {
  return /^re:\s/i.test(subject) ? subject : `Re: ${subject}`;
}

// Builds a minimal RFC 2822 message and base64url-encodes it, the format
// the Gmail API's messages.send expects for the `raw` field.
function buildRawMessage(params: {
  to: string;
  subject: string;
  body: string;
  inReplyTo?: string;
  references?: string;
}): string {
  const headers = [
    `To: ${params.to}`,
    `Subject: ${params.subject}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    `MIME-Version: 1.0`,
  ];
  if (params.inReplyTo) headers.push(`In-Reply-To: ${params.inReplyTo}`);
  if (params.references) headers.push(`References: ${params.references}`);

  const raw = `${headers.join("\r\n")}\r\n\r\n${params.body}`;
  return Buffer.from(raw).toString("base64url");
}

export type SentMessageInfo = {
  gmailMessageId: string;
  recipientEmail: string;
  subject: string;
};

// Replies inside an existing Gmail thread — fetches the thread's last
// message live to get the Message-ID/References chain needed for proper
// threading (CLAUDE.md: never send outside an explicit user action; this
// is only ever called after that action already happened).
export async function sendReplyInThread(
  auth: GoogleAuthClient,
  params: { gmailThreadId: string; body: string; recipientOverride?: string }
): Promise<SentMessageInfo> {
  const gmail = google.gmail({ version: "v1", auth });

  const { data: thread } = await gmail.users.threads.get({
    userId: "me",
    id: params.gmailThreadId,
    format: "metadata",
    metadataHeaders: ["Message-ID", "References", "Subject", "From", "To"],
  });

  const messages = thread.messages ?? [];
  const last = messages[messages.length - 1];
  if (!last) {
    throw new Error(`Gmail thread ${params.gmailThreadId} has no messages`);
  }
  const headers = last.payload?.headers;

  // Reply to whoever the last message's counterparty is: if the override
  // wasn't given, prefer the "From" address (replying to an inbound
  // message) and fall back to "To" (nudging our own outbound message that
  // nobody replied to yet).
  const recipient = params.recipientOverride || getHeader(headers, "From") || getHeader(headers, "To");
  if (!recipient) {
    throw new Error(`Could not determine a recipient for thread ${params.gmailThreadId}`);
  }

  const messageId = getHeader(headers, "Message-ID");
  const existingReferences = getHeader(headers, "References");
  const references = [existingReferences, messageId].filter(Boolean).join(" ");
  const subject = ensureReplySubject(getHeader(headers, "Subject"));

  const raw = buildRawMessage({
    to: recipient,
    subject,
    body: params.body,
    inReplyTo: messageId || undefined,
    references: references || undefined,
  });

  const { data: sent } = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw, threadId: params.gmailThreadId },
  });

  if (!sent.id) {
    throw new Error("Gmail did not return a message id for the sent reply");
  }

  return { gmailMessageId: sent.id, recipientEmail: recipient, subject };
}

// Standalone new email, no thread to reply into — used for post-meeting
// notes, which aren't reliably tied to one specific existing Gmail thread.
export async function sendStandaloneEmail(
  auth: GoogleAuthClient,
  params: { to: string; subject: string; body: string }
): Promise<SentMessageInfo> {
  const gmail = google.gmail({ version: "v1", auth });

  const raw = buildRawMessage({ to: params.to, subject: params.subject, body: params.body });

  const { data: sent } = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });

  if (!sent.id) {
    throw new Error("Gmail did not return a message id for the sent email");
  }

  return { gmailMessageId: sent.id, recipientEmail: params.to, subject: params.subject };
}
