-- Makes Settings' "Reply promise" and "Draft voice" real, editable, and
-- actually connected to classification/drafting behavior (2026-08-14
-- feedback: these were previously hardcoded display strings with zero
-- backing data anywhere). "Scan cycle" stays display-only — there's no real
-- cron in this app to attach a stored interval to.
alter table app_settings
  add column reply_promise_hours integer not null default 24,
  add column draft_voice text;
