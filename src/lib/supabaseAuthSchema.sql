-- ============================================================
-- Strategic Minds AI — Supabase AUTH schema
-- Run AFTER schema.sql. Creates the profiles table and an
-- auto-create trigger so every Supabase Auth signup gets a
-- role row automatically.
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'user' check (role in ('admin','user')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- updated_at trigger (reuses set_updated_at from schema.sql)
drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at
  before update on public.profiles
  for each row execute function set_updated_at();

-- Auto-create a profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''), 'user')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- To promote a user to admin:
-- update public.profiles set role = 'admin' where email = 'you@example.com';