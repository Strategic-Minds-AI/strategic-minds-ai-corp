import { createClientFromRequest } from '../../shared/ownedClient.ts';

function parseVariables(raw: unknown): any[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== 'string' || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const batchId = String(body.batch_id || '');
    if (!batchId) return Response.json({ error: 'batch_id required' }, { status: 400 });

    const batch = await base44.entities.BatchOperation.get(batchId);
    if (!batch) return Response.json({ error: 'Batch not found' }, { status: 404 });
    if (!batch.swarm_enabled) return Response.json({ error: 'Swarm Nexus is not enabled for this batch' }, { status: 409 });

    const pending = await base44.entities.AgentTask.filter({ batch_id: batchId, status: 'pending' }, { limit: 1 });
    const inProgress = await base44.entities.AgentTask.filter({ batch_id: batchId, status: 'in_progress' }, { limit: 1 });
    if ((pending.items || []).length || (inProgress.items || []).length) {
      return Response.json({
        ok: true,
        status: 'waiting_for_current_wave',
        batch_id: batchId,
        sites_materialized: batch.sites_materialized || 0,
        next_site_index: batch.next_site_index || 1,
      });
    }

    const batchSize = Math.max(1, Number(batch.batch_size || 1));
    const nextSite = Math.max(1, Number(batch.next_site_index || 1));
    if (nextSite > batchSize) {
      await base44.entities.BatchOperation.update(batchId, {
        status: batch.execution_mode === 'execute' ? 'awaiting_approval' : 'complete',
        quality_gate: batch.quality_gate || 'PENDING',
        checkpoint: {
          ...(batch.checkpoint || {}),
          materialization_complete: true,
          completed_at: new Date().toISOString(),
        },
      });
      return Response.json({ ok: true, status: 'all_sites_materialized', batch_id: batchId, sites_materialized: batchSize });
    }

    const waveSize = Math.max(1, Math.min(250, Number(batch.wave_size || 10)));
    const end = Math.min(batchSize, nextSite + waveSize - 1);
    const vars = parseVariables(batch.variables);
    const template = batch.template || {};
    const tasks: any[] = [];

    for (let siteIndex = nextSite; siteIndex <= end; siteIndex++) {
      const variableSet = vars[siteIndex - 1] || {};
      const siteKey = String(variableSet.domain || variableSet.business_name || `site-${siteIndex}`)
        .toLowerCase().replace(/[^a-z0-9.-]+/g, '-').slice(0, 120);

      const payload = {
        batch_id: batchId,
        site_index: siteIndex,
        site_key: siteKey,
        execution_mode: batch.execution_mode || 'shadow',
        source_truth_version: batch.source_truth_version || 'Strategic_Minds_Universal_Client_Packet_v1.0',
        template,
        variables: variableSet,
        requirements: {
          no_fabricated_reviews: true,
          no_fabricated_people: true,
          no_fabricated_metrics: true,
          client_selection_gate: true,
          mockup_lock_required_before_build: true,
          independent_validation_required: true,
        },
      };

      tasks.push({
        agent_name: 'swarm',
        swarm_role: 'site_factory_manager',
        task_type: 'factory_compile_site',
        title: `Compile site ${siteIndex} of ${batchSize}: ${siteKey}`,
        description: JSON.stringify(payload),
        priority: 'high',
        autonomous: true,
        status: 'pending',
        batch_id: batchId,
        site_key: siteKey,
        phase: 'source_truth',
        checkpoint_key: `wave-${nextSite}-${end}`,
        domain: variableSet.domain || '',
      });
    }

    let created = 0;
    for (let i = 0; i < tasks.length; i += 100) {
      const chunk = tasks.slice(i, i + 100);
      await base44.entities.AgentTask.bulkCreate(chunk);
      created += chunk.length;
    }

    const sitesMaterialized = Math.min(batchSize, end);
    const nextSiteIndex = end + 1;
    await base44.entities.BatchOperation.update(batchId, {
      status: 'running',
      sites_materialized: sitesMaterialized,
      next_site_index: nextSiteIndex,
      tasks_dispatched: Number(batch.tasks_dispatched || 0) + created,
      checkpoint: {
        wave_start: nextSite,
        wave_end: end,
        wave_size: created,
        sites_materialized: sitesMaterialized,
        next_site_index: nextSiteIndex,
        checkpointed_at: new Date().toISOString(),
      },
    });

    return Response.json({
      ok: true,
      status: 'wave_dispatched',
      batch_id: batchId,
      wave_start: nextSite,
      wave_end: end,
      tasks_created: created,
      sites_materialized: sitesMaterialized,
      remaining_sites: Math.max(0, batchSize - sitesMaterialized),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
