-- ==============================================================================
-- Migration: Fix Permissions and RLS for Admission Enquiries
-- File: supabase/migrations/20260930140000_admission_enquiries_permissions.sql
-- ==============================================================================

-- 1. Ensure table exists with all standard columns
create table if not exists public.admission_enquiries (
  id uuid default gen_random_uuid() primary key,
  student_name text not null,
  location text not null,
  phone text not null,
  class_of_admission text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Indexes for fast sorting and searching
create index if not exists idx_admission_enquiries_created_at on public.admission_enquiries (created_at desc);
create index if not exists idx_admission_enquiries_class on public.admission_enquiries (class_of_admission);

-- 3. Ensure Table Permissions for anon and service_role
grant all on public.admission_enquiries to postgres;
grant all on public.admission_enquiries to service_role;
grant select, insert, update, delete on public.admission_enquiries to anon;
grant select, insert, update, delete on public.admission_enquiries to authenticated;

-- 4. Enable Row Level Security (RLS)
alter table public.admission_enquiries enable row level security;

-- 5. Drop old policies if they exist (idempotent)
drop policy if exists "Anyone can submit an enquiry" on public.admission_enquiries;
drop policy if exists "Allow anon select on admission_enquiries" on public.admission_enquiries;
drop policy if exists "Allow anon insert on admission_enquiries" on public.admission_enquiries;
drop policy if exists "Allow anon update on admission_enquiries" on public.admission_enquiries;
drop policy if exists "Allow anon delete on admission_enquiries" on public.admission_enquiries;
drop policy if exists "Allow all operations on admission_enquiries" on public.admission_enquiries;

-- 6. Create permissive policies for frontend admin & admissions form
create policy "Allow anon select on admission_enquiries"
  on public.admission_enquiries
  for select
  using (true);

create policy "Allow anon insert on admission_enquiries"
  on public.admission_enquiries
  for insert
  with check (true);

create policy "Allow anon update on admission_enquiries"
  on public.admission_enquiries
  for update
  using (true);

create policy "Allow anon delete on admission_enquiries"
  on public.admission_enquiries
  for delete
  using (true);

-- 7. Add to Realtime publication so dashboard updates automatically on new submissions
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables 
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'admission_enquiries'
    ) then
      alter publication supabase_realtime add table public.admission_enquiries;
    end if;
  end if;
end $$;
