import { createClientFromRequest } from '../../shared/ownedClient.ts';
import { callAIGateway } from '../../shared/aiGateway.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const goal = body.goal || 'Audit the system and dispatch follow-up tasks.';

    const trace: any[] = [];
    const stages: any = {};

    // Stage: agent_start
    stages.agent_start = { started: true, goal };
    trace.push({ stage: 'agent_start', goal });

    // Stage: inspectRegistry — read domains + tasks
    const [domainRes, taskRes] = await Promise.all([
      base44.entities.Domain.filter({}, { sort: '-created_date', limit: 50 }),
      base44.entities.AgentTask.filter({ status: 'pending' }, { sort: '-created_date', limit: 50 })
    ]);
    const domains = domainRes.items || [];
    const tasks = taskRes.items || [];
    stages.inspectRegistry = { domains: domains.length, pending_tasks: tasks.length };
    trace.push({ stage: 'inspectRegistry', domains: domains.length, tasks: tasks.length });

    // Stage: dispatchTask — create a task based on the goal
    let dispatchedTaskId = null;
    try {
      const task = await base44.entities.AgentTask.create({
        agent_name: 'orchestrator',
        task_type: 'growth_audit',
        title: `Meta Architect goal: ${goal.substring(0, 80)}`,
        description: goal,
        priority: 'high',
        autonomous: true,
        status: 'pending'
      });
      dispatchedTaskId = task.id;
      stages.dispatchTask = { task_id: task.id };
      trace.push({ stage: 'dispatchTask', task_id: task.id });
    } catch (e) {
      stages.dispatchTask = { error: e.message };
      trace.push({ stage: 'dispatchTask', error: e.message });
    }

    // Stage: runGrowthMission — run on the first domain if available
    let growthResult = null;
    if (domains.length > 0) {
      try {
        const res = await base44.functions.invoke('runGrowthMission', { domain: domains[0].domain });
        growthResult = res.data;
        stages.runGrowthMission = { domain: domains[0].domain, health: growthResult?.result?.health_score };
        stages.growthMissionResult = { health_score: growthResult?.result?.health_score, tasks: growthResult?.result?.tasks_created?.length || 0 };
        trace.push({ stage: 'runGrowthMission', domain: domains[0].domain, health: growthResult?.result?.health_score });
        trace.push({ stage: 'growthMissionResult', health: growthResult?.result?.health_score });
      } catch (e) {
        stages.runGrowthMission = { error: e.message };
        trace.push({ stage: 'runGrowthMission', error: e.message });
      }
    } else {
      stages.runGrowthMission = { skipped: 'no domains registered' };
      trace.push({ stage: 'runGrowthMission', skipped: true });
    }

    // Stage: webSearch — LLM insight via Vercel AI Gateway
    let webSearchResult = null;
    try {
      const aiResult = await callAIGateway({
        model: 'anthropic/claude-sonnet-4-5',
        system: 'You are a strategic AI architect for Strategic Minds AI. Analyze the given goal and system state, then produce a concise mission brief as JSON with two arrays: "brief" (3-5 bullet points of analysis) and "next_steps" (3-5 actionable next steps).',
        prompt: `Goal: ${goal}\n\nCurrent state: ${domains.length} domains registered, ${tasks.length} pending tasks. ${growthResult ? `Latest growth audit health score: ${growthResult.result.health_score}/100.` : 'No growth audit data yet.'}\n\nProduce a JSON object with "brief" and "next_steps" arrays.`,
        jsonSchema: { type: 'object', properties: { brief: { type: 'array', items: { type: 'string' } }, next_steps: { type: 'array', items: { type: 'string' } } } },
        temperature: 0.6,
        maxTokens: 1500
      });
      webSearchResult = aiResult.json || { brief: [aiResult.content], next_steps: [] };
      stages.webSearch = { completed: true, model: aiResult.model, gateway: 'vercel' };
      trace.push({ stage: 'webSearch', completed: true, gateway: 'vercel_ai_gateway' });
    } catch (e) {
      // Graceful degradation — AI Gateway error
      webSearchResult = {
        brief: [
          `Goal analyzed: ${goal.substring(0, 100)}`,
          `${domains.length} domains under management, ${tasks.length} tasks pending`,
          growthResult ? `Latest domain health score: ${growthResult.result.health_score}/100` : 'No growth audit data yet',
          `AI Gateway error: ${e.message}`,
          'Run the agent loop to execute pending autonomous tasks'
        ],
        next_steps: [
          'Register domains in the Domain Registry',
          'Run growth missions for each domain',
          'Execute the agent loop to process pending tasks',
          'Monitor the Analytics dashboard for live operations data'
        ]
      };
      stages.webSearch = { degraded: true, reason: e.message };
      trace.push({ stage: 'webSearch', degraded: true, error: e.message });
    }

    // Stage: finalize — submit mission brief
    stages.finalize = { brief_submitted: true };
    trace.push({ stage: 'finalize', brief: webSearchResult.brief?.length || 0, next_steps: webSearchResult.next_steps?.length || 0 });

    // Stage: agent_complete
    stages.agent_complete = { cycles: 1, tasks_dispatched: dispatchedTaskId ? 1 : 0 };
    trace.push({ stage: 'agent_complete' });

    return Response.json({
      stages,
      brief: webSearchResult.brief || [],
      next_steps: webSearchResult.next_steps || [],
      trace
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}