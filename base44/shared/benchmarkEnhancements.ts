import { criteria } from './benchmarkCriteria.ts';
import { implementationPrompt, workerContract } from './benchmarkPrompts.ts';
import { catalogRevision } from './benchmarkPolicy.ts';
import { ownedJob } from './benchmarkStore.ts';
export async function prepareEnhancement(base44, ownerId, body) {
  const criterion = criteria.find(item => item.id === body.criterionId);
  if (!criterion || !['builder','admin','worker'].includes(body.route) || typeof body.requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.requestId)) throw new Error('Choose a valid criterion, execution route and request identity.');
  const revision = await catalogRevision();
  const existing = await base44.asServiceRole.entities.EnhancementJob.filter({ owner_id: ownerId, request_id: body.requestId }, '-created_date', 1);
  if (existing[0] && (existing[0].criterion_id !== criterion.id || existing[0].route !== body.route || existing[0].revision !== revision)) throw new Error('Request identity belongs to a different enhancement.');
  const job = existing[0] || await base44.asServiceRole.entities.EnhancementJob.create({ owner_id: ownerId, criterion_id: criterion.id, route: body.route, request_id: body.requestId, revision, status: 'brief_ready' });
  return { job, prompt: implementationPrompt(criterion), contract: workerContract(criterion, job) };
}
export async function generateEnhancementPlan(base44, ownerId, jobId) {
  const job = await ownedJob(base44, ownerId, jobId);
  const criterion = criteria.find(item => item.id === job.criterion_id);
  if (!criterion || job.route !== 'admin' || job.revision !== await catalogRevision()) throw new Error('This job is not a current admin-plan request.');
  if (job.status === 'plan_ready') return { job, already_prepared: true };
  if (job.status === 'planning' && Date.now() - Date.parse(job.plan_started_at) < 180000) throw new Error('This plan is already being prepared; no duplicate AI request was sent.');
  const started = new Date().toISOString();
  const claimQuery = { id: job.id, owner_id: ownerId, status: job.status, ...(job.status === 'planning' ? { plan_started_at: job.plan_started_at } : {}) };
  const claimed = await base44.asServiceRole.entities.EnhancementJob.updateMany(claimQuery, { $set: { status: 'planning', plan_started_at: started, error: '' } });
  if (claimed.updated !== 1) throw new Error('Another request claimed this plan; no duplicate AI request was sent.');
  try {
    const prompt = `PLAN ONLY. Produce a concise implementation plan under 600 words and 5,000 characters, not full code. Cover the whole brief without repetition. No execution, changes, deployment or successful tests may be claimed. Use EXACT Markdown headings: ## Evidence, ## Implementation, ## Google synchronization, ## Tests, ## Rollback, ## Blockers.\n\n${implementationPrompt(criterion).slice(0, 3600)}`;
    const { data } = await base44.functions.invoke('adminAssistant', { executionMode: 'plan', maxOutputTokens: 4096, messages: [{ role: 'user', content: prompt }] });
    if (typeof data?.reply !== 'string' || !data.reply.trim()) throw new Error('The assistant returned no implementation plan.');
    if (data.reply.length > 16000) throw new Error('The plan exceeded its storage limit; no truncated plan was saved.');
    const saved = await base44.asServiceRole.entities.EnhancementJob.updateMany({ id: job.id, owner_id: ownerId, status: 'planning', plan_started_at: started }, { $set: { status: 'plan_ready', plan: data.reply } });
    if (saved.updated !== 1) throw new Error('Plan lease changed; stale output was not committed.');
    return { job: await ownedJob(base44, ownerId, job.id), execution_performed: false };
  } catch (error) {
    await base44.asServiceRole.entities.EnhancementJob.updateMany({ id: job.id, owner_id: ownerId, status: 'planning', plan_started_at: started }, { $set: { status: 'plan_failed', error: String(error.message || 'Plan generation failed.').slice(0, 400) } });
    throw error;
  }
}