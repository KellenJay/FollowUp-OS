-- Records every failed AI-call attempt (not just the terminal failure after
-- retries are exhausted -- a transient blip that succeeded on retry 2 is
-- still logged here) plus mailbox-level scan failures. ai_call_logs only
-- ever records successful calls; this is where failures live.
create table error_log (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id) on delete cascade,
  source text not null,
  attempt integer not null default 1,
  will_retry boolean not null default false,
  error_message text not null,
  error_status integer,
  created_at timestamptz not null default now()
);

create index error_log_owner_id_created_at_idx on error_log (owner_id, created_at desc);

alter table error_log enable row level security;
