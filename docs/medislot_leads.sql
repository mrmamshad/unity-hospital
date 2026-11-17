-- Run in the Supabase SQL editor to persist landing callback requests in Postgres.
-- Until this exists, /api/leads falls back to .data/leads.ndjson.

create table if not exists public.medislot_leads (
  id bigint generated always as identity primary key,
  name text not null,
  phone text not null,
  department text not null default 'General Medicine',
  preferred_day text not null default 'Any day',
  note text,
  created_at timestamptz not null default now()
);

alter table public.medislot_leads enable row level security;

-- Public form: insert only. No anon reads.
create policy "landing can insert leads"
  on public.medislot_leads
  for insert
  to anon
  with check (true);
