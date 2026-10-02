-- Strategic Minds AI — Supabase schema (generated from Base44 entity definitions)
-- Run in the Supabase SQL editor to create all tables.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (auth managed)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT DEFAULT 'user',
  full_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_read_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Admin role grant table (private — only service role can read/write)
CREATE TABLE IF NOT EXISTS admin_role_grants (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE admin_role_grants ENABLE ROW LEVEL SECURITY;

-- Auto-update updated_date on row update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_date = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- AdapterDefinition
CREATE TABLE IF NOT EXISTS adapter_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  adapter_key TEXT,
  name TEXT,
  version TEXT,
  description TEXT,
  capabilities JSONB,
  config_schema TEXT,
  actions_json TEXT,
  enabled BOOLEAN DEFAULT false,
  health_status TEXT DEFAULT 'not_configured',
  health_checked_at TIMESTAMPTZ,
  health_detail TEXT,
  secret_requirements JSONB,
  supports_rollback BOOLEAN DEFAULT false
);
ALTER TABLE adapter_definitions ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS adapter_definitions_updated_at BEFORE UPDATE ON adapter_definitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- AdminChatTurn
CREATE TABLE IF NOT EXISTS admin_chat_turns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  owner_id TEXT,
  chat_key VARCHAR(100),
  turn_key VARCHAR(100),
  user_message JSONB,
  assistant_message JSONB,
  status TEXT,
  error TEXT
);
ALTER TABLE admin_chat_turns ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS admin_chat_turns_updated_at BEFORE UPDATE ON admin_chat_turns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- AdminConversation
CREATE TABLE IF NOT EXISTS admin_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  owner_id TEXT,
  chat_key VARCHAR(100),
  title VARCHAR(120),
  archived BOOLEAN DEFAULT false,
  last_activity TIMESTAMPTZ
);
ALTER TABLE admin_conversations ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS admin_conversations_updated_at BEFORE UPDATE ON admin_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- AgentPersona
CREATE TABLE IF NOT EXISTS agent_personas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  name TEXT,
  persona_type TEXT DEFAULT 'voice',
  agent_tier TEXT DEFAULT 'standard',
  system_prompt TEXT,
  personality_traits JSONB,
  tone TEXT,
  assigned_context TEXT,
  active BOOLEAN DEFAULT true,
  avatar_color TEXT DEFAULT '#0066FF',
  playbook_id TEXT,
  assigned_number TEXT,
  target_industry TEXT,
  target_tags JSONB,
  capabilities JSONB,
  shadow_mode BOOLEAN DEFAULT false,
  swarm_id TEXT,
  swarm_role TEXT DEFAULT 'worker',
  swarm_members JSONB,
  power_level DOUBLE PRECISION DEFAULT 1,
  autonomy_level TEXT DEFAULT 'supervised',
  status TEXT DEFAULT 'draft',
  provisioned_at TIMESTAMPTZ,
  contacts_assigned DOUBLE PRECISION DEFAULT 0
);
ALTER TABLE agent_personas ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS agent_personas_updated_at BEFORE UPDATE ON agent_personas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- AgentTask
CREATE TABLE IF NOT EXISTS agent_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  agent_name TEXT,
  task_type TEXT,
  title TEXT,
  description TEXT,
  priority TEXT DEFAULT 'medium',
  autonomous BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending',
  domain TEXT,
  result TEXT,
  claim_token TEXT,
  claimed_by_sandbox_id TEXT,
  lease_expires_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS agent_tasks_updated_at BEFORE UPDATE ON agent_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- AuditFinding
