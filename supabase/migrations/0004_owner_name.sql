-- Captures the account owner's own display name (from Google profile at
-- sign-in) so scans can recognize "this sender is literally me" — e.g. a
-- note sent from a personal account to a work account — and exclude it from
-- needs-reply/low-confidence, the same way automated/promotional senders are.
alter table app_settings
  add column owner_name text;
