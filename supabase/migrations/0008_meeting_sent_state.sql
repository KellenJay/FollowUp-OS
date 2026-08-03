-- threads.status and followups.status already had 'sent' as a valid value
-- from day one (0001_init.sql) — meetings never did, since nothing could
-- actually send from a post-meeting card until now.
alter table meetings
  drop constraint meetings_state_check,
  add constraint meetings_state_check
    check (state in ('waiting', 'found', 'none', 'dismissed', 'sent'));
