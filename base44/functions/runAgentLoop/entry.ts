import { createClientFromRequest } from '../../shared/ownedClient.ts';
import { callAIGateway } from '../../shared/aiGateway.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const maxCycles = body.max_cycles ?? 5;
    if (!Number.isSafeInteger(maxCycles) || maxCycles < 1 || maxCycles > 20) return Response.json({ error: 'Choose 1–20 execution cycles.' }, { status: 400 });
    if (body.task_ids !== undefined && (!Array.isArray(body.task_ids) || !body.task_ids.length || body.task_ids.length > 10 || body.task_ids.some(id => typeof id !== 'string' || !/^[A-Za-z0-9-]{8,100}$/.test(id)))) return Response.json({ error: 'Provide up to 10 valid task references.' }, { status: 400 });
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
        { status: 'pending', autonomous: true, ...(body.task_ids ? { id: { $in: body.task_ids } } : {}) },
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
        let taskStatus = 'completed';
        let shouldFollowup = false;
        let followupType = '';

        try {
          switch (task.task_type) {
            case 'google_connect':
              taskStatus = 'needs_approval';
              result = `No Search Console connection was executed for ${task.domain}. A configured connection and a real execution receipt are required.`;
              break;
            case 'index_check':
              taskStatus = 'needs_approval';
              result = `No live index coverage check was executed for ${task.domain}. Run the configured growth mission before marking this task complete.`;
              break;
            case 'competitor_scan':
              // LLM-powered competitor analysis via Vercel AI Gateway
              try {
                const aiResult = await callAIGateway({
                  model: 'anthropic/claude-sonnet-4-5',
                  system: 'You are a competitor intelligence analyst. Given a domain, produce a concise JSON analysis with "competitors" (array of 3 likely competitor domains), "gaps" (array of 2-3 opportunity areas), and "recommended_actions" (array of 2-3 actions).',
                  prompt: `Analyze competitor landscape for: ${task.domain}`,
                  jsonSchema: { type: 'object', properties: { competitors: { type: 'array', items: { type: 'string' } }, gaps: { type: 'array', items: { type: 'string' } }, recommended_actions: { type: 'array', items: { type: 'string' } } } },
                  temperature: 0.6,
                  maxTokens: 1000
                });
                result = `Competitor intelligence generated via AI Gateway: ${JSON.stringify(aiResult.json?.competitors || [])}. Gaps: ${JSON.stringify(aiResult.json?.gaps || [])}`;
                llmUsed = true;
              } catch (e) {
                taskStatus = 'failed';
                result = `Competitor intelligence failed for ${task.domain}: ${e.message}`;
              }
              break;
            case 'social_connect':
              taskStatus = 'needs_approval';
              result = `No social account connection was executed for ${task.domain}. Complete the provider authorization before marking this task complete.`;
              break;
            case 'build_system':
              taskStatus = 'needs_approval';
              result = 'No source repair or deployment was executed. This task requires a configured code worker and successful validation evidence.';
              break;
            case 'growth_audit':
              // Run the growth mission inline
              try {
                const growthRes = await base44.functions.invoke('runGrowthMission', { domain: task.domain });
                if (growthRes.data?.error || growthRes.data?.ok === false) throw new Error(growthRes.data.error || 'Growth mission reported failure');
                result = `Growth mission complete. Health score: ${growthRes.data?.result?.health_score ?? 'N/A'}`;
              } catch (e) {
                taskStatus = 'failed';
                result = `Growth mission failed: ${e.message}`;
              }
              break;
            case 'content_optimize':
              // LLM-powered content optimization via Vercel AI Gateway
              try {
                const aiResult = await callAIGateway({
                  model: 'anthropic/claude-sonnet-4-5',
                  system: 'You are a content optimization expert. Given a site description, produce a JSON content plan with "headline_suggestions" (array of 3 strings), "meta_description" (string), and "content_priorities" (array of 3 strings).',
                  prompt: `Create a content optimization plan for: ${task.title}`,
                  jsonSchema: { type: 'object', properties: { headline_suggestions: { type: 'array', items: { type: 'string' } }, meta_description: { type: 'string' }, content_priorities: { type: 'array', items: { type: 'string' } } } },
                  temperature: 0.7,
                  maxTokens: 1000
                });
                result = `Content plan generated via AI Gateway: ${aiResult.json?.headline_suggestions?.length || 0} headlines, meta description ready.`;
                llmUsed = true;
              } catch (e) {
                taskStatus = 'failed';
                result = `Content optimization failed: ${e.message}`;
              }
              break;
            default:
              taskStatus = 'needs_approval';
              result = `No executor is configured for task type ${task.task_type || 'general'}. ${task.title} has not been performed.`;
          }
        } catch (e) {
          taskStatus = 'failed';
          result = `Error: ${e.message}`;
        }

        await base44.entities.AgentTask.update(task.id, { status: taskStatus, result, ...(taskStatus === 'completed' || taskStatus === 'failed' ? { completed_at: new Date().toISOString() } : {}) });
        if (taskStatus === 'completed') actionsExecuted++;

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

        trace.push({ phase: taskStatus, task_id: task.id, result: result.substring(0, 100) });
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