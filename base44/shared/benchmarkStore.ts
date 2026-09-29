import { verifyProof } from './benchmarkProof.ts';
import { catalogRevision, scoreEvidence, FRESHNESS_MS } from './benchmarkPolicy.ts';
export async function receiptReport(record, ownerId) {
  const revision = await catalogRevision();
  const integrity = record?.owner_id === ownerId && Array.isArray(record.observations) && record.observations.length <= 30 && record.revision === revision && await verifyProof(record);
  const age = record ? Date.now() - Date.parse(record.observed_at) : NaN;
  const fresh = !!integrity && Number.isFinite(age) && age >= 0 && age <= FRESHNESS_MS;
  return { ...scoreEvidence(integrity ? record.observations : [], fresh), integrity: integrity ? 'VALID_SIGNATURE' : record ? 'REJECTED' : 'NO_EVIDENCE', observed_at: integrity ? record.observed_at : null, run_id: integrity ? record.id : null, observations: integrity ? record.observations : [], signed_receipt: integrity ? record : null };
}
export async function readBenchmarkState(base44, ownerId) {
  const [runs, jobs] = await Promise.all([
    base44.asServiceRole.entities.BenchmarkRun.filter({ owner_id: ownerId }, '-created_date', 10),
    base44.asServiceRole.entities.EnhancementJob.filter({ owner_id: ownerId }, '-created_date', 31)
  ]);
  let latest = null; let rejected = 0;
  for (const record of runs) {
    const report = await receiptReport(record, ownerId);
    if (report.integrity === 'VALID_SIGNATURE') { latest = report; break; }
    rejected++;
  }
  return { report: latest || await receiptReport(null, ownerId), rejected_receipts: rejected, jobs_more: jobs.length > 30, jobs: jobs.slice(0, 30).map(job => ({ id: job.id, criterion_id: job.criterion_id, route: job.route, revision: job.revision, status: job.status, plan: job.plan || '', error: job.error || '', plan_started_at: job.plan_started_at || null, created_date: job.created_date })) };
}
export async function ownedJob(base44, ownerId, id) {
  if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{8,200}$/.test(id)) throw new Error('Invalid enhancement job.');
  const job = await base44.asServiceRole.entities.EnhancementJob.get(id);
  if (!job || job.owner_id !== ownerId) throw new Error('Enhancement job not available to your account.');
  return job;
}