CREATE TABLE IF NOT EXISTS audit_findings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  finding_id TEXT,
  audit_id TEXT,
  title TEXT,
  description TEXT,
  category TEXT,
  severity TEXT DEFAULT 'medium',
  evidence_state TEXT DEFAULT 'verified',
  confidence DOUBLE PRECISION DEFAULT 80,
  business_impact TEXT,
  recommended_repair TEXT,
  evidence_ref TEXT,
  approval_status TEXT DEFAULT 'pending',
  annual_impact_min DOUBLE PRECISION DEFAULT 0,
  annual_impact_max DOUBLE PRECISION DEFAULT 0,
  metric_value TEXT,
  metric_target TEXT
);
ALTER TABLE audit_findings ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS audit_findings_updated_at BEFORE UPDATE ON audit_findings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- AuditReceipt
CREATE TABLE IF NOT EXISTS audit_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  receipt_id TEXT,
  audit_id TEXT,
  system TEXT,
  action TEXT,
  status TEXT DEFAULT 'success',
  summary TEXT,
  evidence TEXT,
  rollback TEXT,
  performed_by TEXT,
  created_at TIMESTAMPTZ
);
ALTER TABLE audit_receipts ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS audit_receipts_updated_at BEFORE UPDATE ON audit_receipts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- BatchOperation
CREATE TABLE IF NOT EXISTS batch_operations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  name TEXT,
  batch_size DOUBLE PRECISION DEFAULT 10,
  template JSONB,
  variables TEXT,
  deploy_targets TEXT,
  google_connect BOOLEAN DEFAULT true,
  social_connect BOOLEAN DEFAULT true,
  video_generate BOOLEAN DEFAULT false,
  content_optimize BOOLEAN DEFAULT true,
  free_mode BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'queued',
  sites DOUBLE PRECISION DEFAULT 0,
  tasks_dispatched DOUBLE PRECISION DEFAULT 0
);
ALTER TABLE batch_operations ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS batch_operations_updated_at BEFORE UPDATE ON batch_operations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- BenchmarkCheckpoint
CREATE TABLE IF NOT EXISTS benchmark_checkpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  owner_id TEXT,
  request_id TEXT,
  revision TEXT,
  summary TEXT,
  implemented JSONB,
  verification JSONB,
  blockers JSONB,
  next_batch TEXT,
  work_items JSONB,
  score_snapshot JSONB
);
ALTER TABLE benchmark_checkpoints ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS benchmark_checkpoints_updated_at BEFORE UPDATE ON benchmark_checkpoints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- BenchmarkCompany
CREATE TABLE IF NOT EXISTS benchmark_companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  company_id TEXT,
  company_name TEXT,
  url TEXT,
  industry TEXT,
  category TEXT,
  marketing_intelligence TEXT,
  design_intelligence TEXT,
  funnel_analysis TEXT,
  social_media_strategy TEXT,
  revenue_model TEXT,
  growth_tactics TEXT,
  content_strategy TEXT,
  benchmark_score INTEGER DEFAULT 0,
  ingested_content TEXT,
  is_top_20 BOOLEAN DEFAULT false,
  tags JSONB,
  spending_pattern TEXT
);
ALTER TABLE benchmark_companies ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS benchmark_companies_updated_at BEFORE UPDATE ON benchmark_companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- BenchmarkRun
CREATE TABLE IF NOT EXISTS benchmark_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  owner_id TEXT,
  revision TEXT,
  run_nonce TEXT,
  observed_at TIMESTAMPTZ,
  observations JSONB,
  signature TEXT
);
ALTER TABLE benchmark_runs ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS benchmark_runs_updated_at BEFORE UPDATE ON benchmark_runs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- BusinessAudit
CREATE TABLE IF NOT EXISTS business_audits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  audit_id TEXT,
  company_name TEXT,
  company_url TEXT,
  audit_type TEXT DEFAULT 'full',
  scope TEXT,
  status TEXT DEFAULT 'scoping',
  health_score DOUBLE PRECISION DEFAULT 0,
  finding_count DOUBLE PRECISION DEFAULT 0,
  critical_count DOUBLE PRECISION DEFAULT 0,
  high_count DOUBLE PRECISION DEFAULT 0,
  leak_count DOUBLE PRECISION DEFAULT 0,
  annual_leak_min DOUBLE PRECISION DEFAULT 0,
  annual_leak_max DOUBLE PRECISION DEFAULT 0,
  evidence_summary TEXT,
  report_markdown TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms DOUBLE PRECISION DEFAULT 0
);
ALTER TABLE business_audits ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS business_audits_updated_at BEFORE UPDATE ON business_audits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CallLog
CREATE TABLE IF NOT EXISTS call_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  call_sid TEXT,
  from_number TEXT,
  to_number TEXT,
  direction TEXT DEFAULT 'inbound',
  status TEXT DEFAULT 'ringing',
  duration_seconds DOUBLE PRECISION DEFAULT 0,
  recording_url TEXT,
  transcript TEXT,
  agent_summary TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS call_logs_updated_at BEFORE UPDATE ON call_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Campaign
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  name TEXT,
  description TEXT,
  channel TEXT DEFAULT 'sms',
  message_template TEXT,
  voice_script TEXT,
  persona_id TEXT,
  status TEXT DEFAULT 'draft',
  schedule_type TEXT DEFAULT 'immediate',
  scheduled_at TIMESTAMPTZ,
  throttle_per_sec INTEGER DEFAULT 10,
  total_recipients DOUBLE PRECISION DEFAULT 0,
  sent_count DOUBLE PRECISION DEFAULT 0,
  delivered_count DOUBLE PRECISION DEFAULT 0,
  failed_count DOUBLE PRECISION DEFAULT 0,
  opt_out_count DOUBLE PRECISION DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CampaignRecipient
