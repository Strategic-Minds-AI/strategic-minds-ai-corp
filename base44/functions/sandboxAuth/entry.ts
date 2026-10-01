import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

function generateApiKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return 'sk_sbx_' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    // Extract API key from Authorization header
    const authHeader = req.headers.get('Authorization') || '';
    const apiKey = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!apiKey || !apiKey.startsWith('sk_sbx_')) {
      return Response.json({ error: 'Missing or invalid API key. Use Authorization: Bearer sk_sbx_...' }, { status: 401 });
    }

    // Look up sandbox by API key (service role — no user session needed)
    const sandboxRes = await base44.asServiceRole.entities.Sandbox.filter(
      { api_key: apiKey, status: 'active' },
      { limit: 1 }
    );
    const sandbox = sandboxRes.items?.[0];

    if (!sandbox) {
      return Response.json({ error: 'Invalid API key or sandbox not active' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'poll';

    // ACTION: poll — get pending tasks for this sandbox's agent
    if (action === 'poll') {
      const agentName = sandbox.agent_name || body.agent_name;
      if (!agentName) {
        return Response.json({ error: 'No agent assigned to this sandbox' }, { status: 400 });
      }

      const taskRes = await base44.asServiceRole.entities.AgentTask.filter(
        { agent_name: agentName, status: 'pending', autonomous: true },
        { sort: '-created_date', limit: 10 }
      );

      // Mark tasks as in_progress
      const tasks = taskRes.items || [];
      if (tasks.length > 0) {
        await base44.asServiceRole.entities.AgentTask.updateMany(
          { id: { $in: tasks.map(t => t.id) } },
          { $set: { status: 'in_progress' } }
        );
      }

      return Response.json({
        sandbox: { id: sandbox.id, name: sandbox.name, agent_name: agentName },
        tasks: tasks.map(t => ({
          id: t.id,
          task_type: t.task_type,
          title: t.title,
          description: t.description,
          priority: t.priority,
          domain: t.domain
        }))
      });
    }

    // ACTION: report — submit task execution result
    if (action === 'report') {
      const { task_id, status, result } = body;
      if (!task_id) {
        return Response.json({ error: 'task_id is required' }, { status: 400 });
      }

      const update: any = { status: status || 'completed' };
      if (result) update.result = typeof result === 'string' ? result : JSON.stringify(result);

      await base44.asServiceRole.entities.AgentTask.update(task_id, update);

      return Response.json({ ok: true, task_id, status: update.status });
    }

    // ACTION: heartbeat — sandbox worker checking in
    if (action === 'heartbeat') {
      return Response.json({
        ok: true,
        sandbox: { id: sandbox.id, name: sandbox.name, status: sandbox.status },
        server_time: new Date().toISOString()
      });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}