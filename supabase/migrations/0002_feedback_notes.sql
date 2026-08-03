-- Adds free-text feedback notes alongside the existing thumbs up/down, and
-- extends feedback capture to dismissed threads (not just sent items) —
-- requested so eval iteration has the "why", not just the rating.

alter table sent
  add column feedback_note text;

alter table threads
  add column feedback text check (feedback in ('up', 'down')),
  add column feedback_note text;
