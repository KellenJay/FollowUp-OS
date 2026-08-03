import { gmail_v1, google } from "googleapis";
import type { GoogleAuthClient } from "@/lib/google/oauth-client";

export type SenderCandidate = {
  address: string;
  name: string;
  receivedCount: number;
  sentCount: number;
  lastContactAt: string;
};

const NOREPLY_PATTERN = /no-?reply|do-?not-?reply|notifications?@|mailer-daemon/i;

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

// Aggregates who Ellen actually exchanges mail with, from her most recent
// messages in each direction — used once, at onboarding, to propose VIP
// candidates. Mutual back-and-forth (she wrote to them AND they wrote to
// her) is weighted far above one-directional volume, since a mailing list
// can send 50 messages without ever being a real relationship.
export async function scanSenderCandidates(
  auth: GoogleAuthClient,
  mailboxAddress: string,
  perFolderLimit = 50
): Promise<SenderCandidate[]> {
  const gmail = google.gmail({ version: "v1", auth });
  const stats = new Map<string, { name: string; received: number; sent: number; lastContact: number }>();

  async function processFolder(query: string, direction: "received" | "sent") {
    const list = await gmail.users.messages.list({ userId: "me", q: query, maxResults: perFolderLimit });
    for (const ref of list.data.messages ?? []) {
      if (!ref.id) continue;
      const { data: msg } = await gmail.users.messages.get({
        userId: "me",
        id: ref.id,
        format: "metadata",
        metadataHeaders: ["From", "To", "Date"],
      });
      const headers = msg.payload?.headers;
      const raw = getHeader(headers, direction === "received" ? "From" : "To");
      if (!raw) continue;

      const { name, email } = parseFromHeader(raw.split(",")[0]);
      if (email === mailboxAddress.toLowerCase()) continue;
      if (NOREPLY_PATTERN.test(email)) continue;

      const ts = msg.internalDate ? Number(msg.internalDate) : Date.now();
      const entry = stats.get(email) ?? { name, received: 0, sent: 0, lastContact: 0 };
      entry[direction]++;
      entry.lastContact = Math.max(entry.lastContact, ts);
      if (name) entry.name = name;
      stats.set(email, entry);
    }
  }

  await processFolder("in:inbox", "received");
  await processFolder("in:sent", "sent");

  return Array.from(stats.entries())
    .map(([address, s]) => ({
      address,
      name: s.name || address,
      receivedCount: s.received,
      sentCount: s.sent,
      lastContactAt: new Date(s.lastContact).toISOString(),
      score: Math.min(s.received, s.sent) * 3 + s.received + s.sent,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(({ address, name, receivedCount, sentCount, lastContactAt }) => ({
      address,
      name,
      receivedCount,
      sentCount,
      lastContactAt,
    }));
}
