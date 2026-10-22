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
    const concurrency = Math.max(1, Math.min(Number(body.swarm_concurrency || recommendedConcurrency(batchSize)), 20));
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
      sites_materialized: 0,
      next_site_index: 1,
      quality_gate: 'PENDING',
      checkpoint: {
        created_at: new Date().toISOString(),
        commander: 'Apex / Agent Zero',
        swarm_layer: 'Swarm Nexus',
        mode: executionMode,
        status: 'created',
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
      swarm_concurrency: concurrency,
      wave_size: waveSize,
      wave: wave.data || null,
      protected_gate: executionMode === 'execute'
        ? 'Production deploys, DNS, secrets, spend, permissions and public/customer communications remain approval-gated.'
        : null
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
