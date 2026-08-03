-- Lets Ellen manually move an inbox thread into a "follow up later" bucket
-- from the dashboard, distinct from the sent-message-driven `followups`
-- table (Phase 2 nudges) — this is "I've decided to handle this myself
-- later" for a thread someone else sent her, not "I sent something and
-- haven't heard back." The dashboard merges both into the same Follow-ups
-- tab, tagged by origin, per Ellen's 2026-07-29 decision.
alter table threads
  drop constraint threads_status_check,
  add constraint threads_status_check
    check (status in ('needs_reply', 'low_confidence', 'dismissed', 'sent', 'manual_followup'));
