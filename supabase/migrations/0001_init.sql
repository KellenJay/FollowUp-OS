-- FollowUp OS — initial schema
-- Mirrors the mock data shapes in public/app.js (MAILBOXES, THREADS, LOWCONF,
-- SENT, MEETINGS, FOLLOWUPS) so the backend can swap mock consts for real
-- queries without changing the front-end's data shape.
--
-- Single-tenant for v1 (owner_id is just Ellen's account), but every top-level
-- table carries owner_id so multi-user support later is a query filter, not a
-- schema rebuild (per PRD.md "Users" section).

create extension if not exists "pgcrypto";

create table mailboxes (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,
  address text not null,
  role text,
  dot_color text,
  state text not null default 'sync' check (state in ('ok', 'reauth', 'sync')),
  scan_paused boolean not null default false,
  last_scanned_at timestamptz,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, address)
);

create table threads (
  id uuid primary key default gen_random_uuid(),
  mailbox_id uuid not null references mailboxes(id) on delete cascade,
  gmail_thread_id text not null,
  tier text check (tier in ('today', 'week', 'fyi')),
  status text not null default 'needs_reply' check (status in ('needs_reply', 'low_confidence', 'dismissed', 'sent')),
  low_confidence boolean not null default false,
  subject text,
  snippet text,
  body text,
  sender_name text,
  sender_org text,
  sender_email text,
  why text,
  waited_hours integer,
  -- structured slot for future HubSpot lead-stage sync (PRD Phase 4) — not
  -- populated or read by anything yet, just reserved so that phase doesn't
  -- require a schema change.
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mailbox_id, gmail_thread_id)
);

create table drafts (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references threads(id) on delete cascade,
  label text,
  tone text,
  body text not null,
  source text not null default 'ai' check (source in ('ai', 'custom')),
  selected boolean not null default false,
  created_at timestamptz not null default now()
);

create table sent (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references threads(id) on delete set null,
  mailbox_id uuid not null references mailboxes(id) on delete cascade,
  gmail_message_id text,
  subject text,
  body text,
  origin text check (origin in ('option_a', 'option_b', 'edited', 'custom', 'direct_in_gmail')),
  -- feedback lives on the sent row itself (not the thread) so it survives
  -- independently of the thread's active-queue lifecycle, per CLAUDE.md.
  feedback text check (feedback in ('up', 'down')),
  sent_at timestamptz not null default now()
);

create table meetings (
  id uuid primary key default gen_random_uuid(),
  mailbox_id uuid not null references mailboxes(id) on delete cascade,
  calendar_event_id text not null,
  title text,
  attendee_name text,
  attendee_org text,
  state text not null default 'waiting' check (state in ('waiting', 'found', 'none')),
  transcript_source text,
  summary text,
  action_items jsonb not null default '[]'::jsonb,
  ended_at timestamptz,
  wait_deadline timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mailbox_id, calendar_event_id)
);

create table followups (
  id uuid primary key default gen_random_uuid(),
  sent_id uuid not null references sent(id) on delete cascade,
  business_days_waited integer not null default 0,
  nudge_reasoning text,
  status text not null default 'pending' check (status in ('pending', 'dismissed', 'sent')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table cron_runs (
  id uuid primary key default gen_random_uuid(),
  job_name text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text check (status in ('running', 'ok', 'error')),
  detail jsonb
);

-- RLS is enabled with no policies (default-deny) on every table. The app only
-- ever talks to Supabase through the service-role key from trusted server
-- code (API routes / cron handlers), which bypasses RLS by design — this is
-- defense-in-depth in case the anon key is ever exposed to the client.
alter table mailboxes enable row level security;
alter table threads enable row level security;
alter table drafts enable row level security;
alter table sent enable row level security;
alter table meetings enable row level security;
alter table followups enable row level security;
alter table cron_runs enable row level security;
