-- Foundation for real multi-tenancy (see the "multi-tenant foundation" plan,
-- 2026-08-02): every table today is scoped by a hardcoded owner_id='ellen'
-- string, not a real signed-in identity. This is the first of two migrations
-- that fix that — this one adds the users table and backfills Ellen's
-- existing account into it; 0011 converts the owner_id columns to reference
-- it for real.
--
-- Identity is resolved by email, not by (provider, providerAccountId): a
-- Google sign-in and a future email/password signup with the same address
-- are meant to converge on one row rather than create two unrelated
-- accounts, without building full multi-provider account-linking (out of
-- scope for this phase). password_hash is null for Google-only accounts.
create table users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text,
  password_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index users_email_key on users (lower(email));

alter table users enable row level security;

-- Backfill Ellen's existing account. Her sign-in identity and her mailbox
-- address are the same thing today (there's only ever been the one Google
-- OAuth flow, doing double duty as both sign-in and mailbox-connect), so the
-- oldest mailbox row under the legacy owner_id is her real email.
insert into users (email, name)
select m.address, s.owner_name
from mailboxes m
left join app_settings s on s.owner_id = m.owner_id
where m.owner_id = 'ellen'
order by m.created_at asc
limit 1;
