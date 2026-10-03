-- ============================================================
-- Strategic Minds AI — Supabase schema migration
-- Migrates all Base44 entities off Base44 into Supabase.
-- Auth stays on Base44; this schema uses the service-role key
-- (RLS disabled / bypassed) — the Railway service enforces
-- admin checks itself via the Base44 auth bridge.
-- ============================================================

-- Extension for gen_random_uuid()
create extension if not exists "pgcrypto";

-- Common audit columns helper
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================
-- DIAGNOSTIC SUBSYSTEM
-- ============================================================

create table if not exists business_audits (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  audit_id text unique not null,
  company_name text not null,
  company_url text not null,
  audit_type text not null default 'full' check (audit_type in ('full','seo','security','revenue','technical','ux')),
  scope text,
  status text not null default 'scoping' check (status in ('scoping','collecting','analyzing','reported','failed')),
  health_score numeric default 0,
  finding_count numeric default 0,
  critical_count numeric default 0,
  high_count numeric default 0,
  leak_count numeric default 0,
  annual_leak_min numeric default 0,
  annual_leak_max numeric default 0,
  evidence_summary text,
  report_markdown text,
  started_at timestamptz,
  completed_at timestamptz,
  duration_ms numeric default 0
);
create trigger set_updated_at business_audits before update on business_audits for each row execute function set_updated_at();
create index if not exists idx_business_audits_audit_id on business_audits(audit_id);
create index if not exists idx_business_audits_created on business_audits(created_at desc);

create table if not exists audit_findings (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  finding_id text unique not null,
  audit_id text not null,
  title text not null,
  description text,
  category text not null check (category in ('seo','security','performance','revenue','technical','ux','content','infrastructure','compliance','conversion')),
  severity text not null default 'medium' check (severity in ('critical','high','medium','low')),
  evidence_state text default 'verified' check (evidence_state in ('verified','supported_inference','needs_review')),
  confidence numeric default 80,
  business_impact text,
  recommended_repair text,
  evidence_ref text,
  approval_status text default 'pending' check (approval_status in ('pending','approved','disputed','rejected')),
  annual_impact_min numeric default 0,
  annual_impact_max numeric default 0,
  metric_value text,
  metric_target text
);
create trigger set_updated_at audit_findings before update on audit_findings for each row execute function set_updated_at();
create index if not exists idx_audit_findings_audit on audit_findings(audit_id);
create index if not exists idx_audit_findings_severity on audit_findings(severity);

create table if not exists evidence (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  evidence_id text unique not null,
  audit_id text not null,
  finding_id text,
  source_type text not null check (source_type in ('http_response','html_content','header_check','ssl_certificate','robots_txt','sitemap_xml','sensitive_path','broken_link','tech_stack','page_structure')),
  source_uri text not null,
  captured_at timestamptz not null,
  content_summary text,
  content_hash text,
  raw_snippet text,
  status_code numeric
);
create index if not exists idx_evidence_audit on evidence(audit_id);

create table if not exists revenue_leaks (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  leak_id text unique not null,
  audit_id text not null,
  finding_id text,
  category text not null check (category in ('conversion_loss','seo_traffic_loss','security_breach_risk','performance_penalty','trust_deficit','mobile_gap','content_gap','infrastructure_cost','compliance_fine_risk')),
  description text,
  annual_impact_min numeric default 0,
  annual_impact_max numeric default 0,
  confidence numeric default 80,
  recovery_potential text default 'partial' check (recovery_potential in ('full','partial','minimal')),
  status text default 'identified' check (status in ('identified','quantified','approved','recovering','recovered'))
);
create index if not exists idx_revenue_leaks_audit on revenue_leaks(audit_id);

create table if not exists scan_snapshots (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  snapshot_id text unique not null,
  audit_id text not null,
  company_url text,
  health_score numeric default 0,
  finding_count numeric default 0,
  critical_count numeric default 0,
  high_count numeric default 0,
  leak_count numeric default 0,
  annual_leak_min numeric default 0,
  annual_leak_max numeric default 0,
  tech_stack text,
  scanned_at timestamptz not null,
  scan_type text default 'full' check (scan_type in ('full','security','seo','performance','monitoring'))
);
create index if not exists idx_scan_snapshots_audit on scan_snapshots(audit_id);

create table if not exists audit_receipts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  receipt_id text unique not null,
  audit_id text,
  system text not null,
  action text not null,
  status text default 'success' check (status in ('success','failed','partial','rolled_back')),
  summary text not null,
  evidence text,
  rollback text,
  performed_by text,
  created_at_ts timestamptz
);

