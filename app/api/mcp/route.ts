import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";
import { verifyMcpBearerToken } from "@/lib/mcp-auth";
import { loadDashboard } from "@/lib/dashboard";

// Read-only v1 — four tools covering the exact use case already promised in
// Settings' own copy ("did I reply to Marcus about the Q3 pricing?"). All
// reuse loadDashboard(ownerId) rather than writing new queries, so the
// assistant only ever sees exactly what the dashboard itself shows, nothing
// more. More tools (sent history, meetings, dismissed) are a trivial
// follow-on once this shape is proven — not needed for v1.

type SearchableItem = {
  id: string;
  subject?: string | null;
  name?: string | null;
  org?: string | null;
  snippet?: string | null;
  mailbox?: string | null;
};

function matches(item: SearchableItem, query: string): boolean {
  const q = query.toLowerCase();
  return [item.subject, item.name, item.org, item.snippet, item.mailbox].some((f) => (f ?? "").toLowerCase().includes(q));
}

function summarize(item: Record<string, unknown>) {
  // Drops UI-only cosmetic fields (avatar gradient, initials) an assistant
  // has no use for; keeps everything else.
  const { av, initials, ...rest } = item as { av?: unknown; initials?: unknown } & Record<string, unknown>;
  void av;
  void initials;
  return rest;
}

function textResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

async function getOwnerId(ctx: { http?: { authInfo?: { extra?: Record<string, unknown> } } }): Promise<string> {
  const ownerId = ctx.http?.authInfo?.extra?.ownerId;
  if (typeof ownerId !== "string") {
    // withMcpAuth({ required: true }) should make this unreachable — this is
    // a defensive fallback, not the primary auth gate.
    throw new Error("Not authenticated");
  }
  return ownerId;
}

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "search_threads",
      {
        title: "Search email threads",
        description:
          "Search across needs-reply, low-confidence, and follow-up threads by keyword (matches subject, sender name/org, mailbox, or the AI's reasoning). Use this to answer questions like 'did I reply to Marcus about the Q3 pricing?'",
        inputSchema: z.object({ query: z.string().min(1) }),
      },
      async ({ query }, ctx) => {
        const ownerId = await getOwnerId(ctx);
        const dashboard = await loadDashboard(ownerId);
        const results = [...dashboard.threads, ...dashboard.lowConf, ...dashboard.followUps]
          .filter((item) => matches(item, query))
          .map(summarize);
        return textResult({ query, count: results.length, results });
      }
    );

    server.registerTool(
      "get_thread",
      {
        title: "Get a thread's full detail",
        description: "Full detail for one thread/follow-up by id, including its full body and any AI-drafted replies.",
        inputSchema: z.object({ id: z.string().min(1) }),
      },
      async ({ id }, ctx) => {
        const ownerId = await getOwnerId(ctx);
        const dashboard = await loadDashboard(ownerId);
        const item = [...dashboard.threads, ...dashboard.lowConf, ...dashboard.followUps, ...dashboard.dismissed].find(
          (t) => t.id === id
        );
        if (!item) {
          return textResult({ error: `No thread found with id ${id}` });
        }
        return textResult({ ...summarize(item), drafts: dashboard.drafts[id] ?? [] });
      }
    );

    server.registerTool(
      "list_needs_reply",
      {
        title: "List threads needing a reply",
        description: "The current needs-reply queue: threads a real reply is owed on.",
        inputSchema: z.object({}),
      },
      async (_args, ctx) => {
        const ownerId = await getOwnerId(ctx);
        const dashboard = await loadDashboard(ownerId);
        return textResult({ count: dashboard.threads.length, threads: dashboard.threads.map(summarize) });
      }
    );

    server.registerTool(
      "list_follow_ups",
      {
        title: "List pending follow-up nudges",
        description: "Sent messages that haven't gotten a reply yet and are flagged as genuinely warranting a follow-up nudge.",
        inputSchema: z.object({}),
      },
      async (_args, ctx) => {
        const ownerId = await getOwnerId(ctx);
        const dashboard = await loadDashboard(ownerId);
        return textResult({ count: dashboard.followUps.length, followUps: dashboard.followUps.map(summarize) });
      }
    );
  },
  { serverInfo: { name: "FollowUp OS", version: "1.0.0" } }
);

const authedHandler = withMcpAuth(handler, verifyMcpBearerToken, { required: true });

export { authedHandler as GET, authedHandler as POST };