CREATE TABLE IF NOT EXISTS campaign_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  campaign_id TEXT,
  phone_number TEXT,
  display_name TEXT,
  status TEXT DEFAULT 'pending',
  attempts DOUBLE PRECISION DEFAULT 0,
  sent_at TIMESTAMPTZ,
  error_detail TEXT
);
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS campaign_recipients_updated_at BEFORE UPDATE ON campaign_recipients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CatalogItem
CREATE TABLE IF NOT EXISTS catalog_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  title TEXT,
  description TEXT,
  kind TEXT,
  price_cents DOUBLE PRECISION,
  currency TEXT DEFAULT 'usd',
  interval TEXT,
  category TEXT,
  active BOOLEAN DEFAULT true
);
ALTER TABLE catalog_items ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS catalog_items_updated_at BEFORE UPDATE ON catalog_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CatalogQuote
CREATE TABLE IF NOT EXISTS catalog_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  catalog_item_id TEXT,
  item_title TEXT,
  name TEXT,
  email TEXT,
  message TEXT,
  status TEXT DEFAULT 'new',
  description TEXT
);
ALTER TABLE catalog_quotes ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS catalog_quotes_updated_at BEFORE UPDATE ON catalog_quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ClientInfrastructure
CREATE TABLE IF NOT EXISTS client_infrastructure (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  name TEXT,
  client_id TEXT,
  capabilities JSONB,
  stack_type TEXT DEFAULT 'static_site',
  github_repo TEXT,
  github_url TEXT,
  vercel_id TEXT,
  vercel_url TEXT,
  railway_id TEXT,
  railway_url TEXT,
  railway_service_id TEXT,
  supabase_ref TEXT,
  supabase_url TEXT,
  domain TEXT,
  domain_status TEXT DEFAULT 'pending',
  provision_status TEXT DEFAULT 'pending',
  deployment_url TEXT,
  env_vars TEXT,
  description TEXT
);
ALTER TABLE client_infrastructure ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS client_infrastructure_updated_at BEFORE UPDATE ON client_infrastructure FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ClientProject
CREATE TABLE IF NOT EXISTS client_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  title TEXT,
  client_id TEXT,
  status TEXT DEFAULT 'Planning',
  progress_note TEXT,
  description TEXT
);
ALTER TABLE client_projects ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS client_projects_updated_at BEFORE UPDATE ON client_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CloneQueue
CREATE TABLE IF NOT EXISTS clone_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  target_url TEXT,
  site_name TEXT,
  industry TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'queued',
  clone_method TEXT DEFAULT 'single_page',
  pages_cloned DOUBLE PRECISION DEFAULT 0,
  images_rehosted DOUBLE PRECISION DEFAULT 0,
  images_total DOUBLE PRECISION DEFAULT 0,
  css_inlined DOUBLE PRECISION DEFAULT 0,
  links_rewritten DOUBLE PRECISION DEFAULT 0,
  parity_score DOUBLE PRECISION DEFAULT 0,
  brand_name TEXT,
  brand_phone TEXT,
  brand_email TEXT,
  vercel_url TEXT,
  audit_id TEXT,
  source TEXT DEFAULT 'manual',
  error TEXT,
  notes TEXT
);
ALTER TABLE clone_queue ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS clone_queue_updated_at BEFORE UPDATE ON clone_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CommerceOrder
CREATE TABLE IF NOT EXISTS commerce_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  catalog_item_id TEXT,
  item_title TEXT,
  customer_email TEXT,
  customer_name TEXT,
  status TEXT,
  checkout_session_id TEXT,
  stripe_subscription_id TEXT,
  client_id TEXT,
  project_id TEXT,
  amount_cents DOUBLE PRECISION,
  currency TEXT,
  description TEXT
);
ALTER TABLE commerce_orders ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS commerce_orders_updated_at BEFORE UPDATE ON commerce_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CommsEvent
CREATE TABLE IF NOT EXISTS comms_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  conversation_id TEXT,
  channel TEXT,
  direction TEXT,
  from_addr TEXT,
  to_addr TEXT,
  body TEXT,
  media_urls TEXT,
  status TEXT DEFAULT 'active',
  provider_message_id TEXT,
  error_code TEXT,
  error_detail TEXT,
  duration_sec DOUBLE PRECISION DEFAULT 0,
  classification TEXT DEFAULT 'LIVE',
  agent_generated BOOLEAN DEFAULT false,
  campaign_id TEXT,
  recording_url TEXT
);
ALTER TABLE comms_events ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS comms_events_updated_at BEFORE UPDATE ON comms_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CommunicationTemplate
CREATE TABLE IF NOT EXISTS communication_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  industry TEXT DEFAULT 'universal',
  channel TEXT DEFAULT 'sms',
  situation TEXT DEFAULT 'sales',
  tone TEXT DEFAULT 'professional',
  persona_id TEXT,
  template_body TEXT,
  high_response_words JSONB,
  effectiveness_score DOUBLE PRECISION DEFAULT 0,
  target_audience TEXT,
  active BOOLEAN DEFAULT true,
  sequence_day INTEGER DEFAULT 0,
  playbook_id TEXT
);
ALTER TABLE communication_templates ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS communication_templates_updated_at BEFORE UPDATE ON communication_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Conversation
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  participant_identity TEXT,
  contact_name TEXT,
  channels JSONB,
  status TEXT DEFAULT 'active',
  last_message_at TIMESTAMPTZ,
  last_message_preview VARCHAR(200),
  unread_count DOUBLE PRECISION DEFAULT 0,
  summary TEXT,
  assigned_agent_id TEXT
);
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CrmContact
CREATE TABLE IF NOT EXISTS crm_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  name TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  source TEXT,
  source_id TEXT,
  status TEXT DEFAULT 'new',
  follow_up_at TIMESTAMPTZ,
  follow_up_subject TEXT,
  follow_up_body TEXT,
  follow_up_status TEXT DEFAULT 'paused',
  last_sent_at TIMESTAMPTZ,
  google_resource_name TEXT,
  calendar_event_id TEXT
);
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS crm_contacts_updated_at BEFORE UPDATE ON crm_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CustomerSite
CREATE TABLE IF NOT EXISTS customer_sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  name TEXT,
  client_id TEXT,
  supabase_ref TEXT,
  supabase_organization TEXT,
  description TEXT
);
ALTER TABLE customer_sites ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS customer_sites_updated_at BEFORE UPDATE ON customer_sites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- DomainInventory
CREATE TABLE IF NOT EXISTS domain_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  domain TEXT,
  status TEXT DEFAULT 'discovered',
  tld TEXT,
  price DOUBLE PRECISION DEFAULT 0,
  notes TEXT
);
ALTER TABLE domain_inventory ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS domain_inventory_updated_at BEFORE UPDATE ON domain_inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- DomainMetric
CREATE TABLE IF NOT EXISTS domain_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  domain_id TEXT,
  snapshot_date DATE,
  gsc_clicks DOUBLE PRECISION DEFAULT 0,
  gsc_impressions DOUBLE PRECISION DEFAULT 0,
  gsc_ctr DOUBLE PRECISION DEFAULT 0,
  gsc_position DOUBLE PRECISION DEFAULT 0,
  gsc_top_queries TEXT,
  ga4_users DOUBLE PRECISION DEFAULT 0,
  ga4_sessions DOUBLE PRECISION DEFAULT 0,
  ga4_pageviews DOUBLE PRECISION DEFAULT 0,
  ga4_conversions DOUBLE PRECISION DEFAULT 0,
  sitemap_url_count DOUBLE PRECISION DEFAULT 0,
  sitemap_errors TEXT,
  competitor_summary TEXT,
  insight TEXT
);
ALTER TABLE domain_metrics ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS domain_metrics_updated_at BEFORE UPDATE ON domain_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- DominanceCampaign
CREATE TABLE IF NOT EXISTS dominance_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  campaign_id TEXT,
  niche_id TEXT,
  keyword TEXT,
  city TEXT,
  state TEXT,
  business_name TEXT,
  domain TEXT,
  domain_purchased BOOLEAN DEFAULT false,
  vercel_project_id TEXT,
  vercel_deployment_url TEXT,
  phase TEXT DEFAULT 'intelligence',
  phase_status JSONB,
  intelligence_data TEXT,
  pages_generated INTEGER DEFAULT 0,
  page_types JSONB,
  platforms_joined JSONB,
  fame_score DOUBLE PRECISION DEFAULT 0,
  fame_breakdown TEXT,
  swarm_tasks_spawned JSONB,
  backlink_count INTEGER DEFAULT 0,
  indexed_pages INTEGER DEFAULT 0,
  estimated_monthly_traffic DOUBLE PRECISION DEFAULT 0,
  status TEXT DEFAULT 'running',
  auto_purchase_domain BOOLEAN DEFAULT false,
  auto_deploy_vercel BOOLEAN DEFAULT true,
  error TEXT,
  current_step_description TEXT,
  progress_percent DOUBLE PRECISION DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER DEFAULT 0
);
ALTER TABLE dominance_campaigns ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS dominance_campaigns_updated_at BEFORE UPDATE ON dominance_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- DominanceGoal
CREATE TABLE IF NOT EXISTS dominance_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  goal_id TEXT,
  goal_type TEXT DEFAULT 'custom',
  title TEXT,
  description TEXT,
  target_value DOUBLE PRECISION,
  current_value DOUBLE PRECISION DEFAULT 0,
  unit TEXT,
  timeframe TEXT DEFAULT 'yearly',
  deadline DATE,
  progress_percentage DOUBLE PRECISION DEFAULT 0,
  status TEXT DEFAULT 'active',
  strategy_snapshot TEXT,
  autonomous_actions JSONB,
  priority TEXT DEFAULT 'high'
);
ALTER TABLE dominance_goals ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS dominance_goals_updated_at BEFORE UPDATE ON dominance_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- EnhancementJob
CREATE TABLE IF NOT EXISTS enhancement_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  owner_id TEXT,
  criterion_id TEXT,
  route TEXT,
  request_id TEXT,
  revision TEXT,
  status TEXT,
  plan TEXT,
  error TEXT,
  plan_started_at TIMESTAMPTZ
);
ALTER TABLE enhancement_jobs ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS enhancement_jobs_updated_at BEFORE UPDATE ON enhancement_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Evidence
CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  evidence_id TEXT,
  audit_id TEXT,
  finding_id TEXT,
  source_type TEXT,
  source_uri TEXT,
  captured_at TIMESTAMPTZ,
  content_summary TEXT,
  content_hash TEXT,
  raw_snippet TEXT,
  status_code DOUBLE PRECISION
);
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS evidence_updated_at BEFORE UPDATE ON evidence FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- FactoryApproval
CREATE TABLE IF NOT EXISTS factory_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  approval_id TEXT,
  run_id TEXT,
  step_key TEXT,
  action_key TEXT,
  risk_class TEXT,
  status TEXT DEFAULT 'pending',
  request TEXT,
  reason TEXT,
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT,
  expires_at TIMESTAMPTZ
);
ALTER TABLE factory_approvals ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS factory_approvals_updated_at BEFORE UPDATE ON factory_approvals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- FactoryArtifact
CREATE TABLE IF NOT EXISTS factory_artifacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  artifact_id TEXT,
  run_id TEXT,
  generator_id TEXT,
  generator_version TEXT,
  name TEXT,
  media_type TEXT,
  storage_ref TEXT,
  sha256 TEXT,
  size_bytes DOUBLE PRECISION DEFAULT 0,
  content TEXT,
  source_step_key TEXT,
  dependencies JSONB,
  validation_state TEXT DEFAULT 'pending',
  is_compound BOOLEAN DEFAULT false,
  metadata TEXT
);
ALTER TABLE factory_artifacts ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS factory_artifacts_updated_at BEFORE UPDATE ON factory_artifacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- FactoryProject
CREATE TABLE IF NOT EXISTS factory_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  project_key TEXT,
  name TEXT,
  description TEXT,
  objective TEXT,
  industry TEXT,
  product TEXT,
  requirements TEXT,
  generator_keys JSONB,
  status TEXT DEFAULT 'intake',
  run_count DOUBLE PRECISION DEFAULT 0,
  artifact_count DOUBLE PRECISION DEFAULT 0,
  client_id TEXT
);
ALTER TABLE factory_projects ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS factory_projects_updated_at BEFORE UPDATE ON factory_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- GeneratorDefinition
CREATE TABLE IF NOT EXISTS generator_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  generator_key TEXT,
  name TEXT,
  category TEXT,
  generator_type TEXT,
  description TEXT,
  current_version TEXT,
  definition_json TEXT,
  definition_sha256 TEXT,
  input_schema TEXT,
  output_contract TEXT,
  status TEXT DEFAULT 'draft',
  capabilities JSONB,
  tags JSONB,
  can_compose BOOLEAN DEFAULT false,
  max_recursion_depth DOUBLE PRECISION DEFAULT 3,
  version_count DOUBLE PRECISION DEFAULT 0,
  run_count DOUBLE PRECISION DEFAULT 0,
  last_run_at TIMESTAMPTZ
);
ALTER TABLE generator_definitions ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS generator_definitions_updated_at BEFORE UPDATE ON generator_definitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- GeneratorRun
CREATE TABLE IF NOT EXISTS generator_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  run_id TEXT,
  generator_id TEXT,
  generator_key TEXT,
  generator_version TEXT,
  project_id TEXT,
  parent_run_id TEXT,
  status TEXT DEFAULT 'DRAFT',
  input TEXT,
  input_hash TEXT,
  seed TEXT,
  run_manifest TEXT,
  total_steps DOUBLE PRECISION DEFAULT 0,
  completed_steps DOUBLE PRECISION DEFAULT 0,
  failed_steps DOUBLE PRECISION DEFAULT 0,
  artifact_count DOUBLE PRECISION DEFAULT 0,
  validation_status TEXT DEFAULT 'pending',
  error TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms DOUBLE PRECISION DEFAULT 0,
  is_child_run BOOLEAN DEFAULT false,
  child_run_ids JSONB
);
ALTER TABLE generator_runs ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS generator_runs_updated_at BEFORE UPDATE ON generator_runs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- InsiderContent
CREATE TABLE IF NOT EXISTS insider_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  title TEXT,
  slug TEXT,
  category TEXT DEFAULT 'tip',
  excerpt TEXT,
  content_markdown TEXT,
  image_url TEXT,
  display_order DOUBLE PRECISION DEFAULT 0,
  publish_date TIMESTAMPTZ,
  featured BOOLEAN DEFAULT false,
  read_time_minutes DOUBLE PRECISION DEFAULT 3
);
ALTER TABLE insider_content ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS insider_content_updated_at BEFORE UPDATE ON insider_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Lead
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  form_type TEXT,
  name TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  service TEXT,
  message TEXT,
  query TEXT,
  plan_title TEXT,
  description TEXT
);
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- MonitoringEvent
CREATE TABLE IF NOT EXISTS monitoring_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  event_id TEXT,
  rule_id TEXT,
  audit_id TEXT,
  event_type TEXT,
  severity TEXT DEFAULT 'info',
  message TEXT,
  metric_value TEXT,
  threshold_value TEXT,
  payload TEXT,
  acknowledged BOOLEAN DEFAULT false,
  detected_at TIMESTAMPTZ
);
ALTER TABLE monitoring_events ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS monitoring_events_updated_at BEFORE UPDATE ON monitoring_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- MonitoringRule
CREATE TABLE IF NOT EXISTS monitoring_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  rule_id TEXT,
  audit_id TEXT,
  name TEXT,
  rule_type TEXT,
  configuration TEXT,
  check_url TEXT,
  threshold TEXT,
  cadence_seconds DOUBLE PRECISION DEFAULT 300,
  active BOOLEAN DEFAULT true,
  last_checked_at TIMESTAMPTZ,
  last_status TEXT DEFAULT 'unknown'
);
ALTER TABLE monitoring_rules ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS monitoring_rules_updated_at BEFORE UPDATE ON monitoring_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- OutreachDraft
CREATE TABLE IF NOT EXISTS outreach_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  draft_id TEXT,
  audit_id TEXT,
  company_name TEXT,
  company_url TEXT,
  contact_name TEXT,
  contact_email TEXT,
  subject TEXT,
  body TEXT,
  evidence_refs TEXT,
  value_summary TEXT,
  approval_status TEXT DEFAULT 'draft',
  send_status TEXT DEFAULT 'draft_only',
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ
);
ALTER TABLE outreach_drafts ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS outreach_drafts_updated_at BEFORE UPDATE ON outreach_drafts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Post
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  display_order DOUBLE PRECISION,
  title TEXT,
  slug TEXT,
  publish_date TIMESTAMPTZ,
  excerpt TEXT,
  content_markdown TEXT,
  image_url TEXT,
  image_alt TEXT,
  author_name TEXT,
  author_image_url TEXT,
  categories TEXT
);
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Project
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  display_order DOUBLE PRECISION,
  title TEXT,
  slug TEXT,
  publish_date TIMESTAMPTZ,
  excerpt TEXT,
  content_markdown TEXT,
  image_url TEXT,
  image_alt TEXT,
  categories TEXT,
  metric_1_value TEXT,
  metric_1_label TEXT,
  metric_2_value TEXT,
  metric_2_label TEXT,
  metric_3_value TEXT,
  metric_3_label TEXT
);
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ProjectRequest
CREATE TABLE IF NOT EXISTS project_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  project_id TEXT,
  client_id TEXT,
  message TEXT,
  status TEXT DEFAULT 'Open',
  reply TEXT,
  description TEXT
);
ALTER TABLE project_requests ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS project_requests_updated_at BEFORE UPDATE ON project_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ProvisionedSite
CREATE TABLE IF NOT EXISTS provisioned_sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  project_name TEXT,
  slug TEXT,
  template_id TEXT,
  build_spec_id TEXT,
  site_type TEXT DEFAULT 'static_html',
  github_repo TEXT,
  github_url TEXT,
  github_default_branch TEXT DEFAULT 'main',
  vercel_project_id TEXT,
  vercel_url TEXT,
  vercel_deployment_url TEXT,
  needs_backend BOOLEAN DEFAULT false,
  supabase_project_id TEXT,
  supabase_url TEXT,
  supabase_region TEXT DEFAULT 'us-east-1',
  supabase_plan TEXT DEFAULT 'free',
  status TEXT DEFAULT 'pending',
  progress_step TEXT,
  deployment_url TEXT,
  error TEXT,
  provisioned_at TIMESTAMPTZ,
  deployed_at TIMESTAMPTZ
);
ALTER TABLE provisioned_sites ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS provisioned_sites_updated_at BEFORE UPDATE ON provisioned_sites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ProvisioningPlan
CREATE TABLE IF NOT EXISTS provisioning_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  plan_id TEXT,
  project_id TEXT,
  template_id TEXT,
  name TEXT,
  desired_state TEXT,
  current_state TEXT,
  diff TEXT,
  actions TEXT,
  risk_summary TEXT,
  credential_requirements JSONB,
  rollback TEXT,
  status TEXT DEFAULT 'draft',
  approval_id TEXT,
  execution_receipt TEXT
);
ALTER TABLE provisioning_plans ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS provisioning_plans_updated_at BEFORE UPDATE ON provisioning_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RepairActionItem
CREATE TABLE IF NOT EXISTS repair_action_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  action_id TEXT,
  plan_id TEXT,
  finding_id TEXT,
  title TEXT,
  description TEXT,
  phase DOUBLE PRECISION DEFAULT 30,
  priority DOUBLE PRECISION DEFAULT 5,
  owner_role TEXT,
  effort_estimate TEXT DEFAULT 'medium',
  target_day DOUBLE PRECISION,
  success_metric TEXT,
  status TEXT DEFAULT 'pending',
  validation_result TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
