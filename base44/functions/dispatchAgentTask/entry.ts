import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'create';

    // Create a single task
    if (action === 'create') {
      const { agent_name, task_type, title, description, priority, domain, autonomous } = body;
      if (!agent_name || !title) {
        return Response.json({ error: 'agent_name and title are required' }, { status: 400 });
      }

      const task = await base44.entities.AgentTask.create({
        agent_name,
        task_type: task_type || 'general',
        title,
        description: description || '',
        priority: priority || 'medium',
        domain: domain || '',
        autonomous: autonomous !== undefined ? autonomous : false,
        status: 'pending',
      });

      return Response.json({ ok: true, task });
    }

    // Bulk create tasks
    if (action === 'bulk_create') {
      const { tasks } = body;
      if (!Array.isArray(tasks) || tasks.length === 0) {
        return Response.json({ error: 'tasks array is required' }, { status: 400 });
      }

      const records = tasks.map((t: any) => ({
        agent_name: t.agent_name,
        task_type: t.task_type || 'general',
        title: t.title,
        description: t.description || '',
        priority: t.priority || 'medium',
        domain: t.domain || '',
        autonomous: t.autonomous || false,
        status: 'pending',
      }));

      const created = await base44.entities.AgentTask.bulkCreate(records);
      return Response.json({ ok: true, created: created.length, tasks: created });
    }

    // List tasks with optional filters
    if (action === 'list') {
      const { agent_name, status, limit } = body;
      const query: any = {};
      if (agent_name) query.agent_name = agent_name;
      if (status) query.status = status;

      const res = await base44.entities.AgentTask.filter(query, {
        sort: '-created_date',
        limit: limit || 50,
      });
      return Response.json({ tasks: res.items || [] });
    }

    // Get task queue summary per agent
    if (action === 'queue_summary') {
      const res = await base44.entities.AgentTask.filter(
        { status: { $in: ['pending', 'in_progress'] } },
        { sort: '-created_date', limit: 500 }
      );
      const allTasks = res.items || [];
      const byAgent: Record<string, { pending: number; in_progress: number }> = {};
      for (const t of allTasks) {
        const key = t.agent_name || 'unassigned';
        if (!byAgent[key]) byAgent[key] = { pending: 0, in_progress: 0 };
        if (t.status === 'pending') byAgent[key].pending++;
        else if (t.status === 'in_progress') byAgent[key].in_progress++;
      }
      return Response.json({ queues: byAgent, total: allTasks.length });
    }

    // Cancel/delete a task
    if (action === 'cancel') {
      const { task_id } = body;
      if (!task_id) return Response.json({ error: 'task_id is required' }, { status: 400 });
      await base44.entities.AgentTask.delete(task_id);
      return Response.json({ ok: true, deleted: task_id });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}