create table if not exists system_nodes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  node_id text unique not null,
  audit_id text not null,
  node_type text not null check (node_type in ('website','crm','email_marketing','analytics','payment','hosting','cdn','cms','framework','social','advertising','support','booking','forms','other')),
  name text not null,
  detected_from text,
  health_status text default 'unknown' check (health_status in ('healthy','warning','critical','unknown')),
  owner_role text,
  risk_count numeric default 0
);
create index if not exists idx_system_nodes_audit on system_nodes(audit_id);

create table if not exists system_edges (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  edge_id text unique not null,
  audit_id text not null,
  source_node_id text not null,
  target_node_id text not null,
  relationship text not null check (relationship in ('depends_on','integrates_with','feeds_data_to','shares_users_with','hosts','protected_by','monitored_by')),
  risk_status text default 'unknown' check (risk_status in ('secure','warning','critical','unknown')),
  description text
);
create index if not exists idx_system_edges_audit on system_edges(audit_id);

create table if not exists repair_plans (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  plan_id text unique not null,
  audit_id text not null,
  title text not null,
  horizon_days numeric default 90,
  status text default 'draft' check (status in ('draft','approved','in_progress','completed','failed')),
  total_actions numeric default 0,
  completed_actions numeric default 0,
  progress_percentage numeric default 0,
  estimated_revenue_recovery numeric default 0,
  phase_30 text,
  phase_60 text,
  phase_90 text,
  created_at_ts timestamptz,
  approved_at timestamptz
);
create index if not exists idx_repair_plans_audit on repair_plans(audit_id);

create table if not exists repair_action_items (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  action_id text unique not null,
  plan_id text not null,
  finding_id text,
  title text not null,
  description text,
  phase numeric default 30 check (phase in (30,60,90)),
  priority numeric default 5,
  owner_role text,
  effort_estimate text default 'medium' check (effort_estimate in ('low','medium','high')),
  target_day numeric,
  success_metric text,
  status text default 'pending' check (status in ('pending','in_progress','completed','blocked','cancelled')),
  validation_result text,
  started_at timestamptz,
  completed_at timestamptz
);
create index if not exists idx_repair_actions_plan on repair_action_items(plan_id);

create table if not exists risk_register (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  risk_id text unique not null,
  audit_id text,
  finding_id text,
  title text not null,
  description text,
  category text not null check (category in ('security','financial','operational','compliance','reputation','technical','strategic')),
  likelihood numeric default 3,
  impact numeric default 3,
  risk_score numeric,
  controls text,
  mitigation_plan text,
  status text default 'identified' check (status in ('identified','assessed','mitigating','accepted','resolved')),
  owner_role text
);

create table if not exists outreach_drafts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  draft_id text unique not null,
  audit_id text,
  company_name text not null,
  company_url text,
  contact_name text,
  contact_email text,
  subject text not null,
  body text,
  evidence_refs text,
  value_summary text,
  approval_status text default 'draft' check (approval_status in ('draft','pending_review','approved','rejected')),
  send_status text default 'draft_only' check (send_status in ('draft_only','approved_for_send','sent','failed')),
  approved_by text,
  approved_at timestamptz,
  sent_at timestamptz
);

create table if not exists monitoring_rules (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  rule_id text unique not null,
  audit_id text,
  name text not null,
  rule_type text not null check (rule_type in ('uptime','ssl','seo_ranking','page_speed','security','revenue_metric','content_change','broken_link')),
  configuration text,
  check_url text,
  threshold text,
  cadence_seconds numeric default 300,
  active boolean default true,
  last_checked_at timestamptz,
  last_status text default 'unknown' check (last_status in ('pass','fail','warn','unknown'))
);

create table if not exists monitoring_events (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  event_id text unique not null,
  rule_id text not null,
  audit_id text,
  event_type text not null check (event_type in ('alert','recovery','info','warning','critical')),
  severity text default 'info' check (severity in ('info','warning','critical')),
  message text,
  metric_value text,
  threshold_value text,
  payload text,
  acknowledged boolean default false,
  detected_at timestamptz
);

-- ============================================================
-- CLONE SUBSYSTEM
-- ============================================================

