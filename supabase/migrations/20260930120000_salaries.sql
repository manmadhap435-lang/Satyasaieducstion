-- ==============================================================================
-- Migration: Add Staff Salaries Table for Satya Sai Educational Society
-- File: supabase/migrations/20260930120000_salaries.sql
-- ==============================================================================

create table if not exists public.salaries (
  id uuid default gen_random_uuid() primary key,
  staff_name text not null,
  designation text not null,
  email text not null,
  salary_amount numeric not null,
  salary_month text not null,
  payment_mode text default 'Bank Transfer' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for speedy monthly lookups
create index if not exists idx_salaries_created_at on public.salaries (created_at desc);
create index if not exists idx_salaries_month on public.salaries (salary_month);

-- Enable Row Level Security (RLS)
alter table public.salaries enable row level security;

-- Policies for public / anonymous client access (Idempotent: drops if already exists)
drop policy if exists "Allow anon select on salaries" on public.salaries;
create policy "Allow anon select on salaries"
  on public.salaries
  for select
  using (true);

drop policy if exists "Allow anon insert on salaries" on public.salaries;
create policy "Allow anon insert on salaries"
  on public.salaries
  for insert
  with check (true);

drop policy if exists "Allow anon update on salaries" on public.salaries;
create policy "Allow anon update on salaries"
  on public.salaries
  for update
  using (true);

drop policy if exists "Allow anon delete on salaries" on public.salaries;
create policy "Allow anon delete on salaries"
  on public.salaries
  for delete
  using (true);
