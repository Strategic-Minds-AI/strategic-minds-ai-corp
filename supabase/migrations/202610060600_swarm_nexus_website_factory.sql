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
  ADD COLUMN IF NOT EXISTS sites_materialized INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_site_index INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS quality_gate TEXT DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS checkpoint JSONB DEFAULT '{}'::jsonb;

ALTER TABLE IF EXISTS agent_tasks
  ADD COLUMN IF NOT EXISTS batch_id UUID,
  ADD COLUMN IF NOT EXISTS site_key TEXT,
  ADD COLUMN IF NOT EXISTS phase TEXT,
  ADD COLUMN IF NOT EXISTS depends_on JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS swarm_role TEXT,
  ADD COLUMN IF NOT EXISTS checkpoint_key TEXT;

CREATE INDEX IF NOT EXISTS idx_agent_tasks_batch_status
  ON agent_tasks(batch_id, status);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_batch_site
  ON agent_tasks(batch_id, site_key);

CREATE INDEX IF NOT EXISTS idx_batch_operations_swarm_status
  ON batch_operations(swarm_enabled, status);

COMMENT ON COLUMN batch_operations.execution_mode IS 'shadow = compile/validate only; execute = approval-gated promotion';
COMMENT ON COLUMN batch_operations.checkpoint IS 'Swarm Nexus wave checkpoint and synthesis state';
