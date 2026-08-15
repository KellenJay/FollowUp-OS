-- Reliable dismissal timestamp for auto-expiry (2026-08-14 feedback: ~30
-- dismissed items had piled up with no cleanup). updated_at isn't safe to
-- use for this — it changes for reasons unrelated to dismissal (rescans,
-- other field updates) — so each table gets its own explicit column, set/
-- cleared only by the dismiss/restore routes.
alter table threads add column dismissed_at timestamptz;
alter table followups add column dismissed_at timestamptz;
alter table meetings add column dismissed_at timestamptz;
