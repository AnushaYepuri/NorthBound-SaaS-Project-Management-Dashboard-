-- ============================================
-- Northbound Dashboard — Supabase setup
-- ============================================
-- Run this in: Supabase Dashboard → SQL Editor → New query → paste → Run

-- 1. A "profiles" table to store each user's role.
--    Linked 1-to-1 with Supabase's built-in auth.users table.
create table if not exists profiles (
  id uuid references auth.users(id) primary key,
  name text,
  role text not null default 'member' check (role in ('admin', 'member'))
);

alter table profiles enable row level security;

-- A signed-in user can read only their own profile (to check their own role)
create policy "Users can read own profile"
  on profiles for select
  using (auth.uid() = id);

-- 2. A "projects" table — the data your dashboard table displays
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner text,
  category text,
  status text not null default 'track' check (status in ('ahead', 'track', 'risk')),
  progress int not null default 0 check (progress between 0 and 100),
  created_at timestamptz default now()
);

alter table projects enable row level security;

-- Only users whose profile has role = 'admin' can read project data
create policy "Admins can read projects"
  on projects for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Only admins can insert/update/delete projects
create policy "Admins can write projects"
  on projects for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- 3. Sample project rows so you have something to see immediately.
--    Feel free to edit/delete these from Table Editor afterward.
insert into projects (name, owner, category, status, progress) values
  ('Lighthouse redesign', 'Aria S.', 'Marketing site', 'ahead', 82),
  ('Orbit mobile app', 'Malik T.', 'iOS / Android', 'track', 58),
  ('Billing migration', 'Priya N.', 'Internal tooling', 'risk', 34),
  ('Design system v2', 'Aria S.', 'Component library', 'ahead', 91);

-- ============================================
-- After running this file:
-- 1. Go to Authentication → Users → Add user (create your admin login)
-- 2. Copy that user's UID
-- 3. Go to Table Editor → profiles → Insert row
--    - id: paste the UID
--    - name: your name
--    - role: admin
-- ============================================
