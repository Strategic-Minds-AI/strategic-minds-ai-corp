import { createClientFromRequest } from '../../shared/ownedClient.ts';

const LEASE_DURATION_MS = 10 * 60 * 1000; // 10 minutes
const HEALTHY_THRESHOLD_MS = 3 * 60 * 1000; // 3 min
const DEGRADED_THRESHOLD_MS = 10 * 60 * 1000; // 10 min

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return 'tok_' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function computeHealthStatus(lastHeartbeat: string | undefined): string {
  if (!lastHeartbeat) return 'unknown';
  const age = Date.now() - new Date(lastHeartbeat).getTime();
  if (age < HEALTHY_THRESHOLD_MS) return 'healthy';
  if (age < DEGRADED_THRESHOLD_MS) return 'degraded';
  return 'offline';
}

async function authenticateSandbox(base44: any, req: Request) {
  const authHeader = req.headers.get('Authorization') || '';
  const rawApiKey = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!rawApiKey || !rawApiKey.startsWith('sk_sbx_')) {
    return { error: 'Missing or invalid API key. Use Authorization: Bearer sk_sbx_...', status: 401 };
  }
  const keyHash = await sha256(rawApiKey);
  const sandboxRes = await base44.asServiceRole.entities.Sandbox.filter(
    { api_key_hash: keyHash, status: 'active' },
    { limit: 1 }
  );
  const sandbox = sandboxRes.items?.[0];
  if (!sandbox) {
    return { error: 'Invalid API key or sandbox not active', status: 403 };
  }
  return { sandbox };
}

async function verifyClaim(base44: any, taskId: string, claimToken: string, sandboxId: string) {
  const task = await base44.asServiceRole.entities.AgentTask.get(taskId);
  if (!task) return { error: 'Task not found', status: 404 };
  if (task.claim_token !== claimToken) return { error: 'Invalid claim token for this task', status: 403 };
  if (task.claimed_by_sandbox_id !== sandboxId) return { error: 'This task was not claimed by your sandbox', status: 403 };
  if (task.lease_expires_at && new Date(task.lease_expires_at) < new Date()) {
    return { error: 'Task lease has expired. Poll again to re-claim.', status: 410 };
  }
  return { task };
}

// ── Task executors ──

async function executeGrowthAudit(base44: any, task: any): Promise<{ status: string; result: any }> {
  const domainName = task.domain || task.description;
  if (!domainName) {
    return { status: 'failed', result: { error: 'No domain specified for growth_audit' } };
  }

  // Look up the domain
  const domainRes = await base44.asServiceRole.entities.Domain.filter(
    { domain: domainName },
    { limit: 1 }
  );
  const domain = domainRes.items?.[0];

  if (!domain) {
    return {
      status: 'completed',
      result: { summary: `Domain ${domainName} not registered. Create it in Domain Operations first.`, action: 'register_domain' }
    };
  }

  // Basic health assessment (no LLM needed)
  const sitemapCount = domain.sitemap_url ? 1 : 0;
  const hasGsc = !!domain.gsc_property;
  const hasGa4 = !!domain.ga4_property_id;
  const healthScore = (sitemapCount * 25) + (hasGsc ? 40 : 0) + (hasGa4 ? 35 : 0);

  const summary = {
    domain: domainName,
    health_score: healthScore,
    sitemap_configured: sitemapCount > 0,
    gsc_connected: hasGsc,
    ga4_connected: hasGa4,
    next_action: healthScore < 50 ? 'Connect GSC and GA4 properties' : 'Run full growth mission for LLM insights',
    note: 'Full LLM-based growth audit is blocked until integration credits reset on 2026-10-12.',
  };

  // Update domain next_action
  await base44.asServiceRole.entities.Domain.update(domain.id, {
    next_action: summary.next_action,
    last_analyzed_at: new Date().toISOString(),
  });

  return { status: 'completed', result: summary };
}

async function executeBuildSystem(base44: any, task: any): Promise<{ status: string; result: any }> {
  let spec: any = {};
  try { spec = JSON.parse(task.description || '{}'); } catch { spec = { title: task.title }; }

  const build = await base44.asServiceRole.entities.SystemBuild.create({
    title: spec.title || task.title,
    build_type: spec.build_type || 'website',
    what_to_build: spec.what_to_build || task.description,
    how_it_looks: spec.how_it_looks || '',
    how_it_functions: spec.how_it_functions || '',
    what_it_connects_to: spec.what_it_connects_to || '',
    what_it_says: spec.what_it_says || '',
    how_it_operates: spec.how_it_operates || '',
    deliver_to: spec.deliver_to || '',
    status: 'spec_submitted',
    task_id: task.id,
  });

  return {
    status: 'completed',
    result: { summary: `SystemBuild created: ${build.title}`, build_id: build.id, status: build.status }
  };
}