create table if not exists clone_queue (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  target_url text not null,
  site_name text,
  industry text,
  priority text default 'medium' check (priority in ('critical','high','medium','low')),
  status text not null default 'queued' check (status in ('queued','cloning','validating','passed','failed','cancelled')),
  clone_method text default 'single_page' check (clone_method in ('single_page','multi_page')),
  pages_cloned numeric default 0,
  images_rehosted numeric default 0,
  images_total numeric default 0,
  css_inlined numeric default 0,
  links_rewritten numeric default 0,
  parity_score numeric default 0,
  brand_name text,
  brand_phone text,
  brand_email text,
  vercel_url text,
  audit_id text,
  source text default 'manual' check (source in ('manual','diagnostic','discovery')),
  error text,
  notes text
);
create index if not exists idx_clone_queue_status on clone_queue(status);
create index if not exists idx_clone_queue_created on clone_queue(created_at desc);

-- ============================================================
-- FACTORY SUBSYSTEM
-- ============================================================

create table if not exists factory_projects (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  name text not null,
  description text,
  status text default 'planning',
  config text
);

create table if not exists generator_runs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  run_id text unique not null,
  project_id text,
  generator_key text not null,
  generator_version text,
  status text default 'draft' check (status in ('DRAFT','RUNNING','PASSED','FAILED','BLOCKED','CANCELLED','EXPORTED')),
  started_at timestamptz,
  completed_at timestamptz,
  step_count numeric default 0,
  artifact_count numeric default 0,
  error text
);
create index if not exists idx_generator_runs_project on generator_runs(project_id);

create table if not exists run_steps (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  run_id text not null,
  step_key text not null,
  step_type text,
  status text default 'pending' check (status in ('pending','running','passed','failed','skipped','blocked')),
  started_at timestamptz,
  completed_at timestamptz,
  input text,
  output text,
  error text
);
create index if not exists idx_run_steps_run on run_steps(run_id);

create table if not exists factory_artifacts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  run_id text not null,
  step_key text,
  artifact_type text not null,
  path text,
  content text,
  validation_status text default 'pending' check (validation_status in ('pending','passed','failed'))
);
create index if not exists idx_factory_artifacts_run on factory_artifacts(run_id);

create table if not exists validation_receipts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  run_id text not null,
  step_key text,
  layer text not null,
  result text default 'pending' check (result in ('pending','passed','failed','blocked')),
  evidence text,
  created_at_ts timestamptz
);

create table if not exists repair_tasks (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  repair_id text unique not null,
  run_id text not null,
  validation_receipt_id text,
  target_step_key text,
  failing_validator text,
  failure_layer text check (failure_layer in ('schema','completeness','lint','typecheck','compile','unit_tests','integration_tests','e2e','visual_regression','accessibility','security_scan','dependency_scan','secret_scan','data_integrity','rls','backend_parity','artifact_integrity','acceptance_criteria')),
  status text default 'open' check (status in ('open','in_progress','completed','failed','cancelled')),
  repair_spec text,
  patch_applied text,
  rerun_result text default 'pending' check (rerun_result in ('pending','passed','failed','blocked')),
  regression_status text default 'pending' check (regression_status in ('pending','passed','failed')),
  repair_round numeric default 1,
  started_at timestamptz,
  completed_at timestamptz
);

create table if not exists factory_approvals (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  approval_id text unique not null,
  run_id text not null,
  step_key text,
  action_key text not null,
  risk_class text not null check (risk_class in ('READ','DRAFT','BRANCH_WRITE','PROTECTED')),
  status text default 'pending' check (status in ('pending','approved','rejected','expired','cancelled')),
  request text,
  reason text,
  resolved_by text,
  resolved_at timestamptz,
  resolution_note text,
  expires_at timestamptz
);

create table if not exists provisioning_plans (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  plan_id text unique not null,
  project_id text,
  template_id text,
  name text not null,
  desired_state text,
  current_state text,
  diff text,
  actions text,
  risk_summary text,
  credential_requirements text[] default '{}',
  rollback text,
  status text default 'draft' check (status in ('draft','awaiting_approval','approved','executing','completed','failed','rolled_back')),
  approval_id text,
  execution_receipt text
);

create table if not exists provisioned_sites (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  project_name text not null,
  slug text not null,
  template_id text,
  build_spec_id text,
  site_type text default 'static_html' check (site_type in ('static_html','vite_react')),
  needs_backend boolean default false,
  supabase_region text default 'us-east-1',
  supabase_plan text default 'free',
  status text default 'pending',
  progress_step text,
  github_repo text,
  github_url text,
  github_default_branch text,
  vercel_project_id text,
  vercel_url text,
  vercel_deployment_url text,
  supabase_project_id text,
  supabase_url text,
  deployment_url text,
  error text,
  provisioned_at timestamptz,
  deployed_at timestamptz
);
create index if not exists idx_provisioned_sites_status on provisioned_sites(status);