ALTER TABLE repair_action_items ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS repair_action_items_updated_at BEFORE UPDATE ON repair_action_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RepairPlan
CREATE TABLE IF NOT EXISTS repair_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  plan_id TEXT,
  audit_id TEXT,
  title TEXT,
  horizon_days DOUBLE PRECISION DEFAULT 90,
  status TEXT DEFAULT 'draft',
  total_actions DOUBLE PRECISION DEFAULT 0,
  completed_actions DOUBLE PRECISION DEFAULT 0,
  progress_percentage DOUBLE PRECISION DEFAULT 0,
  estimated_revenue_recovery DOUBLE PRECISION DEFAULT 0,
  phase_30 TEXT,
  phase_60 TEXT,
  phase_90 TEXT,
  created_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ
);
ALTER TABLE repair_plans ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS repair_plans_updated_at BEFORE UPDATE ON repair_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RepairTask
CREATE TABLE IF NOT EXISTS repair_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  repair_id TEXT,
  run_id TEXT,
  validation_receipt_id TEXT,
  target_step_key TEXT,
  failing_validator TEXT,
  failure_layer TEXT,
  status TEXT DEFAULT 'open',
  repair_spec TEXT,
  patch_applied TEXT,
  rerun_result TEXT DEFAULT 'pending',
  regression_status TEXT DEFAULT 'pending',
  repair_round DOUBLE PRECISION DEFAULT 1,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
