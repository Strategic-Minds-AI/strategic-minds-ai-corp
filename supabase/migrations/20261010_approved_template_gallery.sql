-- STAGING-FIRST ONLY. Do not apply to production without scoped approval.
-- Matches TemplateGallery.entity schema and existing admin-only Supabase role.
create table if not exists public.template_gallery (
  id uuid primary key default gen_random_uuid(),
  gallery_id text not null,
  gallery_name text not null,
  title text not null,
  category text default 'general',
  city text default '',
  description text default '',
  html_content text not null,
  css_content text default '',
  js_content text default '',
  preview_url text,
  thumbnail_url text,
  upload_source text default 'gpt',
  gpt_thread_id text,
  design_style text,
  color_scheme text,
  is_featured boolean default false,
  quality_score numeric default 0,
  status text not null default 'draft',
  tags jsonb not null default '[]'::jsonb,
  brand_tokens jsonb not null default '{}'::jsonb,
  manifest jsonb not null default '{}'::jsonb,
  version text default '1.0.0',
  content_sha256 text,
  batch_id text,
  approval_receipt jsonb,
  created_by_id uuid,
  created_by text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
alter table public.template_gallery add column if not exists brand_tokens jsonb default '{}'::jsonb;
alter table public.template_gallery add column if not exists manifest jsonb default '{}'::jsonb;
alter table public.template_gallery add column if not exists version text default '1.0.0';
alter table public.template_gallery add column if not exists content_sha256 text;
alter table public.template_gallery add column if not exists batch_id text;
alter table public.template_gallery add column if not exists approval_receipt jsonb;
alter table public.template_gallery enable row level security;
create unique index if not exists template_gallery_content_unique
  on public.template_gallery (gallery_id, content_sha256) where content_sha256 is not null;
create index if not exists template_gallery_gallery_recent
  on public.template_gallery (gallery_id, created_date desc);
grant select, insert, update, delete on public.template_gallery to authenticated, service_role;
do $policies$
begin
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='template_gallery' and policyname='studio_admin_select') then
    create policy studio_admin_select on public.template_gallery
      for select to authenticated using (public.runtime_user_role() = 'admin');
  end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='template_gallery' and policyname='studio_admin_insert') then
    create policy studio_admin_insert on public.template_gallery
      for insert to authenticated with check (public.runtime_user_role() = 'admin');
  end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='template_gallery' and policyname='studio_admin_update') then
    create policy studio_admin_update on public.template_gallery
      for update to authenticated using (public.runtime_user_role() = 'admin')
      with check (public.runtime_user_role() = 'admin');
  end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='template_gallery' and policyname='studio_admin_delete') then
    create policy studio_admin_delete on public.template_gallery
      for delete to authenticated using (public.runtime_user_role() = 'admin');
  end if;
end
$policies$;
