import { criteria } from './benchmarkCriteria.ts';
import { catalogRevision } from './benchmarkPolicy.ts';
import { readBenchmarkState } from './benchmarkStore.ts';
const states = new Set(['not_started', 'in_progress', 'implementation_ready', 'blocked']);
export async function readContinuation(base44, ownerId) {
  const [records, revision] = await Promise.all([base44.asServiceRole.entities.BenchmarkCheckpoint.filter({ owner_id: ownerId }, '-created_date', 1), catalogRevision()]);
  const checkpoint = records[0] || null;
  const compatible = !!checkpoint && checkpoint.revision === revision;
  const items = new Map((compatible ? checkpoint.work_items : []).map(item => [item.criterion_id, item]));
  return { checkpoint, checkpoint_compatible: compatible, work_queue: criteria.map(criterion => ({ criterion_id: criterion.id, name: criterion.name, domain: criterion.domain, state: items.get(criterion.id)?.state || 'not_started', note: items.get(criterion.id)?.note || (checkpoint && !compatible ? 'Catalog changed; re-review the saved checkpoint before resuming.' : 'Awaiting implementation and independent validation.') })) };
}
export async function saveContinuation(base44, ownerId, body) {
  const text = (value, limit) => typeof value === 'string' && value.trim().length > 0 && value.length <= limit;
  const list = value => Array.isArray(value) && value.length <= 20 && value.every(item => text(item, 1000));
  const valid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.requestId || '') && text(body.summary, 1500) && text(body.nextBatch, 1500) && ['implemented','verification','blockers'].every(key => list(body[key]));
  const ids = new Set(criteria.map(item => item.id));
  const queueValid = Array.isArray(body.workItems) && body.workItems.length === criteria.length && body.workItems.every(item => item && Object.keys(item).every(key => ['criterion_id','state','note'].includes(key)) && ids.has(item.criterion_id) && states.has(item.state) && text(item.note, 500)) && new Set(body.workItems.map(item => item.criterion_id)).size === criteria.length;
  if (!valid || !queueValid) return { error: 'Provide a bounded checkpoint and exactly one progress entry for every agreed criterion.', status: 400 };
  const previous = await base44.asServiceRole.entities.BenchmarkCheckpoint.filter({ owner_id: ownerId, request_id: body.requestId }, '-created_date', 1);
  if (previous.length) return { checkpoint: previous[0], reused: true, awards_parity_credit: false };
  const { report } = await readBenchmarkState(base44, ownerId);
  const score_snapshot = Object.fromEntries(['feature_parity','check_coverage','passed','failed','not_tested','release_approved','evidence_fresh','run_id'].map(key => [key, report[key]]));
  const checkpoint = await base44.asServiceRole.entities.BenchmarkCheckpoint.create({ owner_id: ownerId, request_id: body.requestId, revision: await catalogRevision(), summary: body.summary.trim(), implemented: body.implemented, verification: body.verification, blockers: body.blockers, next_batch: body.nextBatch.trim(), work_items: body.workItems, score_snapshot });
  return { checkpoint, reused: false, awards_parity_credit: false };
}