ALTER TABLE repair_tasks ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS repair_tasks_updated_at BEFORE UPDATE ON repair_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RevenueLeak
CREATE TABLE IF NOT EXISTS revenue_leaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  leak_id TEXT,
  audit_id TEXT,
  finding_id TEXT,
  category TEXT,
  description TEXT,
  annual_impact_min DOUBLE PRECISION DEFAULT 0,
  annual_impact_max DOUBLE PRECISION DEFAULT 0,
  confidence DOUBLE PRECISION DEFAULT 80,
  recovery_potential TEXT DEFAULT 'partial',
  status TEXT DEFAULT 'identified'
);
ALTER TABLE revenue_leaks ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS revenue_leaks_updated_at BEFORE UPDATE ON revenue_leaks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RiskRegister
CREATE TABLE IF NOT EXISTS risk_register (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  risk_id TEXT,
  audit_id TEXT,
  finding_id TEXT,
  title TEXT,
  description TEXT,
  category TEXT,
  likelihood DOUBLE PRECISION DEFAULT 3,
  impact DOUBLE PRECISION DEFAULT 3,
  risk_score DOUBLE PRECISION,
  controls TEXT,
  mitigation_plan TEXT,
  status TEXT DEFAULT 'identified',
  owner_role TEXT
);
ALTER TABLE risk_register ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS risk_register_updated_at BEFORE UPDATE ON risk_register FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RunStep
CREATE TABLE IF NOT EXISTS run_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  run_id TEXT,
  step_key TEXT,
  step_type TEXT,
  status TEXT DEFAULT 'pending',
  attempt_count DOUBLE PRECISION DEFAULT 0,
  max_attempts DOUBLE PRECISION DEFAULT 3,
  input TEXT,
  output TEXT,
  error TEXT,
  idempotency_key TEXT,
  node_config TEXT,
  dependencies JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms DOUBLE PRECISION DEFAULT 0
);
ALTER TABLE run_steps ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS run_steps_updated_at BEFORE UPDATE ON run_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sandbox
CREATE TABLE IF NOT EXISTS sandboxes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  name TEXT,
  environment TEXT DEFAULT 'local',
  status TEXT DEFAULT 'creating',
  railway_environment_id TEXT,
  railway_project_id TEXT,
  config TEXT,
  url TEXT,
  agent_name TEXT,
  description TEXT,
  api_key_hash TEXT,
  key_prefix TEXT,
  last_heartbeat_at TIMESTAMPTZ,
  health_status TEXT DEFAULT 'unknown',
  current_task_id TEXT,
  cycles_completed DOUBLE PRECISION DEFAULT 0,
  last_error TEXT
);
ALTER TABLE sandboxes ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS sandboxes_updated_at BEFORE UPDATE ON sandboxes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ScanSnapshot
CREATE TABLE IF NOT EXISTS scan_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  snapshot_id TEXT,
  audit_id TEXT,
  company_url TEXT,
  health_score DOUBLE PRECISION DEFAULT 0,
  finding_count DOUBLE PRECISION DEFAULT 0,
  critical_count DOUBLE PRECISION DEFAULT 0,
  high_count DOUBLE PRECISION DEFAULT 0,
  leak_count DOUBLE PRECISION DEFAULT 0,
  annual_leak_min DOUBLE PRECISION DEFAULT 0,
  annual_leak_max DOUBLE PRECISION DEFAULT 0,
  tech_stack TEXT,
  scanned_at TIMESTAMPTZ,
  scan_type TEXT DEFAULT 'full'
);
ALTER TABLE scan_snapshots ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS scan_snapshots_updated_at BEFORE UPDATE ON scan_snapshots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- SmsConversation
CREATE TABLE IF NOT EXISTS sms_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  phone_number TEXT,
  contact_name TEXT,
  last_message_preview VARCHAR(200),
  last_message_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  unread_count DOUBLE PRECISION DEFAULT 0,
  channel TEXT DEFAULT 'sms'
);
ALTER TABLE sms_conversations ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS sms_conversations_updated_at BEFORE UPDATE ON sms_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- SmsMessage
CREATE TABLE IF NOT EXISTS sms_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  conversation_id TEXT,
  from_number TEXT,
  to_number TEXT,
  body TEXT,
  media_urls TEXT,
  direction TEXT,
  message_type TEXT DEFAULT 'sms',
  twilio_sid TEXT,
  status TEXT DEFAULT 'received',
  agent_generated BOOLEAN DEFAULT false
);
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS sms_messages_updated_at BEFORE UPDATE ON sms_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- SystemBuild
CREATE TABLE IF NOT EXISTS system_builds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  title TEXT,
  build_type TEXT DEFAULT 'website',
  what_to_build TEXT,
  how_it_looks TEXT,
  how_it_functions TEXT,
  what_it_connects_to TEXT,
  what_it_says TEXT,
  how_it_operates TEXT,
  deliver_to TEXT,
  status TEXT DEFAULT 'spec_submitted',
  task_id TEXT,
  result TEXT
);
ALTER TABLE system_builds ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS system_builds_updated_at BEFORE UPDATE ON system_builds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- SystemEdge
CREATE TABLE IF NOT EXISTS system_edges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  edge_id TEXT,
  audit_id TEXT,
  source_node_id TEXT,
  target_node_id TEXT,
  relationship TEXT,
  risk_status TEXT DEFAULT 'unknown',
  description TEXT
);
ALTER TABLE system_edges ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS system_edges_updated_at BEFORE UPDATE ON system_edges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- SystemNode
CREATE TABLE IF NOT EXISTS system_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  node_id TEXT,
  audit_id TEXT,
  node_type TEXT,
  name TEXT,
  detected_from TEXT,
  health_status TEXT DEFAULT 'unknown',
  owner_role TEXT,
  risk_count DOUBLE PRECISION DEFAULT 0
);
ALTER TABLE system_nodes ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS system_nodes_updated_at BEFORE UPDATE ON system_nodes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- TemplateAsset
CREATE TABLE IF NOT EXISTS template_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  name TEXT,
  slug TEXT,
  source_type TEXT DEFAULT 'html',
  source_url TEXT,
  raw_content TEXT,
  extracted_patterns TEXT,
  pattern_summary TEXT,
  pattern_count DOUBLE PRECISION DEFAULT 0,
  color_palette TEXT,
  font_families TEXT,
  section_count DOUBLE PRECISION DEFAULT 0,
  status TEXT DEFAULT 'pending',
  tags JSONB,
  thumbnail_url TEXT
);
ALTER TABLE template_assets ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS template_assets_updated_at BEFORE UPDATE ON template_assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- TemplatePack
CREATE TABLE IF NOT EXISTS template_packs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  template_key TEXT,
  name TEXT,
  version TEXT,
  mode TEXT,
  description TEXT,
  variables_schema TEXT,
  files_json TEXT,
  dependencies JSONB,
  status TEXT DEFAULT 'draft',
  sha256 TEXT,
  category TEXT,
  tags JSONB
);
ALTER TABLE template_packs ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS template_packs_updated_at BEFORE UPDATE ON template_packs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Testimonial
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  display_order DOUBLE PRECISION,
  name TEXT,
  company TEXT,
  comment TEXT,
  image_url TEXT,
  rating DOUBLE PRECISION,
  variant TEXT,
  description TEXT
);
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS testimonials_updated_at BEFORE UPDATE ON testimonials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- User
CREATE TABLE IF NOT EXISTS user (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  role TEXT,
  assistant_instructions TEXT,
  active_gmail_connector_id TEXT
);
ALTER TABLE user ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS user_updated_at BEFORE UPDATE ON user FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ValidationReceipt
CREATE TABLE IF NOT EXISTS validation_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  receipt_id TEXT,
  run_id TEXT,
  validator_id TEXT,
  subject_hash TEXT,
  subject_type TEXT,
  subject_ref TEXT,
  status TEXT DEFAULT 'PASS',
  evidence TEXT,
  failures TEXT,
  is_mandatory BOOLEAN DEFAULT true,
  repair_task_id TEXT
);
ALTER TABLE validation_receipts ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS validation_receipts_updated_at BEFORE UPDATE ON validation_receipts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- VaultAccessKey
CREATE TABLE IF NOT EXISTS vault_access_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  owner_id TEXT,
  label TEXT,
  token_hash TEXT,
  prefix TEXT,
  scope TEXT,
  expires_at TIMESTAMPTZ,
  revoked BOOLEAN DEFAULT false
);
ALTER TABLE vault_access_keys ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS vault_access_keys_updated_at BEFORE UPDATE ON vault_access_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- VaultAccount
CREATE TABLE IF NOT EXISTS vault_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  name VARCHAR(100),
  provider TEXT,
  management_url TEXT,
  connector_id TEXT
);
ALTER TABLE vault_accounts ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS vault_accounts_updated_at BEFORE UPDATE ON vault_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- WorkerFleet
CREATE TABLE IF NOT EXISTS worker_fleets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  name TEXT,
  poll_interval DOUBLE PRECISION DEFAULT 60000,
  max_cycles DOUBLE PRECISION DEFAULT 5,
  focus_area TEXT DEFAULT 'all',
  deploy_target TEXT DEFAULT 'local',
  report_email TEXT,
  active BOOLEAN DEFAULT true
);
ALTER TABLE worker_fleets ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS worker_fleets_updated_at BEFORE UPDATE ON worker_fleets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- post
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  display_order DOUBLE PRECISION,
  title TEXT,
  slug TEXT,
  publish_date TIMESTAMPTZ,
  excerpt TEXT,
  content_markdown TEXT,
  image_url TEXT,
  image_alt TEXT,
  author_name TEXT,
  author_image_url TEXT,
  categories TEXT
);
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- project
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  display_order DOUBLE PRECISION,
  title TEXT,
  slug TEXT,
  publish_date TIMESTAMPTZ,
  excerpt TEXT,
  content_markdown TEXT,
  image_url TEXT,
  image_alt TEXT,
  categories TEXT,
  metric_1_value TEXT,
  metric_1_label TEXT,
  metric_2_value TEXT,
  metric_2_label TEXT,
  metric_3_value TEXT,
  metric_3_label TEXT
);
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- testimonial
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id UUID,
  display_order DOUBLE PRECISION,
  name TEXT,
  company TEXT,
  comment TEXT,
  image_url TEXT,
  rating DOUBLE PRECISION,
  variant TEXT,
  description TEXT
);
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER IF NOT EXISTS testimonials_updated_at BEFORE UPDATE ON testimonials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE adapter_definitions, admin_chat_turns, admin_conversations, agent_personas, agent_tasks, audit_findings, audit_receipts, batch_operations, benchmark_checkpoints, benchmark_companies, benchmark_runs, business_audits, call_logs, campaigns, campaign_recipients, catalog_items, catalog_quotes, client_infrastructure, client_projects, clone_queue, commerce_orders, comms_events, communication_templates, conversations, crm_contacts, customer_sites, domain_inventory, domain_metrics, dominance_campaigns, dominance_goals, enhancement_jobs, evidence, factory_approvals, factory_artifacts, factory_projects, generator_definitions, generator_runs, insider_content, leads, monitoring_events, monitoring_rules, outreach_drafts, posts, projects, project_requests, provisioned_sites, provisioning_plans, repair_action_items, repair_plans, repair_tasks, revenue_leaks, risk_register, run_steps, sandboxes, scan_snapshots, sms_conversations, sms_messages, system_builds, system_edges, system_nodes, template_assets, template_packs, testimonials, user, validation_receipts, vault_access_keys, vault_accounts, worker_fleets, posts, projects, testimonials;
