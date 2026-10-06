-- Swarm Nexus Website Factory durable-state extension
-- Branch-safe migration. DO NOT apply to production without explicit operator approval.

ALTER TABLE IF EXISTS batch_operations
  ADD COLUMN IF NOT EXISTS swarm_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS execution_mode TEXT DEFAULT 'shadow',
  ADD COLUMN IF NOT EXISTS swarm_concurrency INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS wave_size INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS source_truth_version TEXT,
  ADD COLUMN IF NOT EXISTS pipeline_version TEXT DEFAULT 'swarm-nexus-website-factory-v1',
  ADD COLUMN IF NOT EXISTS triage_level TEXT,
  ADD COLUMN IF NOT EXISTS checkpoint_policy TEXT DEFAULT 'every_wave',
  ADD COLUMN IF NOT EXISTS validator_required BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS max_repair_rounds INTEGER DEFAULT 2,
  ADD COLUMN IF NOT EXISTS sites_materialized INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_site_index INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS queued_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS running_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS blocked_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pass_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fail_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS repair_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS validator_state TEXT DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS approval_requirements JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS quality_gate TEXT DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS checkpoint JSONB DEFAULT '{}'::jsonb;

ALTER TABLE IF EXISTS agent_tasks
  ADD COLUMN IF NOT EXISTS batch_id UUID,
  ADD COLUMN IF NOT EXISTS client_id TEXT,
  ADD COLUMN IF NOT EXISTS project_id TEXT,
  ADD COLUMN IF NOT EXISTS site_id TEXT,
  ADD COLUMN IF NOT EXISTS site_key TEXT,
  ADD COLUMN IF NOT EXISTS source_truth_version TEXT,
  ADD COLUMN IF NOT EXISTS template_version TEXT,
  ADD COLUMN IF NOT EXISTS brand_version TEXT,
  ADD COLUMN IF NOT EXISTS mockup_version TEXT,
  ADD COLUMN IF NOT EXISTS git_repo TEXT,
  ADD COLUMN IF NOT EXISTS git_branch TEXT,
  ADD COLUMN IF NOT EXISTS git_sha TEXT,
  ADD COLUMN IF NOT EXISTS preview_deployment_id TEXT,
  ADD COLUMN IF NOT EXISTS validator_id TEXT,
  ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS repair_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rollback_pointer TEXT,
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS phase TEXT,
  ADD COLUMN IF NOT EXISTS depends_on JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS swarm_role TEXT,
  ADD COLUMN IF NOT EXISTS checkpoint_key TEXT;

CREATE INDEX IF NOT EXISTS idx_agent_tasks_batch_status
  ON agent_tasks(batch_id, status);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_batch_site
  ON agent_tasks(batch_id, site_key);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_batch_checkpoint
  ON agent_tasks(batch_id, checkpoint_key);

CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_tasks_idempotency_key
  ON agent_tasks(idempotency_key)
  WHERE idempotency_key IS NOT NULL AND idempotency_key <> '';

CREATE INDEX IF NOT EXISTS idx_batch_operations_swarm_status
  ON batch_operations(swarm_enabled, status);

COMMENT ON COLUMN batch_operations.execution_mode IS 'shadow = compile/validate only; execute = approval-gated promotion';
COMMENT ON COLUMN batch_operations.checkpoint IS 'Swarm Nexus wave checkpoint and synthesis state';
COMMENT ON COLUMN batch_operations.quality_gate IS 'Release-facing quality state; materialization completion alone must never set PASS';
COMMENT ON COLUMN agent_tasks.idempotency_key IS 'Stable batch/site/phase key used to suppress duplicate work';
