-- Adds multi-select feedback reason tags (Claude-style thumb -> tags ->
-- optional comment pattern) alongside the existing up/down + note columns,
-- and extends feedback capture to followups and meetings, which never had
-- any feedback columns before now.

alter table threads
  add column feedback_tags text[];

alter table sent
  add column feedback_tags text[];

alter table followups
  add column feedback text check (feedback in ('up', 'down')),
  add column feedback_note text,
  add column feedback_tags text[];

alter table meetings
  add column feedback text check (feedback in ('up', 'down')),
  add column feedback_note text,
  add column feedback_tags text[];
