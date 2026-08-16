# CLAUDE.md

This repo is FollowUp OS — see `PRD.md` for the full spec and `SKILLS.md` for a quick index of what each module does. Read both before making product decisions; this file is just working conventions.

## Build order

Follow the "Recommended build path" in `PRD.md`: Claude Design mockup → export → `design-prototype-to-repo` skill to scaffold the static UI → layer in the real backend (auth, Gmail/Calendar API, database, Claude API, cron) on top. Don't skip straight to backend work before the UI scaffold exists — the visual design was already validated with the user across several rounds of live iteration in an earlier prototype; rebuild from that, don't redesign from scratch.

## Product conventions (carried over from the validated prototype — don't relitigate these)

- **Never send email automatically.** Every draft needs explicit human approval before it goes out, at minimum a review step. If one-click send ships, it still requires an explicit user action per email, never a background/automatic send.
- **Dismiss must be reversible.** Archiving, not deleting. Always pair a dismiss action with a way to restore it.
- **Equal interactivity across priority tiers.** A "low confidence" item gets the same preview/draft/dismiss capability as a "needs reply" item — priority is a label, not a feature gate.
- **Search mailbox history before tagging something cold/low-confidence.** A recency-windowed scan misses ongoing relationships. Ask permission before an expensive full-history search only when the sender is genuinely ambiguous — don't skip the search once it's warranted.
- **Feedback persists past resolution.** A resolved/sent thread keeps its feedback controls (thumbs up/down) — don't let them disappear once a card moves out of the active queue.
- **Draft tone:** warm-but-concrete — acknowledge context, commit to one specific next step, reference a specific detail from the thread. Avoid generic pleasantries.

## Open product decisions (don't assume — ask the user)

See "Open questions" in `PRD.md`: one-click send vs. draft-only, HubSpot pipeline stage definitions, Trivia Gmail account connection timing, multi-user scope for v1, data retention policy.

## Reference material

Earlier Claude Code prototype work for this same product (session-bound, not this repo) lives in `~/.claude/projects/*/memory/` (`project_inbox_dashboard.md`, `feedback_dashboard_ui_patterns.md`, `feedback_email_draft_style.md`) and `~/.claude/skills/inbox-triage/`. Useful for the classification/drafting logic and the reasoning behind each UI decision, even though the delivery mechanism (Cowork session vs. standalone app) changed.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
