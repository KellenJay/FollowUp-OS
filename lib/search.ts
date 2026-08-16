import { loadDashboard } from "@/lib/dashboard";

// Real keyword matching, not the fuller natural-language-answer version the
// original PRD/SKILLS.md spec describes ("did I ever reply to Marcus about
// the Q3 pricing?") — that would mean an extra OpenAI call per search. This
// answers the same style of question whenever the name/topic literally
// appears in the data, which covers the common case without adding new AI
// cost silently. Broader than the MCP search_threads tool (app/api/mcp) —
// this also searches sent and dismissed, since "did I reply to X" is
// exactly the case where the answer is sitting in one of those, not still
// in the active queue.
type SearchableItem = Record<string, unknown> & { id: string };

const FIELDS = ["subject", "name", "org", "mailbox", "snippet", "why", "summary", "nudge", "title"];

function matches(item: SearchableItem, query: string): boolean {
  const q = query.toLowerCase();
  return FIELDS.some((f) => {
    const v = item[f];
    return typeof v === "string" && v.toLowerCase().includes(q);
  });
}

function summarize(item: SearchableItem) {
  const { av, initials, body, ...rest } = item;
  void av;
  void initials;
  void body;
  return rest;
}

export type SearchResultItem = ReturnType<typeof summarize> & { source: string };

export async function searchDashboard(ownerId: string, query: string): Promise<SearchResultItem[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const dashboard = await loadDashboard(ownerId);
  const sources: [string, SearchableItem[]][] = [
    ["needs_reply", dashboard.threads],
    ["low_confidence", dashboard.lowConf],
    ["follow_up", dashboard.followUps],
    ["sent", dashboard.sent],
    ["dismissed", dashboard.dismissed],
  ];

  const results: SearchResultItem[] = [];
  for (const [source, items] of sources) {
    for (const item of items) {
      if (matches(item, trimmed)) {
        results.push({ ...summarize(item), source });
      }
    }
  }
  return results;
}
