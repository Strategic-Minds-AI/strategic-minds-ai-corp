import { createClientFromRequest } from '../../shared/ownedClient.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const name = body.name || 'Batch Operation';
    const batchSize = Math.min(body.batch_size || 10, 100);
    const googleConnect = body.google_connect !== false;
    const socialConnect = body.social_connect !== false;
    const videoGenerate = body.video_generate === true;
    const contentOptimize = body.content_optimize !== false;
    const freeMode = body.free_mode !== false;

    // Create the batch record
    const batch = await base44.entities.BatchOperation.create({
      name,
      batch_size: batchSize,
      status: 'running',
      sites: batchSize,
      tasks_dispatched: 0,
      google_connect: googleConnect,
      social_connect: socialConnect,
      video_generate: videoGenerate,
      content_optimize: contentOptimize,
      free_mode: freeMode
    });

    // Build the task list for each site × each phase
    const phases: { agent: string; type: string; title: (n: number) => string; priority: string }[] = [];
    phases.push({ agent: 'replicator', type: 'build_system', title: (n) => `Build site ${n}`, priority: 'high' });
    if (googleConnect) phases.push({ agent: 'growth_operator', type: 'google_connect', title: (n) => `Google connect: site ${n}`, priority: 'medium' });
    if (socialConnect) phases.push({ agent: 'social_strategist', type: 'social_connect', title: (n) => `Social connect: site ${n}`, priority: 'medium' });
    if (videoGenerate) phases.push({ agent: 'social_strategist', type: 'video_generate', title: (n) => `Video: site ${n}`, priority: 'low' });
    if (contentOptimize) phases.push({ agent: 'brand_guardian', type: 'content_optimize', title: (n) => `Content optimize: site ${n}`, priority: 'medium' });

    // Bulk create all tasks
    const tasksToCreate: any[] = [];
    for (let i = 1; i <= batchSize; i++) {
      for (const phase of phases) {
        tasksToCreate.push({
          agent_name: phase.agent,
          task_type: phase.type,
          title: phase.title(i),
          priority: phase.priority,
          autonomous: true,
          status: 'pending'
        });
      }
    }

    let tasksDispatched = 0;
    // Create in chunks of 100 (bulkCreate limit)
    for (let i = 0; i < tasksToCreate.length; i += 100) {
      const chunk = tasksToCreate.slice(i, i + 100);
      try {
        await base44.entities.AgentTask.bulkCreate(chunk);
        tasksDispatched += chunk.length;
      } catch (e) { /* skip chunk */ }
    }

    // Update batch record
    await base44.entities.BatchOperation.update(batch.id, {
      status: 'complete',
      tasks_dispatched: tasksDispatched
    });

    return Response.json({
      batch_id: batch.id,
      sites: batchSize,
      tasks_dispatched: tasksDispatched,
      phases: phases.length,
      status: 'complete'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}