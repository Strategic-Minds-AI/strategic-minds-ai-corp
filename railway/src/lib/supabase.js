// Supabase client for the Railway backend service.
// Uses the service-role key only on the trusted server runtime. Browser clients
// must use the project's publishable key instead. Authorization is enforced by
// railway/src/lib/auth.js after validating the caller's Supabase JWT.
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;

if (!url || !key) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set');
}

export const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Helper: map camelCase entity name to snake_case table name.
export function tableName(entityName) {
  const map = {
    BusinessAudit: 'business_audits',
    AuditFinding: 'audit_findings',
    Evidence: 'evidence',
    RevenueLeak: 'revenue_leaks',
    ScanSnapshot: 'scan_snapshots',
    AuditReceipt: 'audit_receipts',
    SystemNode: 'system_nodes',
    SystemEdge: 'system_edges',
    RepairPlan: 'repair_plans',
    RepairActionItem: 'repair_action_items',
    RiskRegister: 'risk_register',
    OutreachDraft: 'outreach_drafts',
    MonitoringRule: 'monitoring_rules',
    MonitoringEvent: 'monitoring_events',
    CloneQueue: 'clone_queue',
    FactoryProject: 'factory_projects',
    GeneratorRun: 'generator_runs',
    RunStep: 'run_steps',
    FactoryArtifact: 'factory_artifacts',
    ValidationReceipt: 'validation_receipts',
    RepairTask: 'repair_tasks',
    FactoryApproval: 'factory_approvals',
    ProvisioningPlan: 'provisioning_plans',
    ProvisionedSite: 'provisioned_sites',
    TemplateAsset: 'template_assets',
    Sandbox: 'sandboxes',
    AgentTask: 'agent_tasks',
    CatalogItem: 'catalog_items',
    CatalogQuote: 'catalog_quotes',
    CommerceOrder: 'commerce_orders',
    ClientInfrastructure: 'client_infrastructure',
    CustomerSite: 'customer_sites',
    ClientProject: 'client_projects',
    ProjectRequest: 'project_requests',
    Lead: 'leads',
    CrmContact: 'crm_contacts',
    Post: 'posts',
    Project: 'projects',
    Testimonial: 'testimonials',
    VaultAccount: 'vault_accounts',
    VaultAccessKey: 'vault_access_keys',
    AdminConversation: 'admin_conversations',
    AdminChatTurn: 'admin_chat_turns',
    BenchmarkRun: 'benchmark_runs',
    BenchmarkCheckpoint: 'benchmark_checkpoints',
    Domain: 'domains',
    DomainMetric: 'domain_metrics',
    DominanceGoal: 'dominance_goals',
    DominanceCampaign: 'dominance_campaigns',
    InsiderContent: 'insider_content',
    EnhancementJob: 'enhancement_jobs',
  };
  return map[entityName] || entityName.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
}
