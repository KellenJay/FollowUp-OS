# PRD — HeartCount Relationship OS (working title)

## Problem

Ellen (Strategic Partnership Manager, HeartCount) manages a high volume of partnership/business-development email across two inboxes (HeartCount + Trivia), attends calls recorded inconsistently across meeting tools, and currently has to manually triage, draft, and follow up on everything. She wants this automated end to end, with herself as the approval gate on anything that goes out.

## Users

Primary: Ellen, single user for v1. She's expressed wanting to eventually share this with colleagues — don't architect in a way that precludes multi-tenancy later, but v1 can be single-tenant.

## Why a standalone app (not a Claude-Code-native tool)

A prototype of phase 1 was built and heavily iterated live inside a Claude Code chat session, rendering an interactive dashboard via widgets backed by Gmail/Calendar MCP connectors. It worked, but only inside that one chat session — not shareable with colleagues, not usable from a phone without Claude open, no independent hosting. Ellen decided the extra build cost of a real app is worth it for: independent hosting (Vercel), a GitHub repo, colleague sharing, and phone access.

## Phases

### Phase 1 — Inbox triage dashboard (prototype already validated, rebuild as a real app)
- Scan a connected Gmail inbox for unanswered threads (recency window, e.g. last 14 days).
- Classify into: **Needs your reply** (real, specific asks), **Low confidence** (ambiguous/newsletter-like), **skip entirely** (automated notifications — don't surface).
- Before tagging anything low-confidence/cold-outreach, search the sender's full mailbox history — a recency-windowed scan alone misses ongoing relationships that just fall outside the window. This was a confirmed miss during prototyping: a message was wrongly tagged cold outreach when it was actually a continuation of an existing conversation.
- For low-confidence senders with no visible history, ask permission before running that broader search — don't do it silently/reflexively for every sender (token/API cost), but don't skip it once something is genuinely ambiguous either.
- Each "Needs your reply" / opened "Low confidence" thread gets: an inline email preview (no need to leave the app), a link to open the source thread in Gmail, TWO distinct AI-drafted reply options (warm-but-concrete tone — acknowledge context, commit to one specific next step, reference a specific detail from the thread; this tone was confirmed to work via user feedback), and a free-text box to describe a custom reply instead.
- A "Not interested" / dismiss action per thread that's reversible (archives, doesn't delete) — surfaced in a persistent "Dismissed" list with a restore action. Every priority tier gets equal interactivity — a low-confidence item isn't second-class, it still gets the same preview/draft/dismiss capability as a top-priority one.
- A "Sent" section listing recently-resolved threads (sent via this app, or answered by Ellen directly in Gmail) with a preview toggle and thumbs-up/down feedback — feedback must stay attached to the thread after it's resolved, not disappear with the card.
- A search bar for natural-language mailbox queries ("did I ever reply to X about Y") and a manual refresh action, plus a scheduled daily (~8am) auto-scan.
- **Never send automatically.** Every version of this so far only creates drafts; a human always does the final send. Whether the real app supports one-click actual sending (via the Gmail API's send endpoint) instead of draft-then-manual-send in Gmail is an open decision — see Open Questions.

### Phase 2 — Sent-mail follow-up nudges
- Track emails Ellen sent that haven't gotten a reply after N business days (Gmail itself has a similar "nudge" feature as prior art).
- Prompt her to send a follow-up, with drafted options, same approve/edit/regenerate loop as phase 1.

### Phase 3 — Post-meeting summaries
- After a calendar meeting ends, wait for a transcript email to arrive (from a meeting-recorder tool) before drafting a follow-up.
- **Wait window: 30 minutes** (confirmed by Ellen; an earlier suggestion of 13 minutes was explicitly corrected).
- Meeting-recorder reality check from prototyping: Otter.ai has repeatedly failed to get admitted into meetings ("host has not admitted your notetaker") and separately hit its Basic-plan storage limit. Optiverse has reliably produced full summaries with action items on the same calls. Design phase 3 to treat "whichever transcript-style email arrives first in the window" as the source rather than hard-coding Otter as primary.
- If a transcript arrives within the window: summarize it and draft a follow-up referencing the actual discussion/action items.
- If no transcript arrives within the window: fall back to the recent email thread history with that contact (last ~10 messages) to infer context, draft a generic-but-informed follow-up, and flag that no transcript was found.
- Two draft options + custom-instruction box, same pattern as phase 1.

### Phase 4 (future/advanced) — HubSpot lead-stage automation
- Ellen needs to first build a lead pipeline in HubSpot (stage definitions TBD by her).
- After a call (from a transcript, or from Ellen's own manual feedback about how a call went), automatically move the associated HubSpot contact/deal to the appropriate next pipeline stage based on conversation content.
- This is explicitly out of scope for the initial build — plan the data model so it isn't precluded later (e.g. store enough structured metadata per contact/thread that a future HubSpot sync can hook into it), but don't build the HubSpot integration itself yet.

### AI assistant connector — MCP server (added 2026-07-25, immediate priority)
Separate from the app's own inbound Gmail/Calendar API integration (see Suggested architecture — that stays direct API, not MCP), the app itself should expose its **own** MCP server so external AI assistants can query it directly. Ellen's use case: open Claude (the assistant, not this app) and ask something like "did I reply to X about Y," with Claude able to reach into the HeartCount dashboard's data rather than Ellen having to open the app itself.
- **v1 (build now, alongside/after the initial scaffold — do not wait for Claude Design):** Claude/Anthropic connector only. Expose read/search tools (e.g. list needs-reply threads, search mailbox history, get a thread's draft options) via a remote MCP endpoint that Ellen can add as a custom connector in Claude Desktop/claude.ai.
- **Later, bundled with Phase 4 (HubSpot):** broaden to other AI assistants (ChatGPT, Gemini, Perplexity) as their connector ecosystems support it. Also later: connectors for other transcript/recording tools beyond Otter/Optiverse (Loom, Granola, ElevenLabs, Google's notetaker) as optional, user-configurable integrations for Phase 3.
- **UI footprint is small and not design-heavy:** a "Connectors" section within Settings, reusing the same card/status-pill pattern already established for mailbox connections — showing connection status, the MCP server URL, and any auth token. Build this directly in code during the backend-layering step; it doesn't need its own Claude Design mockup pass unless a quick visual-consistency check turns out to be useful.

## Non-goals for v1
- Multi-account support beyond HeartCount at launch — Trivia Gmail gets its own OAuth connection once that account is available; design the auth/account model so adding a second mailbox later doesn't require a rebuild.
- HubSpot integration (phase 4, later).
- Fully autonomous sending without human review.

## Suggested architecture

- **Framework:** Next.js (App Router) + TypeScript, deployed on Vercel.
- **Auth:** Google OAuth (Gmail + Calendar scopes) per connected account; NextAuth.js or equivalent.
- **Database:** Postgres (Vercel Postgres / Neon) — persists per-thread state (needs-reply / low-confidence / sent / dismissed), feedback ratings, follow-up-nudge schedule state, meeting/transcript-wait timers.
- **Background jobs:** Vercel Cron (or a queue) for the daily inbox scan, the 30-minute post-meeting transcript check, and the N-business-day follow-up check.
- **Gmail/Calendar:** direct Google API integration (not an MCP connector — this is a standalone app with its own OAuth client).
- **LLM:** Claude API (Anthropic) for classification, drafting, and summarization — same approach already proven out in the prototype.
- **Design system:** whatever comes out of the Claude Design → `design-prototype-to-repo` pipeline (see Recommended Build Path).

## Recommended build path

1. Mock up the dashboard screens in Claude Design (claude.ai/design), reusing the layout already validated in the prototype (search bar + refresh at top, alert banner, Needs-reply / Low-confidence / Sent / Dismissed sections, two-option draft cards with a custom-instruction box).
2. Export from Claude Design.
3. In a new session, run the `design-prototype-to-repo` skill (already installed at `~/.claude/skills/design-prototype-to-repo/`) against that export — it turns a Claude Design bundle into a real, working, framework-free static site ready for GitHub/Vercel.
4. Layer in the backend on top of that scaffold: Google OAuth, Gmail/Calendar API calls, Postgres, Claude API calls, cron jobs — using this PRD as the spec.

## Open questions

- ~~Does the real app support one-click actual sending...~~ **Resolved (2026-07-25):** one-click send via Gmail API `send`, but every draft opens in an in-app editable review view first — Ellen edits inline and explicitly clicks Send per email. Still satisfies "never send automatically" since the send action is always a manual, per-email click after review, not a background/batch send.
- ~~Is colleague/multi-user access in scope for v1...~~ **Resolved (2026-07-25):** lightweight multi-user affordance in v1 (e.g. an account indicator), not a full team-switcher — don't build multi-tenant data isolation yet, just don't block it visually.
- ~~Multi-account support...~~ **Resolved (2026-07-25):** the mailbox switcher should support an arbitrary number of connected inboxes (list/dropdown pattern), not a fixed two-tab HeartCount/Trivia layout — some users may eventually connect more than 2.
- HubSpot pipeline name and stage definitions (Ellen defines these directly in HubSpot before phase 4 starts).
- When does the Trivia Gmail account get connected — day one of the real build, or after phase 1 ships?
- Data retention/privacy policy for storing email content in a database (how long, encrypted at rest, etc.)

## Reference material from the prototype

Full detail on the prototype's design decisions, UI feedback, and email-draft style preferences lives in this Claude Code account's memory: `project_inbox_dashboard.md`, `feedback_dashboard_ui_patterns.md`, and `feedback_email_draft_style.md` (under `~/.claude/projects/*/memory/`). A reusable HTML/CSS/JS template of the validated dashboard layout is at `inbox_dashboard_template.html` in the same directory, and a Cowork skill version of phase 1 exists at `~/.claude/skills/inbox-triage/` (built before the decision to go with a standalone app instead — useful as a working reference for the classification/drafting logic even though the delivery mechanism changed).
