-- Real AI-drafted follow-up nudges (previously always placeholder text —
-- see lib/openai/classify.ts's classifyFollowupRelevance, now also drafts).
-- Same pattern as 0007_meeting_ai_summaries.sql's meetings.drafts column.
alter table followups
  add column drafts jsonb not null default '[]'::jsonb;
