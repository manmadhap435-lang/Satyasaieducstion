-- ==============================================================================
-- Migration: Students Registry, Class Fee Structures, and Multi-Term Fee Tracking
-- File: supabase/migrations/20260930150000_students_and_fee_structures.sql
-- ==============================================================================

-- 1. Class Fee Structures Table (Configures total fee & 3-term breakdown per class/group)
create table if not exists public.class_fee_structures (
  id uuid default gen_random_uuid() primary key,
  class text not null,
  group_name text default 'General' not null,
  academic_year text default '2026-2027' not null,
  total_fee numeric(10, 2) not null,
  term1_fee numeric(10, 2) default 0 not null,
  term2_fee numeric(10, 2) default 0 not null,
  term3_fee numeric(10, 2) default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint uq_class_fee_structure unique (class, group_name, academic_year)
);

-- 2. Students Registry Table (Stores Hall Ticket / Roll Number, Group, Section)
create table if not exists public.students (
  id uuid default gen_random_uuid() primary key,
  hall_ticket_no text not null unique,
  student_name text not null,
  class text not null,
  group_name text default 'General' not null,
  section text default 'A' not null,
  phone text,
  email text,
  parent_name text,
  admission_date date default current_date not null,
  academic_year text default '2026-2027' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_students_hall_ticket on public.students (hall_ticket_no);
create index if not exists idx_students_class on public.students (class);
create index if not exists idx_students_academic_year on public.students (academic_year);

-- 3. Enhance fee_collections table with Hall Ticket / Roll No and Term details
alter table public.fee_collections add column if not exists hall_ticket_no text;
alter table public.fee_collections add column if not exists term text default 'Term 1';
alter table public.fee_collections add column if not exists payment_mode text default 'Cash';
alter table public.fee_collections add column if not exists receipt_no text;
alter table public.fee_collections add column if not exists academic_year text default '2026-2027';

create index if not exists idx_fee_collections_hall_ticket on public.fee_collections (hall_ticket_no);
create index if not exists idx_fee_collections_term on public.fee_collections (term);

-- 4. Enable Row Level Security (RLS)
alter table public.class_fee_structures enable row level security;
alter table public.students enable row level security;
alter table public.fee_collections enable row level security;

-- 5. Grant Permissions to service_role, authenticated, and anon
grant all on public.class_fee_structures to postgres, service_role;
grant select, insert, update, delete on public.class_fee_structures to anon, authenticated;

grant all on public.students to postgres, service_role;
grant select, insert, update, delete on public.students to anon, authenticated;

grant all on public.fee_collections to postgres, service_role;
grant select, insert, update, delete on public.fee_collections to anon, authenticated;

-- 6. Idempotent RLS Policies for class_fee_structures
drop policy if exists "Allow anon select on class_fee_structures" on public.class_fee_structures;
create policy "Allow anon select on class_fee_structures"
  on public.class_fee_structures for select using (true);

drop policy if exists "Allow anon insert on class_fee_structures" on public.class_fee_structures;
create policy "Allow anon insert on class_fee_structures"
  on public.class_fee_structures for insert with check (true);

drop policy if exists "Allow anon update on class_fee_structures" on public.class_fee_structures;
create policy "Allow anon update on class_fee_structures"
  on public.class_fee_structures for update using (true);

drop policy if exists "Allow anon delete on class_fee_structures" on public.class_fee_structures;
create policy "Allow anon delete on class_fee_structures"
  on public.class_fee_structures for delete using (true);

-- 7. Idempotent RLS Policies for students
drop policy if exists "Allow anon select on students" on public.students;
create policy "Allow anon select on students"
  on public.students for select using (true);

drop policy if exists "Allow anon insert on students" on public.students;
create policy "Allow anon insert on students"
  on public.students for insert with check (true);

drop policy if exists "Allow anon update on students" on public.students;
create policy "Allow anon update on students"
  on public.students for update using (true);

drop policy if exists "Allow anon delete on students" on public.students;
create policy "Allow anon delete on students"
  on public.students for delete using (true);

-- 8. Ensure Realtime Publication
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'students') then
      alter publication supabase_realtime add table public.students;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'class_fee_structures') then
      alter publication supabase_realtime add table public.class_fee_structures;
    end if;
  end if;
end $$;

-- 9. Insert standard initial fee structures for Satya Sai Educational Society (if not existing)
insert into public.class_fee_structures (class, group_name, academic_year, total_fee, term1_fee, term2_fee, term3_fee)
values
  ('Nursery', 'General', '2026-2027', 15000, 5000, 5000, 5000),
  ('L.K.G', 'General', '2026-2027', 16000, 6000, 5000, 5000),
  ('U.K.G', 'General', '2026-2027', 18000, 6000, 6000, 6000),
  ('Class 1', 'General', '2026-2027', 20000, 8000, 6000, 6000),
  ('Class 2', 'General', '2026-2027', 21000, 9000, 6000, 6000),
  ('Class 3', 'General', '2026-2027', 22000, 10000, 6000, 6000),
  ('Class 4', 'General', '2026-2027', 24000, 10000, 7000, 7000),
  ('Class 5', 'General', '2026-2027', 25000, 11000, 7000, 7000),
  ('Class 6', 'General', '2026-2027', 28000, 12000, 8000, 8000),
  ('Class 7', 'General', '2026-2027', 30000, 14000, 8000, 8000),
  ('Class 8', 'General', '2026-2027', 32000, 14000, 9000, 9000),
  ('Class 9', 'General', '2026-2027', 35000, 15000, 10000, 10000),
  ('Class 10 (SSC)', 'General', '2026-2027', 40000, 18000, 11000, 11000),
  ('Intermediate — MPC', 'MPC', '2026-2027', 45000, 20000, 15000, 10000),
  ('Intermediate — BiPC', 'BiPC', '2026-2027', 45000, 20000, 15000, 10000),
  ('Intermediate — CEC', 'CEC', '2026-2027', 38000, 16000, 12000, 10000),
  ('Intermediate — HEC', 'HEC', '2026-2027', 35000, 15000, 10000, 10000),
  ('Degree — B.A.', 'B.A.', '2026-2027', 32000, 14000, 10000, 8000),
  ('Degree — B.Sc.', 'B.Sc.', '2026-2027', 42000, 18000, 14000, 10000),
  ('Degree — B.Com.', 'B.Com.', '2026-2027', 36000, 16000, 10000, 10000)
on conflict (class, group_name, academic_year) do nothing;