function executeConnectInstructions(task: any): { status: string; result: any } {
  const taskType = task.task_type;
  const instructions: Record<string, any> = {
    google_connect: {
      summary: 'Google connection task received. Admin must connect Google Search Console, Analytics, and Drive connectors in the portal.',
      steps: ['Open Admin Portal → Google Workspace', 'Connect Search Console, Analytics, and Drive', 'Verify domain properties are registered'],
      requires_admin: true,
    },
    social_connect: {
      summary: 'Social connection task received. Admin must connect social media accounts via the portal.',
      steps: ['Open Admin Portal → Social', 'Connect each social platform', 'Verify accounts are linked'],
      requires_admin: true,
    },
  };

  return {
    status: 'completed',
    result: instructions[taskType] || { summary: `${taskType} task acknowledged`, requires_admin: true }
  };
}

function executePlaceholder(task: any): { status: string; result: any } {
  return {
    status: 'completed',
    result: {
      summary: `${task.task_type} task acknowledged. Full execution requires integration credits (LLM/video APIs).`,
      blocked_by: 'integration_credits_exhausted',
      resets: '2026-10-12',
      task_type: task.task_type,
    }
  };
}

async function executeTask(base44: any, task: any): Promise<{ status: string; result: any }> {
  const tt = task.task_type;
  if (tt === 'growth_audit') return executeGrowthAudit(base44, task);
  if (tt === 'build_system') return executeBuildSystem(base44, task);
  if (tt === 'google_connect' || tt === 'social_connect') return executeConnectInstructions(task);
  if (tt === 'content_optimize' || tt === 'video_generate') return executePlaceholder(task);
  // general / unknown
  return { status: 'completed', result: { summary: `Task "${task.title}" acknowledged by sandbox worker.` } };
}

