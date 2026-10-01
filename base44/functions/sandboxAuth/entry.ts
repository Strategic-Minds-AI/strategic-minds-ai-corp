import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const LEASE_DURATION_MS = 10 * 60 * 1000; // 10 minutes

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

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    // Extract API key from Authorization header
    const authHeader = req.headers.get('Authorization') || '';
    const rawApiKey = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!rawApiKey || !rawApiKey.startsWith('sk_sbx_')) {
      return Response.json({ error: 'Missing or invalid API key. Use Authorization: Bearer sk_sbx_...' }, { status: 401 });
    }

    // Hash the incoming key and look up sandbox by hash (never store raw key)
    const keyHash = await sha256(rawApiKey);
    const sandboxRes = await base44.asServiceRole.entities.Sandbox.filter(
      { api_key_hash: keyHash, status: 'active' },
      { limit: 1 }
    );
    const sandbox = sandboxRes.items?.[0];

    if (!sandbox) {
      return Response.json({ error: 'Invalid API key or sandbox not active' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'poll';
    const now = new Date();
    const nowIso = now.toISOString();

    // ACTION: poll — get pending tasks for this sandbox's agent, claim them with tokens
    if (action === 'poll') {
      const agentName = sandbox.agent_name || body.agent_name;
      if (!agentName) {
        return Response.json({ error: 'No agent assigned to this sandbox' }, { status: 400 });
      }

      // Find pending tasks OR tasks with expired leases (can be re-claimed)
      const taskRes = await base44.asServiceRole.entities.AgentTask.filter(
        { agent_name: agentName, autonomous: true, status: { $in: ['pending', 'in_progress'] } },
        { sort: '-created_date', limit: 10 }
      );

      const allTasks = taskRes.items || [];
      const leaseExpiry = new Date(now.getTime() + LEASE_DURATION_MS).toISOString();

      // Claim tasks: assign claim_token + sandbox ID + lease expiry
      const tasksToReturn = [];
      for (const task of allTasks) {
        // Skip tasks claimed by a different sandbox with a valid lease
        if (task.claimed_by_sandbox_id && task.claimed_by_sandbox_id !== sandbox.id && task.lease_expires_at) {
          const leaseStillValid = new Date(task.lease_expires_at) > now;
          if (leaseStillValid) continue;
        }

        const claimToken = generateToken();
        await base44.asServiceRole.entities.AgentTask.update(task.id, {
          status: 'in_progress',
          claim_token: claimToken,
          claimed_by_sandbox_id: sandbox.id,
          lease_expires_at: leaseExpiry
        });

        tasksToReturn.push({
          id: task.id,
          task_type: task.task_type,
          title: task.title,
          description: task.description,
          priority: task.priority,
          domain: task.domain,
          claim_token: claimToken,
          lease_expires_at: leaseExpiry
        });
      }

      return Response.json({
        sandbox: { id: sandbox.id, name: sandbox.name, agent_name: agentName },
        tasks: tasksToReturn
      });
    }

    // ACTION: report — submit task execution result (requires valid claim_token)
    if (action === 'report') {
      const { task_id, status, result, claim_token } = body;
      if (!task_id) {
        return Response.json({ error: 'task_id is required' }, { status: 400 });
      }
      if (!claim_token) {
        return Response.json({ error: 'claim_token is required to report task results' }, { status: 400 });
      }

      // Fetch the task and verify the claim
      const task = await base44.asServiceRole.entities.AgentTask.get(task_id);
      if (!task) {
        return Response.json({ error: 'Task not found' }, { status: 404 });
      }

      // Verify claim token matches
      if (task.claim_token !== claim_token) {
        return Response.json({ error: 'Invalid claim token for this task' }, { status: 403 });
      }

      // Verify this sandbox owns the claim
      if (task.claimed_by_sandbox_id !== sandbox.id) {
        return Response.json({ error: 'This task was not claimed by your sandbox' }, { status: 403 });
      }

      // Verify lease hasn't expired
      if (task.lease_expires_at && new Date(task.lease_expires_at) < now) {
        return Response.json({ error: 'Task lease has expired. Poll again to re-claim.' }, { status: 410 });
      }

      const update: any = { status: status || 'completed' };
      if (result) update.result = typeof result === 'string' ? result : JSON.stringify(result);
      // Clear the claim token after completion (one-time use)
      update.claim_token = '';
      update.lease_expires_at = '';

      await base44.asServiceRole.entities.AgentTask.update(task_id, update);

      return Response.json({ ok: true, task_id, status: update.status });
    }

    // ACTION: heartbeat — sandbox worker checking in
    if (action === 'heartbeat') {
      return Response.json({
        ok: true,
        sandbox: { id: sandbox.id, name: sandbox.name, status: sandbox.status },
        server_time: nowIso
      });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}