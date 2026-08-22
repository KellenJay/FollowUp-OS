-- Permanent audit trail for AI calls, independent of any observability
-- vendor's rolling retention window (Vercel Hobby: 1 hour, Pro: 1 day,
-- Observability Plus: 30 days -- none of them keep data forever). This
-- table is the source of truth for what the AI did and when, queryable
-- anytime with plain SQL rather than a vendor's log search UI.
create table ai_call_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id) on delete cascade,
  decision_point text not null,
  model text not null,
  latency_ms integer not null,
  prompt_tokens integer,
  completion_tokens integer,
  total_tokens integer,
  created_at timestamptz not null default now()
);

create index ai_call_logs_owner_id_created_at_idx on ai_call_logs (owner_id, created_at desc);

alter table ai_call_logs enable row level security;