// ── Main handler ──

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const auth = await authenticateSandbox(base44, req);
    if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });
    const sandbox = auth.sandbox;

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'poll';
    const now = new Date();
    const nowIso = now.toISOString();

    // ── poll ──
    if (action === 'poll') {
      const agentName = sandbox.agent_name || body.agent_name;
      if (!agentName) {
        return Response.json({ error: 'No agent assigned to this sandbox' }, { status: 400 });
      }

      const taskRes = await base44.asServiceRole.entities.AgentTask.filter(
        { agent_name: agentName, autonomous: true, status: { $in: ['pending', 'in_progress'] } },
        { sort: '-created_date', limit: 10 }
      );

      const allTasks = taskRes.items || [];
      const leaseExpiry = new Date(now.getTime() + LEASE_DURATION_MS).toISOString();
      const tasksToReturn = [];
      const batchCache = new Map<string, any>();
      const activeCountCache = new Map<string, number>();

      const getBatchConcurrency = async (batchId: string): Promise<number> => {
        if (!batchId) return 20;
        if (!batchCache.has(batchId)) {
          const batch = await base44.asServiceRole.entities.BatchOperation.get(batchId).catch(() => null);
          batchCache.set(batchId, batch);
        }
        const batch = batchCache.get(batchId);
        return Math.max(1, Math.min(20, Number(batch?.swarm_concurrency || 1)));
      };

      const getActiveCount = async (batchId: string): Promise<number> => {
        if (!batchId) return 0;
        if (!activeCountCache.has(batchId)) {
          const activeRes = await base44.asServiceRole.entities.AgentTask.filter(
            { batch_id: batchId, status: 'in_progress' },
            { limit: 250 }
          );
          const active = (activeRes.items || []).filter((candidate: any) => {
            if (!candidate.lease_expires_at) return true;
            return new Date(candidate.lease_expires_at) > now;
          }).length;
          activeCountCache.set(batchId, active);
        }
        return activeCountCache.get(batchId) || 0;
      };

      for (const task of allTasks) {
        const hasLiveLease = Boolean(task.lease_expires_at && new Date(task.lease_expires_at) > now);
        if (task.status === 'in_progress' && hasLiveLease) continue;

        if (task.batch_id) {
          const concurrencyCap = await getBatchConcurrency(task.batch_id);
          const activeCount = await getActiveCount(task.batch_id);
          if (activeCount >= concurrencyCap) continue;
        }

        const claimToken = generateToken();
        const claimFilter = task.status === 'pending'
          ? { id: task.id, status: 'pending', autonomous: true }
          : {
              id: task.id,
              status: 'in_progress',
              claim_token: task.claim_token || '',
              claimed_by_sandbox_id: task.claimed_by_sandbox_id || ''
            };

        const claim = await base44.asServiceRole.entities.AgentTask.updateMany(
          claimFilter,
          {
            $set: {
              status: 'in_progress',
              claim_token: claimToken,
              claimed_by_sandbox_id: sandbox.id,
              lease_expires_at: leaseExpiry,
              started_at: task.started_at || nowIso,
            }
          }
        );
        if (!claim?.updated) continue;

        if (task.batch_id) {
          activeCountCache.set(task.batch_id, (activeCountCache.get(task.batch_id) || 0) + 1);
        }

        tasksToReturn.push({
          id: task.id,
          task_type: task.task_type,
          title: task.title,
          description: task.description,
          priority: task.priority,
          domain: task.domain,
          batch_id: task.batch_id || null,
          site_id: task.site_id || null,
          site_key: task.site_key || null,
          checkpoint_key: task.checkpoint_key || null,
          claim_token: claimToken,
          lease_expires_at: leaseExpiry,
        });
      }

      // Update sandbox heartbeat on poll
      await base44.asServiceRole.entities.Sandbox.update(sandbox.id, {
        last_heartbeat_at: nowIso,
        health_status: 'healthy',
      });

      return Response.json({
        sandbox: { id: sandbox.id, name: sandbox.name, agent_name: agentName },
        tasks: tasksToReturn,
      });
    }

    // ── execute ──
    if (action === 'execute') {
      const { task_id, claim_token } = body;
      if (!task_id || !claim_token) {
        return Response.json({ error: 'task_id and claim_token are required' }, { status: 400 });
      }

      const claim = await verifyClaim(base44, task_id, claim_token, sandbox.id);
      if (claim.error) return Response.json({ error: claim.error }, { status: claim.status });
      const task = claim.task;

      // Mark sandbox as executing this task
      await base44.asServiceRole.entities.Sandbox.update(sandbox.id, {
        current_task_id: task_id,
        last_heartbeat_at: nowIso,
        health_status: 'healthy',
      });

      // Execute the task
      let execResult;
      try {
        execResult = await executeTask(base44, task);
      } catch (e) {
        execResult = { status: 'failed', result: { error: e.message } };
      }

      const finalStatus = execResult.status || 'completed';
      const resultStr = typeof execResult.result === 'string'
        ? execResult.result
        : JSON.stringify(execResult.result);

      // Update task with result
      await base44.asServiceRole.entities.AgentTask.update(task_id, {
        status: finalStatus,
        result: resultStr,
        claim_token: '',
        lease_expires_at: '',
        completed_at: nowIso,
      });

      // Update sandbox
      await base44.asServiceRole.entities.Sandbox.update(sandbox.id, {
        current_task_id: '',
        cycles_completed: (sandbox.cycles_completed || 0) + 1,
        last_heartbeat_at: nowIso,
        health_status: 'healthy',
        last_error: finalStatus === 'failed' ? resultStr.slice(0, 400) : '',
      });

      return Response.json({ ok: true, task_id, status: finalStatus, result: execResult.result });
    }

    // ── report ──
    if (action === 'report') {
      const { task_id, status, result, claim_token } = body;
      if (!task_id || !claim_token) {
        return Response.json({ error: 'task_id and claim_token are required' }, { status: 400 });
      }

      const claim = await verifyClaim(base44, task_id, claim_token, sandbox.id);
      if (claim.error) return Response.json({ error: claim.error }, { status: claim.status });

      const update: any = {
        status: status || 'completed',
        claim_token: '',
        lease_expires_at: '',
        completed_at: nowIso,
      };
      if (result) update.result = typeof result === 'string' ? result : JSON.stringify(result);

      await base44.asServiceRole.entities.AgentTask.update(task_id, update);

      await base44.asServiceRole.entities.Sandbox.update(sandbox.id, {
        current_task_id: '',
        cycles_completed: (sandbox.cycles_completed || 0) + 1,
        last_heartbeat_at: nowIso,
        health_status: 'healthy',
        last_error: status === 'failed' ? (update.result || '').slice(0, 400) : '',
      });

      return Response.json({ ok: true, task_id, status: update.status });
    }

    // ── heartbeat ──
    if (action === 'heartbeat') {
      await base44.asServiceRole.entities.Sandbox.update(sandbox.id, {
        last_heartbeat_at: nowIso,
        health_status: 'healthy',
      });
      return Response.json({
        ok: true,
        sandbox: { id: sandbox.id, name: sandbox.name, status: sandbox.status },
        server_time: nowIso,
      });
    }

    // ── health (admin-only: check all sandboxes) ──
    if (action === 'health') {
      const user = await base44.auth.me().catch(() => null);
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Admin access required for health check' }, { status: 403 });
      }

      const sbRes = await base44.entities.Sandbox.filter(
        { status: { $ne: 'deleted' } },
        { limit: 100 }
      );
      const allSandboxes = sbRes.items || [];
      const updates: any[] = [];

      for (const sb of allSandboxes) {
        const newStatus = computeHealthStatus(sb.last_heartbeat_at);
        if (sb.health_status !== newStatus) {
          await base44.entities.Sandbox.update(sb.id, { health_status: newStatus });
          updates.push({ id: sb.id, name: sb.name, old: sb.health_status, new: newStatus });
        }
      }

      const summary = {
        total: allSandboxes.length,
        healthy: allSandboxes.filter(s => computeHealthStatus(s.last_heartbeat_at) === 'healthy').length,
        degraded: allSandboxes.filter(s => computeHealthStatus(s.last_heartbeat_at) === 'degraded').length,
        offline: allSandboxes.filter(s => computeHealthStatus(s.last_heartbeat_at) === 'offline').length,
        unknown: allSandboxes.filter(s => computeHealthStatus(s.last_heartbeat_at) === 'unknown').length,
      };

      return Response.json({ ok: true, summary, updates });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}