-- Second half of the multi-tenant foundation (see 0010) — converts the
-- three owner-scoped tables from a loose owner_id text column (hardcoded to
-- the literal string 'ellen' everywhere in application code today) to a
-- real foreign key against users(id). Safe to do as a single backfill+swap
-- here specifically because there is exactly one user row at this point
-- (inserted by 0010) — this gets much riskier to do casually once real
-- signups exist, which is exactly why it happens now.
--
-- BACK UP THE DATABASE BEFORE RUNNING THIS — it drops columns.

-- mailboxes
alter table mailboxes add column owner_uuid uuid;
update mailboxes set owner_uuid = (select id from users limit 1) where owner_id = 'ellen';
alter table mailboxes drop column owner_id;
alter table mailboxes rename column owner_uuid to owner_id;
alter table mailboxes alter column owner_id set not null;
alter table mailboxes add constraint mailboxes_owner_id_fkey foreign key (owner_id) references users(id) on delete cascade;
alter table mailboxes add constraint mailboxes_owner_id_address_key unique (owner_id, address);
-- Forward-compat for eventual Microsoft/Outlook mailboxes (not built this
-- phase) — added now so it isn't another backfill later.
alter table mailboxes add column provider text not null default 'google';

-- senders
alter table senders add column owner_uuid uuid;
update senders set owner_uuid = (select id from users limit 1) where owner_id = 'ellen';
alter table senders drop column owner_id;
alter table senders rename column owner_uuid to owner_id;
alter table senders alter column owner_id set not null;
alter table senders add constraint senders_owner_id_fkey foreign key (owner_id) references users(id) on delete cascade;
alter table senders add constraint senders_owner_id_address_key unique (owner_id, address);

-- app_settings (owner_id is the primary key here, not a separate id column —
-- dropping it also drops the old PK constraint; re-added below)
alter table app_settings add column owner_uuid uuid;
update app_settings set owner_uuid = (select id from users limit 1) where owner_id = 'ellen';
alter table app_settings drop column owner_id;
alter table app_settings rename column owner_uuid to owner_id;
alter table app_settings alter column owner_id set not null;
alter table app_settings add primary key (owner_id);
alter table app_settings add constraint app_settings_owner_id_fkey foreign key (owner_id) references users(id) on delete cascade;
