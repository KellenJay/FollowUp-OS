# FollowUp OS

A relationship/inbox-management dashboard: scans connected Gmail inboxes, classifies
threads into Needs-reply / Low-confidence / Needs-follow-up, drafts two AI reply
options per thread, and tracks post-meeting follow-ups. See `PRD.md` for the full
product spec and `SKILLS.md` for a feature index.

This started as a static front-end prototype rebuilt from a Claude Design export
and is now scaffolded on Next.js (App Router + TypeScript) so it can hold OAuth
tokens and call a database/LLM securely. The original vanilla `app.js` rendering
logic still runs client-side (served from `public/app.js`, mounted into `#app` by
`app/page.tsx`) — it's being incrementally wired to real data instead of the
mock data it started with, per `PRD.md`'s "Suggested architecture" and
"Recommended build path" (Google OAuth, Gmail/Calendar API, Postgres, Claude API,
cron jobs).

## What's actually interactive

- **Navigation** — sidebar (Inbox overview, Follow-ups, Post-meeting, Sent,
  Dismissed, Settings) and, on mobile, a hamburger drawer + bottom tab bar.
- **Home** — summary cards and per-mailbox breakdown rows all click through to a
  filtered view.
- **Follow-ups** — Needs-reply, Low-confidence, and Needs-follow-up sections with
  working expand/collapse, dismiss (reversible, with an Undo toast), and filter
  pills (Priority / Mailbox / Date range / Sender).
- **Post-meeting** — waiting/found/fallback call states, expand/collapse for call
  notes and action items, 48-hour pending nudge.
- **Thread / draft review** — two fully-editable AI draft options per thread
  (select, edit, reset), a custom-instruction box, Send (reversible via Undo
  toast, moves the thread to Sent), Save as draft, and Dismiss.
- **Sent** — thumbs up/down feedback per item, persists after the thread resolves.
- **Dismissed** — restore any dismissed item.
- **Settings** — per-mailbox scan pause/resume toggle, reconnect flow (mocked),
  add-mailbox flow (mocked), and an **AI assistant connectors** section: a v1
  Claude/Anthropic MCP connector card (status, server URL with copy, masked auth
  token with show/hide and a generate action) — intentionally shows
  "Not connected" since the real MCP server backend doesn't exist yet. ChatGPT,
  Gemini, Perplexity, and other transcript-tool connectors are noted as planned
  for later, per PRD.md.

Nothing ever sends automatically — every send is a manual, per-email click after
review, matching the product's "never auto-send" rule.

## Run locally

```bash
npm install
npm run dev
```

This runs `next dev` on port 3000.

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel: **Import Project** → select the repo.
3. Framework preset: **Next.js** (auto-detected — no manual config needed).
4. Deploy. Vercel redeploys automatically on every push once the project is
   linked.