create table if not exists template_assets (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  name text not null,
  source_url text,
  template_type text,
  raw_content text,
  parsed_content text,
  status text default 'ingested'
);

-- ============================================================
-- SANDBOX / AGENT SUBSYSTEM
-- ============================================================

create table if not exists sandboxes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  name text not null,
  environment text default 'local' check (environment in ('local','railway')),
  status text default 'creating' check (status in ('creating','active','paused','error','deleted')),
  railway_environment_id text,
  railway_project_id text,
  config text,
  url text,
  agent_name text,
  description text,
  api_key_hash text,
  key_prefix text,
  last_heartbeat_at timestamptz,
  health_status text default 'unknown' check (health_status in ('healthy','degraded','offline','unknown')),
  current_task_id text,
  cycles_completed numeric default 0,
  last_error text
);

create table if not exists agent_tasks (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  agent_name text not null,
  task_type text,
  title text not null,
  description text,
  priority text default 'medium' check (priority in ('urgent','high','medium','low')),
  autonomous boolean default false,
  status text default 'pending' check (status in ('pending','in_progress','needs_approval','completed','failed')),
  domain text,
  result text,
  claim_token text,
  claimed_by_sandbox_id text,
  lease_expires_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz
);
create index if not exists idx_agent_tasks_status on agent_tasks(status);

-- ============================================================
-- COMMERCE / CATALOG
-- ============================================================

create table if not exists catalog_items (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  title text not null,
  description text,
  kind text not null check (kind in ('one_time','subscription','quote')),
  category text check (category in ('strategy','automation','knowledge','data','marketing','search','crm','websites','software','training','governance','managed')),
  price_cents numeric,
  currency text default 'usd',
  interval text check (interval in ('month','year')),
  active boolean default true
);

create table if not exists catalog_quotes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  catalog_item_id text not null,
  item_title text,
  name text not null,
  email text not null,
  message text not null,
  description text,
  status text default 'new' check (status in ('new','reviewed'))
);

create table if not exists commerce_orders (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  catalog_item_id text not null,
  item_title text,
  project_id text,
  client_id text,
  customer_email text not null,
  customer_name text,
  amount_cents numeric not null,
  currency text not null,
  status text not null check (status in ('pending_payment','paid_awaiting_approval','approved','expired')),
  checkout_session_id text,
  stripe_subscription_id text,
  description text
);

-- ============================================================
-- CLIENT INFRASTRUCTURE
-- ============================================================

create table if not exists client_infrastructure (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  name text not null,
  client_id text not null,
  capabilities text[] default '{}',
  description text,
  github_repo text,
  github_url text,
  vercel_id text,
  vercel_url text,
  railway_id text,
  railway_url text,
  railway_service_id text,
  supabase_ref text,
  supabase_organization text
);

create table if not exists customer_sites (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  name text not null,
  client_id text not null,
  supabase_ref text not null,
  supabase_organization text not null,
  description text
);

create table if not exists client_projects (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  title text not null,
  client_id text not null,
  description text,
  status text default 'Planning' check (status in ('Planning','In progress','Review','Complete')),
  progress_note text
);

create table if not exists project_requests (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  project_id text not null,
  client_id text not null,
  message text not null,
  reply text,
  description text,
  status text default 'Open' check (status in ('Open','Resolved'))
);

-- ============================================================
-- CRM / LEADS
-- ============================================================

create table if not exists leads (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  name text,
  email text,
  phone text,
  website text,
  service text,
  message text,
  query text,
  form_type text not null check (form_type in ('contact','quotation','newsletter','newsletter_v2','pricing','search')),
  description text,
  plan_title text
);

create table if not exists crm_contacts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  name text not null,
  email text not null,
  phone text,
  status text default 'new' check (status in ('new','contacted','qualified','closed')),
  source text,
  source_id text,
  notes text,
  follow_up_status text default 'paused' check (follow_up_status in ('paused','scheduled','sending','sent','failed')),
  follow_up_at timestamptz,
  follow_up_subject text,
  follow_up_body text,
  last_sent_at timestamptz,
  calendar_event_id text,
  google_resource_name text
);

-- ============================================================
-- CONTENT (posts / projects / testimonials)
-- ============================================================

create table if not exists posts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  title text not null,
  slug text not null unique,
  excerpt text,
  content_markdown text,
  image_url text,
  image_alt text,
  categories text,
  author_name text,
  author_image_url text,
  publish_date timestamptz not null,
  display_order numeric default 0
);

