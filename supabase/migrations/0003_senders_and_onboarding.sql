-- Per-sender importance tracking, feeding the onboarding VIP tick-list and
-- ongoing classification (scan.ts skips "excluded" senders entirely and
-- bypasses the low-confidence first-contact heuristic for "vip" ones).

create table senders (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,
  address text not null,
  name text,
  importance text not null default 'normal' check (importance in ('vip', 'normal', 'excluded')),
  source text not null default 'default' check (source in ('onboarding', 'manual', 'default')),
  message_count integer not null default 0,
  mutual_count integer not null default 0,
  last_contact_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, address)
);

alter table senders enable row level security;

-- Single-tenant app-wide settings — currently just tracks whether the
-- one-time onboarding flow has been completed.
create table app_settings (
  owner_id text primary key,
  onboarding_completed_at timestamptz
);

alter table app_settings enable row level security;
