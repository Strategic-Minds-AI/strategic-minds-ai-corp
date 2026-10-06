import { createClientFromRequest } from '../../shared/ownedClient.ts';

function triageLevel(size: number): string {
  if (size <= 1) return 'single';
  if (size <= 25) return 'small';
  if (size <= 250) return 'fleet';
  if (size <= 2500) return 'mass';
  return 'mega';
}

function recommendedWave(size: number): number {
  if (size <= 1) return 1;
  if (size <= 25) return 10;
  if (size <= 250) return 25;
  if (size <= 2500) return 50;
  return 100;
}

function recommendedConcurrency(size: number): number {
  if (size <= 1) return 1;
  if (size <= 25) return 3;
  if (size <= 250) return 5;
  if (size <= 2500) return 8;
  return 12;
}

const PROTECTED_APPROVALS = [
  'production_deploy',
  'protected_branch_merge',
  'production_db_or_rls',
  'dns_or_domain_change',
  'secrets_or_credentials',
  'payments_or_spend',
  'permission_escalation',
  'destructive_or_irreversible_action',
  'customer_or_public_communication',
];

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const name = String(body.name || 'Batch Operation').slice(0, 200);
    const batchSize = Math.max(1, Math.min(Number(body.batch_size || 10), 10000));
    const executionMode = body.execution_mode === 'execute' ? 'execute' : 'shadow';
    const swarmEnabled = body.swarm_enabled !== false;
    const waveSize = Math.max(1, Math.min(Number(body.wave_size || recommendedWave(batchSize)), 250));
    const requestedConcurrency = body.concurrency ?? body.swarm_concurrency;
    const concurrency = Math.max(1, Math.min(Number(requestedConcurrency || recommendedConcurrency(batchSize)), 20));
    const checkpointPolicy = body.checkpoint_policy === 'every_wave' ? 'every_wave' : 'every_wave';
    const validatorRequired = body.validator_required !== false;
    const maxRepairRounds = Math.max(0, Math.min(Number(body.max_repair_rounds ?? 2), 5));
    const googleConnect = body.google_connect !== false;
    const socialConnect = body.social_connect !== false;
    const videoGenerate = body.video_generate === true;
    const contentOptimize = body.content_optimize !== false;
    const freeMode = body.free_mode !== false;
    const deployTargets = Array.isArray(body.deploy_targets) ? body.deploy_targets : [];
    const template = body.template && typeof body.template === 'object' ? body.template : {};
    const variables = typeof body.variables === 'string' ? body.variables : JSON.stringify(body.variables || []);

    const batch = await base44.entities.BatchOperation.create({
      name,
      batch_size: batchSize,
      template,
      variables,
      deploy_targets: deployTargets.join(','),
      status: 'running',
      sites: batchSize,
      tasks_dispatched: 0,
      google_connect: googleConnect,
      social_connect: socialConnect,
      video_generate: videoGenerate,
      content_optimize: contentOptimize,
      free_mode: freeMode,
      swarm_enabled: swarmEnabled,
      execution_mode: executionMode,
      swarm_concurrency: concurrency,
      wave_size: waveSize,
      source_truth_version: String(body.source_truth_version || 'Strategic_Minds_Universal_Client_Packet_v1.0'),
      pipeline_version: 'swarm-nexus-website-factory-v1',
      triage_level: triageLevel(batchSize),
      checkpoint_policy: checkpointPolicy,
      validator_required: validatorRequired,
      max_repair_rounds: maxRepairRounds,
      sites_materialized: 0,
      next_site_index: 1,
      queued_count: 0,
      running_count: 0,
      blocked_count: 0,
      pass_count: 0,
      fail_count: 0,
      repair_count: 0,
      validator_state: validatorRequired ? 'PENDING' : 'UNKNOWN',
      approval_requirements: PROTECTED_APPROVALS,
      quality_gate: validatorRequired ? 'PENDING' : 'UNKNOWN',
      checkpoint: {
        created_at: new Date().toISOString(),
        commander: 'Apex / Agent Zero',
        swarm_layer: 'Swarm Nexus',
        mode: executionMode,
        status: 'created',
        policy: checkpointPolicy,
        validator_required: validatorRequired,
        max_repair_rounds: maxRepairRounds,
      },
    });

    if (!swarmEnabled) {
      return Response.json({
        batch_id: batch.id,
        sites: batchSize,
        tasks_dispatched: 0,
        status: 'running',
        swarm_enabled: false,
        note: 'Batch created without Swarm Nexus materialization.'
      });
    }

    const wave = await base44.functions.invoke('advanceBatchWave', { batch_id: batch.id });
    if (wave.data?.error) throw new Error(wave.data.error);

    return Response.json({
      batch_id: batch.id,
      sites: batchSize,
      tasks_dispatched: wave.data?.tasks_created || 0,
      status: 'running',
      execution_mode: executionMode,
      triage_level: triageLevel(batchSize),
      concurrency,
      swarm_concurrency: concurrency,
      wave_size: waveSize,
      checkpoint_policy: checkpointPolicy,
      validator_required: validatorRequired,
      max_repair_rounds: maxRepairRounds,
      approval_requirements: PROTECTED_APPROVALS,
      wave: wave.data || null,
      protected_gate: 'Production deploys, DNS, secrets, spend, permissions, protected merges, production DB/RLS and public/customer communications remain approval-gated.'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
