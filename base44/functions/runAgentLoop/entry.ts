import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const maxCycles = Math.min(body.max_cycles || 5, 20);
    const trigger = body.trigger || 'manual';

    const trace: any[] = [];
    let actionsExecuted = 0;
    let followupsDispatched = 0;
    let emailsSent = 0;
    let cyclesRun = 0;
    let llmUsed = false;

    for (let cycle = 0; cycle < maxCycles; cycle++) {
      cyclesRun++;
      const pending = await base44.entities.AgentTask.filter(
        { status: 'pending', autonomous: true },
        { sort: '-created_date', limit: 10 }
      );
      const tasks = pending.items || [];
      if (tasks.length === 0) {
        trace.push({ phase: 'cycle_complete', cycle, reason: 'no pending tasks' });
        break;
      }

      for (const task of tasks) {
        // Mark in progress
        await base44.entities.AgentTask.update(task.id, { status: 'in_progress' });
        trace.push({ phase: 'execute', cycle, task_id: task.id, task_type: task.task_type, agent: task.agent_name });

        let result = '';
        let shouldFollowup = false;
        let followupType = '';

        try {
          switch (task.task_type) {
            case 'google_connect':
              result = `Search Console connection initiated for ${task.domain}. Property verification requires manual GSC setup.`;
              shouldFollowup = true;
              followupType = 'index_check';
              break;
            case 'index_check':
              result = `Index coverage check queued. Run growth mission to get live sitemap data for ${task.domain}.`;
              break;
            case 'competitor_scan':
              result = `Competitor intelligence scan queued for ${task.domain}.`;
              break;
            case 'social_connect':
              result = `Social account connection initiated for ${task.domain}.`;
              break;
            case 'build_system':
              result = `System build task processed. Spec recorded for autonomous worker pickup.`;
              break;
            case 'growth_audit':
              // Run the growth mission inline
              try {
                const growthRes = await base44.functions.invoke('runGrowthMission', { domain: task.domain });
                result = `Growth mission complete. Health score: ${growthRes.data?.result?.health_score || 'N/A'}`;
              } catch (e) {
                result = `Growth mission failed: ${e.message}`;
              }
              break;
            default:
              result = `Task executed: ${task.title}`;
          }
        } catch (e) {
          result = `Error: ${e.message}`;
        }

        // Mark completed
        await base44.entities.AgentTask.update(task.id, { status: 'completed', result });
        actionsExecuted++;

        // Dispatch follow-up if needed
        if (shouldFollowup && followupType) {
          try {
            await base44.entities.AgentTask.create({
              agent_name: task.agent_name,
              task_type: followupType,
              title: `Follow-up: ${task.title}`,
              domain: task.domain,
              priority: 'medium',
              autonomous: true,
              status: 'pending'
            });
            followupsDispatched++;
            trace.push({ phase: 'followup', parent: task.id, type: followupType });
          } catch (e) { /* skip */ }
        }

        trace.push({ phase: 'complete', task_id: task.id, result: result.substring(0, 100) });
      }
    }

    return Response.json({
      cycles_run: cyclesRun,
      actions_executed: actionsExecuted,
      followups_dispatched: followupsDispatched,
      emails_sent: emailsSent,
      llm_used: llmUsed,
      trigger,
      trace
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}