create table if not exists projects (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  title text not null,
  slug text not null unique,
  excerpt text,
  content_markdown text,
  image_url text,
  image_alt text,
  categories text,
  publish_date timestamptz not null,
  display_order numeric default 0,
  metric_1_label text, metric_1_value text,
  metric_2_label text, metric_2_value text,
  metric_3_label text, metric_3_value text
);

create table if not exists testimonials (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  name text not null,
  company text not null,
  comment text not null,
  image_url text not null,
  rating numeric not null,
  variant text not null check (variant in ('default','featured','layout_2')),
  description text,
  display_order numeric default 0
);

-- ============================================================
-- VAULT
-- ============================================================

create table if not exists vault_accounts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  name text not null,
  provider text not null check (provider in ('github','github_app','supabase','drive','railway','vercel','e2b','private_sandbox','other')),
  connector_id text,
  management_url text
);

create table if not exists vault_access_keys (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  owner_id text not null,
  label text not null,
  token_hash text not null,
  prefix text not null,
  scope text not null check (scope in ('directory:read')),
  expires_at timestamptz not null,
  revoked boolean default false
);

-- ============================================================
-- ADMIN CHAT
-- ============================================================

create table if not exists admin_conversations (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  owner_id text not null,
  chat_key text not null,
  title text not null,
  archived boolean default false,
  last_activity timestamptz not null
);

create table if not exists admin_chat_turns (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  owner_id text not null,
  chat_key text not null,
  turn_key text not null,
  user_message jsonb,
  assistant_message jsonb,
  status text default 'pending' check (status in ('pending','complete','failed')),
  error text
);

-- ============================================================
-- BENCHMARK
-- ============================================================

create table if not exists benchmark_runs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  owner_id text not null,
  revision text not null,
  run_nonce text not null,
  observed_at timestamptz not null,
  observations jsonb not null,
  signature text not null
);

create table if not exists benchmark_checkpoints (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  owner_id text not null,
  request_id text not null,
  revision text not null,
  summary text not null,
  implemented text[] default '{}',
  verification text[] default '{}',
  blockers text[] default '{}',
  next_batch text not null,
  work_items jsonb not null,
  score_snapshot jsonb not null
);

-- ============================================================
-- DOMINANCE / DOMAINS
-- ============================================================

create table if not exists domains (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  name text not null,
  status text default 'onboarding',
  config text
);

create table if not exists domain_metrics (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  domain_id text not null,
  metric_key text,
  metric_value numeric,
  captured_at timestamptz
);

create table if not exists dominance_goals (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  name text not null,
  domain text,
  config text,
  status text default 'active'
);

create table if not exists dominance_campaigns (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  goal_id text not null,
  name text not null,
  status text default 'draft',
  config text
);

-- ============================================================
-- INSIDER CONTENT
-- ============================================================

create table if not exists insider_content (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  title text not null,
  body text,
  category text,
  published_at timestamptz,
  status text default 'draft'
);

-- ============================================================
-- ENHANCEMENT JOBS
-- ============================================================

create table if not exists enhancement_jobs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  owner_id text not null,
  criterion_id text not null,
  route text not null check (route in ('builder','admin','worker')),
  request_id text not null,
  revision text not null,
  status text not null check (status in ('brief_ready','planning','plan_ready','plan_failed')),
  plan text,
  plan_started_at timestamptz,
  error text
);

-- ============================================================
-- OPERATOR SUBSYSTEM + AGENT KEY STORE
-- ============================================================

alter table domains add column if not exists health_score numeric default 0;

create table if not exists agent_secret (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  name text unique not null,
  encrypted_value text not null,
  description text,
  category text default 'api_key',
  last_used timestamptz,
  used_count numeric default 0
);
drop trigger if exists set_updated_at_agent_secret on agent_secret;
create trigger set_updated_at_agent_secret before update on agent_secret for each row execute function set_updated_at();

create table if not exists operator_device (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  name text not null,
  token_hash text,
  expires_at timestamptz,
  enabled boolean default true,
  revoked boolean default false,
  last_seen timestamptz,
  platform text,
  input_allowed boolean default false,
  browser_configured boolean default false
);
drop trigger if exists set_updated_at_operator_device on operator_device;
create trigger set_updated_at_operator_device before update on operator_device for each row execute function set_updated_at();

create table if not exists operator_task (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  title text not null,
  instructions text,
  target text default 'cloud_browser',
  status text default 'queued',
  result text,
  source text default 'manual',
  schedule_id text,
  schedule_slot text,
  account_id text
);
drop trigger if exists set_updated_at_operator_task on operator_task;
create trigger set_updated_at_operator_task before update on operator_task for each row execute function set_updated_at();

-- Done. Run this in your Supabase SQL editor.