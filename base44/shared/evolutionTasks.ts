import { callAIGateway } from './aiGateway.ts';
import { ASSISTANT_TOOLS, executeAssistantTool } from './adminAssistantTools.ts';

export async function dispatchEvolutionTasks(client, ownerId, failing, iteration) {
  const db = client.asServiceRole;
  let dispatched = 0;
  for (const criterion of failing) {
    if (dispatched >= 5) break;
    const title = `[Evolution] ${criterion.id}: ${criterion.name}`;
    const existing = await db.entities.AgentTask.filter({ created_by_id: ownerId, title, status: { $in: ['pending', 'in_progress', 'needs_approval'] } }, { limit: 1 });
    if (existing.items.length) continue;
    await db.entities.AgentTask.create({ agent_name: 'code_architect', task_type: 'enhance_system', title, description: JSON.stringify({ criterion_id: criterion.id, finding: criterion.finding, expectation: criterion.tests.map(test => test.expectation), iteration }), autonomous: true, priority: 'high', status: 'pending' });
    dispatched++;
  }
  return dispatched;
}

export async function executeEvolutionTask(client, ownerId) {
  const db = client.asServiceRole;
  const { items } = await db.entities.AgentTask.filter({ created_by_id: ownerId, status: 'pending', autonomous: true }, { sort: 'created_date', limit: 1 });
  const task = items[0];
  if (!task) return { count: 0, planned: 0, completed: 0, failed: 0 };
  const token = crypto.randomUUID();
  const claim = await db.entities.AgentTask.updateMany({ id: task.id, status: 'pending', autonomous: true }, { $set: { status: 'in_progress', claim_token: token, started_at: new Date().toISOString(), lease_expires_at: new Date(Date.now() + 10 * 60000).toISOString() } });
  if (!claim.updated) return { count: 0, planned: 0, completed: 0, failed: 0 };
  try {
    let result; let status = 'completed';
    if (['build_system', 'enhance_system', 'unblock_system', 'competitor_scan', 'content_optimize'].includes(task.task_type)) {
      const output = await callAIGateway({ prompt: `Produce an actionable implementation or research plan for this task. Do not claim changes were executed or facts were verified. Task: ${task.title}\nDetails: ${task.description || ''}\nDomain: ${task.domain || ''}`, jsonSchema: { type: 'object', properties: { approach: { type: 'string' }, steps: { type: 'array', items: { type: 'string' } }, blockers: { type: 'array', items: { type: 'string' } } }, required: ['approach', 'steps', 'blockers'] }, maxTokens: 1800 });
      result = { stage: 'plan_ready', implementation_verified: false, plan: output.json, next_action: 'Approve and execute through a configured code worker; no implementation has been completed.' }; status = 'needs_approval';
    } else if (task.task_type === 'growth_audit') {
      result = (await client.functions.invoke('runGrowthMission', { domain: task.domain })).data;
      if (result.error || result.ok === false) throw new Error(result.error || 'Growth audit failed');
    } else if (ASSISTANT_TOOLS.some(tool => tool.function.name === task.task_type)) {
      result = JSON.parse(await executeAssistantTool(db, task.task_type, JSON.parse(task.description || '{}')));
      if (result.error || result.success === false) throw new Error(result.error || 'Action failed');
    } else { status = 'needs_approval'; result = { stage: 'blocked', reason: `No configured executor for ${task.task_type}. No action was performed.` }; }
    await db.entities.AgentTask.updateMany({ id: task.id, status: 'in_progress', claim_token: token }, { $set: { status, result: JSON.stringify(result).slice(0, 12000), lease_expires_at: null, ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {}) } });
    return { count: 1, planned: status === 'needs_approval' ? 1 : 0, completed: status === 'completed' ? 1 : 0, failed: 0 };
  } catch (error) {
    await db.entities.AgentTask.updateMany({ id: task.id, status: 'in_progress', claim_token: token }, { $set: { status: 'failed', result: error.message, lease_expires_at: null } });
    return { count: 1, planned: 0, completed: 0, failed: 1, error: error.message };
  }
}