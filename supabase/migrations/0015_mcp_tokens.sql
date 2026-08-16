-- Real backend for Settings' "Generate token" (previously a stub with no
-- storage at all). One active token per user, matching the single-field
-- Settings UI — regenerating replaces it via upsert on owner_id.
--
-- token_hash is a plain SHA-256 of the token, not scrypt/bcrypt: the token
-- is a 256-bit random secret (high entropy), not a user-chosen password
-- (low entropy) — so it needs a fast, deterministic, directly-lookupable
-- hash (same approach GitHub/Stripe-style API keys use), not the
-- deliberately-slow salted hashing lib/password.ts uses for passwords.
create table mcp_tokens (
  owner_id uuid primary key references users(id) on delete cascade,
  token_hash text not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);
