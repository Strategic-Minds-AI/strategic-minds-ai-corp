import { createClientFromRequest } from '../../shared/ownedClient.ts';
import { criteria } from '../../shared/benchmarkCriteria.ts';
import { sources, competitors, selectionPolicy, BENCHMARK_VERSION } from '../../shared/benchmarkSources.ts';
import { findings, sourceBaseline } from '../../shared/benchmarkAudit.ts';
import { readBenchmarkState } from '../../shared/benchmarkStore.ts';
import { prepareEnhancement, generateEnhancementPlan } from '../../shared/benchmarkEnhancements.ts';
import { implementationPrompt, workerContract } from '../../shared/benchmarkPrompts.ts';
import { readContinuation, saveContinuation } from '../../shared/benchmarkContinuation.ts';

export default async function(req: Request): Promise<Response> {
  try {
    if (req.method !== 'POST') return Response.json({ error: 'Method not allowed.' }, { status: 405 });
    const base44 = createClientFromRequest(req);
    let user;
    try { user = await base44.auth.me(); } catch { return Response.json({ error: 'Admin sign-in required.' }, { status: 403 }); }
    if (!user || user.role !== 'admin') return Response.json({ error: 'Admin access required.' }, { status: 403 });
    const raw = await req.text();
    if (raw.length > 24000) return Response.json({ error: 'Request too large.' }, { status: 413 });
    const body = JSON.parse(raw);
    if (raw.length > 4000 && body?.action !== 'saveCheckpoint') return Response.json({ error: 'Request too large.' }, { status: 413 });
    const fields = { info: [], catalog: [], roadmap: [], checkpoint: [], saveCheckpoint: ['requestId','summary','implemented','verification','blockers','nextBatch','workItems'], prepare: ['criterionId','route','requestId'], plan: ['jobId'], jobs: ['skip'], saveDrive: ['projectId','approved'] };
    if (!body || Array.isArray(body) || !Object.prototype.hasOwnProperty.call(fields, body.action) || Object.keys(body).some(key => key !== 'action' && !fields[body.action].includes(key))) return Response.json({ error: 'Invalid benchmark request.' }, { status: 400 });
    let result;
    if (body.action === 'info') result = { revision: BENCHMARK_VERSION, criteria: criteria.length, acceptance_checks: criteria.length * 4, findings: findings.length, competitors: competitors.map(item => ({ product: item.product, rank: item.rank })), scope: 'Audit, research, implementation briefs, draft planning and signed read-only evidence. No external coding worker, full Google reconciliation or autonomous swarm has been deployed.' };
    if (body.action === 'catalog') {
      const [state, continuation] = await Promise.all([readBenchmarkState(base44, user.id), readContinuation(base44, user.id)]);
      result = { revision: BENCHMARK_VERSION, criteria, sources, competitors, selection_policy: selectionPolicy, findings, source_baseline: sourceBaseline, ...state, ...continuation };
    }
    if (body.action === 'checkpoint') result = await readContinuation(base44, user.id);
    if (body.action === 'saveCheckpoint') {
      result = await saveContinuation(base44, user.id, body);
      if (result.error) return Response.json({ error: result.error }, { status: result.status });
    }
    if (body.action === 'roadmap') result = { revision: BENCHMARK_VERSION, selection_policy: selectionPolicy, sources, enhancements: criteria.map(criterion => ({ ...criterion, prompt: implementationPrompt(criterion), worker_contract: workerContract(criterion, null) })) };
    if (body.action === 'prepare') result = await prepareEnhancement(base44, user.id, body);
    if (body.action === 'plan') result = await generateEnhancementPlan(base44, user.id, body.jobId);
    if (body.action === 'jobs') {
      const skip = body.skip ?? 0;
      if (!Number.isSafeInteger(skip) || skip < 0) return Response.json({ error: 'Invalid record page.' }, { status: 400 });
      const page = await base44.asServiceRole.entities.EnhancementJob.filter({ owner_id: user.id }, '-created_date', 31, skip);
      result = { jobs: page.slice(0, 30).map(job => ({ id: job.id, criterion_id: job.criterion_id, route: job.route, revision: job.revision, status: job.status, plan: job.plan || '', error: job.error || '', plan_started_at: job.plan_started_at || null, created_date: job.created_date })), more: page.length > 30 };
    }
    if (body.action === 'saveDrive') {
      if (body.approved !== true || typeof body.projectId !== 'string' || !/^[A-Za-z0-9_-]{8,200}$/.test(body.projectId)) return Response.json({ error: 'Choose a project and explicitly approve saving its report.' }, { status: 403 });
      const state = await readBenchmarkState(base44, user.id);
      const content = `# Agency benchmark and audit\n\nRevision: ${BENCHMARK_VERSION}\nGenerated: ${new Date().toISOString()}\n\n${selectionPolicy}\n\nVerified feature parity: ${state.report.feature_parity}%\nAcceptance-check coverage: ${state.report.check_coverage}%\nRelease approved: ${state.report.release_approved}\nEvidence integrity: ${state.report.integrity}\nRead evidence fresh: ${state.report.evidence_fresh}\n\n## Open source findings\n\n${findings.map(item => `### ${item.id} · ${item.severity} · ${item.title}\n${item.evidence}\nImpact: ${item.impact}\nRemediation: ${item.remedy}\nSource: ${item.location}`).join('\n\n')}\n\n## Acceptance status\n\n${state.report.results.map(item => `### ${item.name}\n${item.tests.map(test => `- ${test.status} · ${test.kind}: ${test.expectation}`).join('\n')}`).join('\n\n')}\n\n## Sources\n${sources.map(source => `- ${source.publisher}: ${source.title} — ${source.url}`).join('\n')}\n\nThis is a dated source audit and limited read-only verification, not a production-parity certification.`;
      const saved = await base44.functions.invoke('agencyDriveIngest', { action: 'saveProjectText', projectId: body.projectId, name: `Benchmark-audit-${new Date().toISOString().replace(/[:.]/g, '-')}.md`, content, approved: true });
      if (!saved.data?.file?.id) throw new Error('Drive did not return a saved report receipt.');
      result = { file: saved.data.file, saved: true };
    }
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Benchmark operation failed:', error.message);
    return Response.json({ error: error.message || 'Benchmark operation did not complete.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}