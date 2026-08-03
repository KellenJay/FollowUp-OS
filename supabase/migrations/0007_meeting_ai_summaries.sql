-- Phase 3 (post-meeting) never actually got its AI step built: `summary`
-- was just the raw transcript email body truncated to 4000 chars, and
-- `action_items` was never populated by any code path. This closes that gap:
-- attendee_email lets the 30-minute-no-transcript fallback search Gmail
-- history with the right contact (PRD phase 3, "no transcript" behavior),
-- and drafts stores the AI-generated follow-up options directly on the row
-- rather than the `drafts` table, whose thread_id column is a foreign key
-- to `threads` only — meetings were never a valid target for it.
alter table meetings
  add column attendee_email text,
  add column drafts jsonb not null default '[]'::jsonb;
