-- Encrypted admin vault. Credential encryption takes place in the browser.
create schema if not exists private;
create table if not exists private.admin_role_grants (email text primary key);
revoke all on schema private from public, anon, authenticated;
revoke all on private.admin_role_grants from public, anon, authenticated;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''),
    case when exists (select 1 from private.admin_role_grants where email = lower(new.email)) then 'admin' else 'user' end)
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;
drop policy if exists profile_self_read on public.profiles;
create policy profile_self_read on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists profile_self_update on public.profiles;
create policy profile_self_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create table if not exists public.admin_vault_settings (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  salt text not null check (length(salt) <= 100),
  verifier jsonb not null,
  created_at timestamptz not null default now()
);
create table if not exists public.admin_vault_entries (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(title) between 1 and 150),
  provider text not null default '' check (length(provider) <= 100),
  category text not null check (category in ('login', 'api_key', 'note')),
  payload jsonb not null check (length(payload::text) <= 80000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists admin_vault_owner_updated on public.admin_vault_entries(owner_id, updated_at desc, id);
alter table public.admin_vault_settings enable row level security;
alter table public.admin_vault_entries enable row level security;
revoke all on public.admin_vault_settings, public.admin_vault_entries from anon;
grant select, insert, update, delete on public.admin_vault_settings, public.admin_vault_entries to authenticated;
drop policy if exists admin_vault_settings_owner on public.admin_vault_settings;
create policy admin_vault_settings_owner on public.admin_vault_settings for all to authenticated
  using (owner_id = auth.uid() and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (owner_id = auth.uid() and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
drop policy if exists admin_vault_entries_owner on public.admin_vault_entries;
create policy admin_vault_entries_owner on public.admin_vault_entries for all to authenticated
  using (owner_id = auth.uid() and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (owner_id = auth.uid() and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
-- Approved owner emails are provisioned through a trusted server connection,
-- never accepted from a public signup form or client-controlled metadata.