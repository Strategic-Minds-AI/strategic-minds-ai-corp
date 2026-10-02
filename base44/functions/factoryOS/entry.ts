import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const action = body.action;

    switch (action) {
      case 'listGenerators': {
        const { items } = await base44.entities.GeneratorDefinition.filter({}, { sort: '-created_date', limit: 100 });
        return Response.json({ generators: items });
      }

      case 'createGenerator': {
        const def = body.definition;
        if (!def?.generator_key || !def?.name) {
          return Response.json({ error: 'generator_key and name are required' }, { status: 400 });
        }
        // Check for duplicate
        const existing = await base44.entities.GeneratorDefinition.filter({ generator_key: def.generator_key }, { limit: 1 });
        if (existing.items?.length > 0) {
          return Response.json({ error: 'Generator with this key already exists' }, { status: 409 });
        }
        const created = await base44.entities.GeneratorDefinition.create({
          generator_key: def.generator_key,
          name: def.name,
          category: def.category || 'code',
          generator_type: def.generator_type || def.generator_key,
          description: def.description || '',
          current_version: def.current_version || '1.0.0',
          definition_json: def.definition_json || '{}',
          definition_sha256: def.definition_sha256 || '',
          input_schema: def.input_schema || '{}',
          output_contract: def.output_contract || '{}',
          status: 'draft',
          capabilities: def.capabilities || [],
          tags: def.tags || [],
          can_compose: def.can_compose || false,
          max_recursion_depth: def.max_recursion_depth || 3,
        });
        return Response.json({ generator: created });
      }

      case 'updateGenerator': {
        const { id, ...updates } = body;
        if (!id) return Response.json({ error: 'id is required' }, { status: 400 });
        const updated = await base44.entities.GeneratorDefinition.update(id, updates);
        return Response.json({ generator: updated });
      }

      case 'deleteGenerator': {
        const { id } = body;
        if (!id) return Response.json({ error: 'id is required' }, { status: 400 });
        await base44.entities.GeneratorDefinition.delete(id);
        return Response.json({ deleted: true });
      }

      case 'freezeGenerator': {
        const { id } = body;
        if (!id) return Response.json({ error: 'id is required' }, { status: 400 });
        const updated = await base44.entities.GeneratorDefinition.update(id, { status: 'frozen' });
        return Response.json({ generator: updated });
      }

      case 'listRuns': {
        const { generator_id, project_id, status, limit } = body;
        const query: any = {};
        if (generator_id) query.generator_id = generator_id;
        if (project_id) query.project_id = project_id;
        if (status) query.status = status;
        const { items } = await base44.entities.GeneratorRun.filter(query, { sort: '-created_date', limit: limit || 50 });
        return Response.json({ runs: items });
      }

      case 'createRun': {
        const { generator_id, input, seed, project_id } = body;
        if (!generator_id) return Response.json({ error: 'generator_id is required' }, { status: 400 });

        const gen = await base44.entities.GeneratorDefinition.get(generator_id);
        if (!gen) return Response.json({ error: 'Generator not found' }, { status: 404 });

        // Compute input hash
        const normalizedInput = JSON.parse(JSON.stringify(input || {}));
        const inputStr = JSON.stringify(normalizedInput);
        const encoder = new TextEncoder();
        const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(inputStr));
        const inputHash = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');

        const runSeed = seed || `seed-${Date.now()}`;
        const runIdData = `${gen.generator_key}:${gen.current_version}:${inputHash}:${runSeed}`;
        const runHashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(runIdData));
        const runId = `run_${Array.from(new Uint8Array(runHashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('').substring(0, 16)}`;

        const run = await base44.entities.GeneratorRun.create({
          run_id: runId,
          generator_id: generator_id,
          generator_key: gen.generator_key,
          generator_version: gen.current_version,
          project_id: project_id || '',
          parent_run_id: '',
          status: 'DRAFT',
          input: JSON.stringify(input || {}),
          input_hash: inputHash,
          seed: runSeed,
          run_manifest: '{}',
          total_steps: 0,
          completed_steps: 0,
          failed_steps: 0,
          artifact_count: 0,
          validation_status: 'pending',
          is_child_run: false,
          child_run_ids: [],
          started_at: new Date().toISOString(),
        });

        // Increment generator run count
        await base44.entities.GeneratorDefinition.update(generator_id, {
          run_count: (gen.run_count || 0) + 1,
          last_run_at: new Date().toISOString(),
        });

        return Response.json({ run });
      }

      case 'updateRun': {
        const { id, ...updates } = body;
        if (!id) return Response.json({ error: 'id is required' }, { status: 400 });
        const updated = await base44.entities.GeneratorRun.update(id, updates);
        return Response.json({ run: updated });
      }

      case 'cancelRun': {
        const { id } = body;
        if (!id) return Response.json({ error: 'id is required' }, { status: 400 });
        const updated = await base44.entities.GeneratorRun.update(id, {
          status: 'CANCELLED',
          completed_at: new Date().toISOString(),
        });
        return Response.json({ run: updated });
      }

      case 'listSteps': {
        const { run_id } = body;
        if (!run_id) return Response.json({ error: 'run_id is required' }, { status: 400 });
        const { items } = await base44.entities.RunStep.filter({ run_id }, { sort: 'created_date', limit: 200 });
        return Response.json({ steps: items });
      }

      case 'createStep': {
        const step = body.step;
        if (!step?.run_id || !step?.step_key) {
          return Response.json({ error: 'run_id and step_key are required' }, { status: 400 });
        }
        const created = await base44.entities.RunStep.create({
          run_id: step.run_id,
          step_key: step.step_key,
          step_type: step.step_type || 'transform',
          status: step.status || 'pending',
          attempt_count: 0,
          max_attempts: step.max_attempts || 3,
          input: step.input || '{}',
          output: step.output || '',
          error: step.error || '',
          idempotency_key: step.idempotency_key || `${step.run_id}_${step.step_key}`,
          node_config: step.node_config || '{}',
          dependencies: step.dependencies || [],
        });
        return Response.json({ step: created });
      }

      case 'updateStep': {
        const { id, ...updates } = body;
        if (!id) return Response.json({ error: 'id is required' }, { status: 400 });
        const updated = await base44.entities.RunStep.update(id, updates);
        return Response.json({ step: updated });
      }

      case 'listArtifacts': {
        const { run_id } = body;
        if (!run_id) return Response.json({ error: 'run_id is required' }, { status: 400 });
        const { items } = await base44.entities.FactoryArtifact.filter({ run_id }, { sort: '-created_date', limit: 100 });
        return Response.json({ artifacts: items });
      }

      case 'createArtifact': {
        const artifact = body.artifact;
        if (!artifact?.artifact_id || !artifact?.run_id || !artifact?.name) {
          return Response.json({ error: 'artifact_id, run_id, and name are required' }, { status: 400 });
        }
        const created = await base44.entities.FactoryArtifact.create({
          artifact_id: artifact.artifact_id,
          run_id: artifact.run_id,
          generator_id: artifact.generator_id || '',
          generator_version: artifact.generator_version || '',
          name: artifact.name,
          media_type: artifact.media_type || 'text/plain',
          storage_ref: artifact.storage_ref || '',
          sha256: artifact.sha256 || '',
          size_bytes: artifact.size_bytes || 0,
          content: artifact.content || '',
          source_step_key: artifact.source_step_key || '',
          dependencies: artifact.dependencies || [],
          validation_state: artifact.validation_state || 'pending',
          is_compound: artifact.is_compound || false,
          metadata: artifact.metadata || '{}',
        });
        return Response.json({ artifact: created });
      }

      case 'listValidationReceipts': {
        const { run_id } = body;
        if (!run_id) return Response.json({ error: 'run_id is required' }, { status: 400 });
        const { items } = await base44.entities.ValidationReceipt.filter({ run_id }, { sort: '-created_date', limit: 50 });
        return Response.json({ receipts: items });
      }

      case 'createValidationReceipt': {
        const receipt = body.receipt;
        if (!receipt?.run_id || !receipt?.validator_id) {
          return Response.json({ error: 'run_id and validator_id are required' }, { status: 400 });
        }
        const created = await base44.entities.ValidationReceipt.create({
          receipt_id: receipt.receipt_id || `receipt_${Date.now()}`,
          run_id: receipt.run_id,
          validator_id: receipt.validator_id,
          subject_hash: receipt.subject_hash || '',
          subject_type: receipt.subject_type || 'run',
          subject_ref: receipt.subject_ref || '',
          status: receipt.status || 'PASS',
          evidence: receipt.evidence || '[]',
          failures: receipt.failures || '[]',
          is_mandatory: receipt.is_mandatory !== false,
          repair_task_id: receipt.repair_task_id || '',
        });
        return Response.json({ receipt: created });
      }

      case 'listRepairTasks': {
        const { run_id } = body;
        if (!run_id) return Response.json({ error: 'run_id is required' }, { status: 400 });
        const { items } = await base44.entities.RepairTask.filter({ run_id }, { sort: '-created_date', limit: 50 });
        return Response.json({ repairs: items });
      }

      case 'createRepairTask': {
        const repair = body.repair;
        if (!repair?.run_id) {
          return Response.json({ error: 'run_id is required' }, { status: 400 });
        }
        const created = await base44.entities.RepairTask.create({
          repair_id: repair.repair_id || `repair_${Date.now()}`,
          run_id: repair.run_id,
          validation_receipt_id: repair.validation_receipt_id || '',
          target_step_key: repair.target_step_key || '',
          failing_validator: repair.failing_validator || '',
          failure_layer: repair.failure_layer || 'schema',
          status: 'open',
          repair_spec: repair.repair_spec || '{}',
          patch_applied: '',
          rerun_result: 'pending',
          regression_status: 'pending',
          repair_round: repair.repair_round || 1,
        });
        return Response.json({ repair: created });
      }

      case 'updateRepairTask': {
        const { id, ...updates } = body;
        if (!id) return Response.json({ error: 'id is required' }, { status: 400 });
        const updated = await base44.entities.RepairTask.update(id, updates);
        return Response.json({ repair: updated });
      }

      case 'listApprovals': {
        const { run_id, status } = body;
        const query: any = {};
        if (run_id) query.run_id = run_id;
        if (status) query.status = status;
        const { items } = await base44.entities.FactoryApproval.filter(query, { sort: '-created_date', limit: 50 });
        return Response.json({ approvals: items });
      }

      case 'createApproval': {
        const approval = body.approval;
        if (!approval?.run_id || !approval?.action_key) {
          return Response.json({ error: 'run_id and action_key are required' }, { status: 400 });
        }
        const created = await base44.entities.FactoryApproval.create({
          approval_id: approval.approval_id || `approval_${Date.now()}`,
          run_id: approval.run_id,
          step_key: approval.step_key || '',
          action_key: approval.action_key,
          risk_class: approval.risk_class || 'PROTECTED',
          status: 'pending',
          request: approval.request || '{}',
          reason: approval.reason || '',
          expires_at: approval.expires_at || '',
        });
        return Response.json({ approval: created });
      }

      case 'resolveApproval': {
        const { id, status, resolution_note } = body;
        if (!id) return Response.json({ error: 'id is required' }, { status: 400 });
        const updated = await base44.entities.FactoryApproval.update(id, {
          status,
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
          resolution_note: resolution_note || '',
        });
        return Response.json({ approval: updated });
      }

      case 'listProjects': {
        const { items } = await base44.entities.FactoryProject.filter({}, { sort: '-created_date', limit: 100 });
        return Response.json({ projects: items });
      }

      case 'createProject': {
        const project = body.project;
        if (!project?.project_key || !project?.name) {
          return Response.json({ error: 'project_key and name are required' }, { status: 400 });
        }
        const created = await base44.entities.FactoryProject.create({
          project_key: project.project_key,
          name: project.name,
          description: project.description || '',
          objective: project.objective || '',
          industry: project.industry || '',
          product: project.product || '',
          requirements: project.requirements || '{}',
          generator_keys: project.generator_keys || [],
          status: 'intake',
          client_id: project.client_id || '',
        });
        return Response.json({ project: created });
      }

      case 'updateProject': {
        const { id, ...updates } = body;
        if (!id) return Response.json({ error: 'id is required' }, { status: 400 });
        const updated = await base44.entities.FactoryProject.update(id, updates);
        return Response.json({ project: updated });
      }

      case 'listTemplatePacks': {
        const { items } = await base44.entities.TemplatePack.filter({}, { sort: '-created_date', limit: 100 });
        return Response.json({ templates: items });
      }

      case 'createTemplatePack': {
        const pack = body.pack;
        if (!pack?.template_key || !pack?.name || !pack?.mode) {
          return Response.json({ error: 'template_key, name, and mode are required' }, { status: 400 });
        }
        const created = await base44.entities.TemplatePack.create({
          template_key: pack.template_key,
          name: pack.name,
          version: pack.version || '1.0.0',
          mode: pack.mode,
          description: pack.description || '',
          variables_schema: pack.variables_schema || '{}',
          files_json: pack.files_json || '[]',
          dependencies: pack.dependencies || [],
          status: 'draft',
          sha256: pack.sha256 || '',
          category: pack.category || '',
          tags: pack.tags || [],
        });
        return Response.json({ pack: created });
      }

      case 'listAdapters': {
        const { items } = await base44.entities.AdapterDefinition.filter({}, { sort: '-created_date', limit: 50 });
        return Response.json({ adapters: items });
      }

      case 'createAdapter': {
        const adapter = body.adapter;
        if (!adapter?.adapter_key || !adapter?.name) {
          return Response.json({ error: 'adapter_key and name are required' }, { status: 400 });
        }
        const created = await base44.entities.AdapterDefinition.create({
          adapter_key: adapter.adapter_key,
          name: adapter.name,
          version: adapter.version || '1.0.0',
          description: adapter.description || '',
          capabilities: adapter.capabilities || [],
          config_schema: adapter.config_schema || '{}',
          actions_json: adapter.actions_json || '[]',
          enabled: adapter.enabled || false,
          health_status: 'not_configured',
          secret_requirements: adapter.secret_requirements || [],
          supports_rollback: adapter.supports_rollback || false,
        });
        return Response.json({ adapter: created });
      }

      case 'updateAdapter': {
        const { id, ...updates } = body;
        if (!id) return Response.json({ error: 'id is required' }, { status: 400 });
        const updated = await base44.entities.AdapterDefinition.update(id, updates);
        return Response.json({ adapter: updated });
      }

      case 'listProvisioningPlans': {
        const { project_id } = body;
        const query: any = {};
        if (project_id) query.project_id = project_id;
        const { items } = await base44.entities.ProvisioningPlan.filter(query, { sort: '-created_date', limit: 50 });
        return Response.json({ plans: items });
      }

      case 'createProvisioningPlan': {
        const plan = body.plan;
        if (!plan?.plan_id || !plan?.name) {
          return Response.json({ error: 'plan_id and name are required' }, { status: 400 });
        }
        const created = await base44.entities.ProvisioningPlan.create({
          plan_id: plan.plan_id,
          project_id: plan.project_id || '',
          template_id: plan.template_id || '',
          name: plan.name,
          desired_state: plan.desired_state || '{}',
          current_state: plan.current_state || '{}',
          diff: plan.diff || '{}',
          actions: plan.actions || '[]',
          risk_summary: plan.risk_summary || '{}',
          credential_requirements: plan.credential_requirements || [],
          rollback: plan.rollback || '{}',
          status: 'draft',
        });
        return Response.json({ plan: created });
      }

      case 'updateProvisioningPlan': {
        const { id, ...updates } = body;
        if (!id) return Response.json({ error: 'id is required' }, { status: 400 });
        const updated = await base44.entities.ProvisioningPlan.update(id, updates);
        return Response.json({ plan: updated });
      }

      case 'dashboardStats': {
        const [generators, runs, projects, artifacts, repairs, approvals] = await Promise.all([
          base44.entities.GeneratorDefinition.count({}),
          base44.entities.GeneratorRun.count({}),
          base44.entities.FactoryProject.count({}),
          base44.entities.FactoryArtifact.count({}),
          base44.entities.RepairTask.count({ status: 'open' }),
          base44.entities.FactoryApproval.count({ status: 'pending' }),
        ]);

        const runsByStatus = await base44.entities.GeneratorRun.aggregate({
          groupBy: 'status',
          count: true,
        });

        return Response.json({
          generators,
          runs,
          projects,
          artifacts,
          open_repairs: repairs,
          pending_approvals: approvals,
          runs_by_status: runsByStatus.rows || [],
        });
      }

      default:
        return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}