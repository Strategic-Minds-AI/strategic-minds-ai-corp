import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// ============================================================
// FRONTEND FACTORY — Slim persistence + dispatch API
//
// The 12-pass quality compiler runs CLIENT-SIDE in the browser
// (src/lib/frontendFactory/compiler.ts) using Vite's native JSON
// imports. This backend function only persists BuildSpecs and
// dispatches build tasks to sandbox workers.
//
// Actions:
//   persist       — Save a compiled BuildSpec (admin only)
//   listSpecs     — List saved BuildSpecs
//   getSpec       — Get a specific BuildSpec by project_id
//   dispatchBuild — Create AgentTasks for sandbox workers
//   deleteSpec    — Delete a BuildSpec
// ============================================================

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'listSpecs';

    // ── persist (admin only) ──
    if (action === 'persist') {
      if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

      const { build_spec, title, niche, domain } = body;
      if (!build_spec?.project_id) return Response.json({ error: 'build_spec.project_id required' }, { status: 400 });

      // Check if spec already exists
      const existing = await svc.entities.SystemBuild.filter(
        { task_id: build_spec.project_id },
        { limit: 1 }
      );

      const specData = {
        title: title || `UFF Build — ${build_spec.project_id}`,
        build_type: 'website',
        what_to_build: JSON.stringify(build_spec.screens?.map((s: any) => ({ name: s.name, route: s.route })) || []),
        how_it_looks: JSON.stringify(build_spec.tokens?.primitive || {}),
        how_it_functions: JSON.stringify(build_spec.selected_patterns || {}),
        what_it_connects_to: 'Vercel, Supabase, Google Search Console',
        what_it_says: JSON.stringify(build_spec.export_packet?.placeholder_content_map || {}),
        how_it_operates: 'Autonomous SEO dominance engine',
        deliver_to: domain || `https://${build_spec.project_id}.vercel.app`,
        status: 'spec_submitted',
        task_id: build_spec.project_id,
        result: JSON.stringify({ build_spec, niche }).slice(0, 30000),
      };

      let record;
      if (existing.items?.length > 0) {
        record = await svc.entities.SystemBuild.update(existing.items[0].id, specData);
      } else {
        record = await svc.entities.SystemBuild.create(specData);
      }

      return Response.json({ ok: true, build_id: record.id, project_id: build_spec.project_id });
    }

    // ── listSpecs ──
    if (action === 'listSpecs') {
      const records = await svc.entities.SystemBuild.filter(
        { build_type: 'website' },
        { sort: '-created_date', limit: 50, fields: ['title', 'task_id', 'status', 'deliver_to', 'created_date'] }
      );
      return Response.json({ specs: records.items || [] });
    }

    // ── getSpec ──
    if (action === 'getSpec') {
      const { project_id } = body;
      if (!project_id) return Response.json({ error: 'project_id required' }, { status: 400 });

      const records = await svc.entities.SystemBuild.filter({ task_id: project_id }, { limit: 1 });
      const record = records.items?.[0];
      if (!record) return Response.json({ error: 'Spec not found' }, { status: 404 });

      let buildSpec = null;
      try { buildSpec = JSON.parse(record.result); } catch {}

      return Response.json({ record, build_spec: buildSpec?.build_spec || null, niche: buildSpec?.niche || null });
    }

    // ── dispatchBuild (admin only) ──
    if (action === 'dispatchBuild') {
      if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

      const { project_id, domain, sandbox_id } = body;
      if (!project_id) return Response.json({ error: 'project_id required' }, { status: 400 });

      // Create an AgentTask for the sandbox worker to build this site
      const task = await svc.entities.AgentTask.create({
        agent_name: 'code_architect',
        task_type: 'build_system',
        title: `Build UFF site: ${project_id}`,
        description: JSON.stringify({
          project_id,
          domain: domain || '',
          build_type: 'website',
          source: 'frontend_factory',
          sandbox_id: sandbox_id || '',
        }),
        priority: 'high',
        autonomous: true,
        status: 'pending',
      });

      // Update the SystemBuild status
      const records = await svc.entities.SystemBuild.filter({ task_id: project_id }, { limit: 1 });
      if (records.items?.[0]) {
        await svc.entities.SystemBuild.update(records.items[0].id, { status: 'building', task_id: task.id });
      }

      return Response.json({ ok: true, task_id: task.id, project_id });
    }

    // ── deleteSpec (admin only) ──
    if (action === 'deleteSpec') {
      if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

      const { project_id } = body;
      if (!project_id) return Response.json({ error: 'project_id required' }, { status: 400 });

      const records = await svc.entities.SystemBuild.filter({ task_id: project_id }, { limit: 1 });
      if (records.items?.[0]) {
        await svc.entities.SystemBuild.delete(records.items[0].id);
      }

      return Response.json({ ok: true, deleted: project_id });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error('FrontendFactory error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}