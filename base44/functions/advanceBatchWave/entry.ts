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

function stableSiteKey(variableSet: any, siteIndex: number): string {
  return String(variableSet.domain || variableSet.business_name || variableSet.site_id || `site-${siteIndex}`)
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || `site-${siteIndex}`;
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
      await base44.entities.BatchOperation.update(batchId, {
        status: 'running',
        queued_count: (pending.items || []).length ? 1 : 0,
        running_count: (inProgress.items || []).length ? 1 : 0,
      });
      return Response.json({
        ok: true,
        status: 'waiting_for_current_wave',
        batch_id: batchId,
        sites_materialized: batch.sites_materialized || 0,
        next_site_index: batch.next_site_index || 1,
      });
    }

    const currentCheckpoint = batch.checkpoint || {};
    const currentCheckpointKey = String(currentCheckpoint.checkpoint_key || '');
    let checkpointPassed = currentCheckpoint.status === 'checkpoint_passed';
    if (currentCheckpointKey) {
      const approvals = await base44.entities.AgentTask.filter(
        { batch_id: batchId, checkpoint_key: currentCheckpointKey, status: 'needs_approval' },
        { limit: 250 }
      );
      const blocked = (approvals.items || []).length;
      if (blocked > 0) {
        await base44.entities.BatchOperation.update(batchId, {
          status: 'awaiting_approval',
          blocked_count: blocked,
          validator_state: 'BLOCKED',
          quality_gate: 'BLOCKED',
          checkpoint: {
            ...currentCheckpoint,
            status: 'blocked',
            validator_state: 'BLOCKED',
            blocked_count: blocked,
            checkpointed_at: new Date().toISOString(),
          },
        });
        return Response.json({
          ok: true,
          status: 'checkpoint_blocked',
          batch_id: batchId,
          checkpoint_key: currentCheckpointKey,
          blocked_count: blocked,
        });
      }

      if (batch.validator_required !== false && Number(currentCheckpoint.wave_size || 0) > 0) {
        const validations = await base44.entities.AgentTask.filter(
          { batch_id: batchId, checkpoint_key: currentCheckpointKey, task_type: 'factory_validate_site' },
          { sort: '-created_date', limit: 250 }
        );
        const items = validations.items || [];
        const latestBySite = new Map<string, any>();
        for (const item of items) {
          const key = String(item.site_id || item.site_key || item.id);
          if (!latestBySite.has(key)) latestBySite.set(key, item);
        }
        const latestValidators = Array.from(latestBySite.values());
        const expected = Number(currentCheckpoint.wave_size || 0);
        if (latestValidators.length < expected) {
          await base44.entities.BatchOperation.update(batchId, {
            validator_state: 'PENDING',
            checkpoint: {
              ...currentCheckpoint,
              status: 'waiting_for_validator',
              validator_state: 'PENDING',
              validators_expected: expected,
              validators_seen: latestValidators.length,
              checkpointed_at: new Date().toISOString(),
            },
          });
          return Response.json({
            ok: true,
            status: 'waiting_for_validator',
            batch_id: batchId,
            checkpoint_key: currentCheckpointKey,
            validators_expected: expected,
            validators_seen: latestValidators.length,
          });
        }

        const validationStates = latestValidators.map((item: any) => String(item.validation_status || 'UNKNOWN'));
        const failed = validationStates.filter((state: string) => state === 'FAIL').length;
        const blocked = validationStates.filter((state: string) => state === 'BLOCKED').length;
        const unknown = validationStates.filter((state: string) => state === 'UNKNOWN' || state === 'PENDING').length;
        const passed = validationStates.filter((state: string) => state === 'PASS').length;

        if (failed || blocked || unknown) {
          const gate = failed ? 'FAIL' : blocked ? 'BLOCKED' : 'UNKNOWN';
          await base44.entities.BatchOperation.update(batchId, {
            status: failed ? 'failed' : 'awaiting_approval',
            validator_state: gate,
            quality_gate: gate,
            pass_count: Number(batch.pass_count || 0) + passed,
            fail_count: Number(batch.fail_count || 0) + failed,
            blocked_count: Number(batch.blocked_count || 0) + blocked + unknown,
            checkpoint: {
              ...currentCheckpoint,
              status: 'validation_gate_stopped',
              validator_state: gate,
              validators_passed: passed,
              validators_failed: failed,
              validators_blocked: blocked,
              validators_unknown: unknown,
              checkpointed_at: new Date().toISOString(),
            },
          });
          return Response.json({
            ok: true,
            status: 'validation_gate_stopped',
            batch_id: batchId,
            checkpoint_key: currentCheckpointKey,
            validator_state: gate,
            passed,
            failed,
            blocked,
            unknown,
          });
        }

        checkpointPassed = true;
        await base44.entities.BatchOperation.update(batchId, {
          validator_state: 'PASS',
          pass_count: Number(batch.pass_count || 0) + passed,
          checkpoint: {
            ...currentCheckpoint,
            status: 'checkpoint_passed',
            validator_state: 'PASS',
            validators_passed: passed,
            checkpointed_at: new Date().toISOString(),
          },
        });
      }
    }

    const batchSize = Math.max(1, Number(batch.batch_size || 1));
    const nextSite = Math.max(1, Number(batch.next_site_index || 1));
    if (nextSite > batchSize) {
      await base44.entities.BatchOperation.update(batchId, {
        status: batch.execution_mode === 'execute' ? 'awaiting_approval' : 'complete',
        quality_gate: batch.validator_required === false ? 'UNKNOWN' : (checkpointPassed ? 'PASS' : 'UNKNOWN'),
        validator_state: batch.validator_required === false ? 'UNKNOWN' : (checkpointPassed ? 'PASS' : (batch.validator_state || 'UNKNOWN')),
        queued_count: 0,
        running_count: 0,
        checkpoint: {
          ...(batch.checkpoint || {}),
          materialization_complete: true,
          status: 'materialization_complete',
          completed_at: new Date().toISOString(),
        },
      });
      return Response.json({
        ok: true,
        status: 'all_sites_materialized',
        batch_id: batchId,
        sites_materialized: batchSize,
        quality_gate: batch.validator_required === false ? 'UNKNOWN' : (checkpointPassed ? 'PASS' : 'UNKNOWN'),
        note: 'Materialization completion is not production release certification. Final preview/deployment validation remains separately required.'
      });
    }

    const waveSize = Math.max(1, Math.min(250, Number(batch.wave_size || 10)));
    const end = Math.min(batchSize, nextSite + waveSize - 1);
    const checkpointKey = `wave-${nextSite}-${end}`;

    const existingWave = await base44.entities.AgentTask.filter(
      { batch_id: batchId, checkpoint_key: checkpointKey },
      { limit: 1 }
    );
    if ((existingWave.items || []).length) {
      const sitesMaterialized = Math.min(batchSize, end);
      await base44.entities.BatchOperation.update(batchId, {
        status: 'running',
        sites_materialized: Math.max(Number(batch.sites_materialized || 0), sitesMaterialized),
        next_site_index: Math.max(Number(batch.next_site_index || 1), end + 1),
        checkpoint: {
          checkpoint_key: checkpointKey,
          wave_start: nextSite,
          wave_end: end,
          wave_size: end - nextSite + 1,
          status: 'idempotent_reconcile',
          checkpointed_at: new Date().toISOString(),
        },
      });
      return Response.json({
        ok: true,
        status: 'wave_already_materialized',
        batch_id: batchId,
        checkpoint_key: checkpointKey,
        wave_start: nextSite,
        wave_end: end,
      });
    }

    const vars = parseVariables(batch.variables);
    const template = batch.template || {};
    const tasks: any[] = [];

    for (let siteIndex = nextSite; siteIndex <= end; siteIndex++) {
      const variableSet = vars[siteIndex - 1] || {};
      const siteKey = stableSiteKey(variableSet, siteIndex);
      const siteId = String(variableSet.site_id || siteKey);
      const sourceTruthVersion = String(batch.source_truth_version || 'Strategic_Minds_Universal_Client_Packet_v1.0');

      const trace = {
        client_id: String(variableSet.client_id || ''),
        project_id: String(variableSet.project_id || ''),
        site_id: siteId,
        source_truth_version: sourceTruthVersion,
        template_version: String(variableSet.template_version || template.version || template.template_version || ''),
        brand_version: String(variableSet.brand_version || ''),
        mockup_version: String(variableSet.mockup_version || variableSet.approved_mockup_version || ''),
        git_repo: String(variableSet.git_repo || ''),
        git_branch: String(variableSet.git_branch || ''),
        git_sha: String(variableSet.git_sha || ''),
        preview_deployment_id: String(variableSet.preview_deployment_id || ''),
        rollback_pointer: String(variableSet.rollback_pointer || variableSet.git_sha || ''),
      };

      const payload = {
        batch_id: batchId,
        site_index: siteIndex,
        site_key: siteKey,
        execution_mode: batch.execution_mode || 'shadow',
        source_truth_version: sourceTruthVersion,
        template,
        variables: variableSet,
        trace,
        requirements: {
          no_fabricated_reviews: true,
          no_fabricated_people: true,
          no_fabricated_metrics: true,
          client_selection_gate: true,
          mockup_lock_required_before_build: true,
          independent_validation_required: batch.validator_required !== false,
          checkpoint_policy: batch.checkpoint_policy || 'every_wave',
          max_repair_rounds: Number(batch.max_repair_rounds ?? 2),
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
        ...trace,
        site_key: siteKey,
        phase: 'source_truth',
        checkpoint_key: checkpointKey,
        idempotency_key: `${batchId}:${siteId}:compile:${sourceTruthVersion}`,
        validation_status: 'PENDING',
        repair_count: 0,
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
      queued_count: created,
      running_count: 0,
      validator_state: batch.validator_required === false ? 'UNKNOWN' : 'PENDING',
      checkpoint: {
        checkpoint_key: checkpointKey,
        wave_start: nextSite,
        wave_end: end,
        wave_size: created,
        sites_materialized: sitesMaterialized,
        next_site_index: nextSiteIndex,
        status: 'wave_dispatched',
        validator_state: batch.validator_required === false ? 'UNKNOWN' : 'PENDING',
        checkpointed_at: new Date().toISOString(),
      },
    });

    return Response.json({
      ok: true,
      status: 'wave_dispatched',
      batch_id: batchId,
      checkpoint_key: checkpointKey,
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
