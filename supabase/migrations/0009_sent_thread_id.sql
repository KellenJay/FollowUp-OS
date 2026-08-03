-- Needed to reply-in-thread when nudging a followup: gmail_message_id alone
-- isn't enough to know which Gmail thread to reply into without an extra
-- API round-trip per send. scan.ts's scanSentMessages already fetches
-- gmailThreadId from the API (lib/google/gmail.ts) — it just never got
-- persisted alongside gmail_message_id.
alter table sent
  add column gmail_thread_id text;
