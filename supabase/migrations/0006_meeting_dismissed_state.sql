-- Lets Ellen dismiss ("Skip this call") a post-meeting card for real,
-- mirroring the thread dismiss/restore work in 0005 — same "archive, don't
-- delete, always reversible" pattern from CLAUDE.md, now extended to
-- meetings so it doesn't stay a client-only fake action.
alter table meetings
  drop constraint meetings_state_check,
  add constraint meetings_state_check
    check (state in ('waiting', 'found', 'none', 'dismissed'));
