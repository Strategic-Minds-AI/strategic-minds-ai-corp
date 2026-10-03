import { createClientFromRequest } from '../../shared/ownedClient.ts';
import { signProof } from '../../shared/benchmarkProof.ts';
import { catalogRevision } from '../../shared/benchmarkPolicy.ts';
import { receiptReport, ownedJob } from '../../shared/benchmarkStore.ts';
import { reviewPlan } from '../../shared/benchmarkPolicy.ts';
import { validatorSelfChecks } from '../../shared/benchmarkSelfChecks.ts';

export default async function(req: Request): Promise<Response> {
  try {
    if (req.method !== 'POST') return Response.json({ error: 'Method not allowed.' }, { status: 405 });
    const base44 = createClientFromRequest(req);
    let user;
    try { user = await base44.auth.me(); } catch { return Response.json({ error: 'Admin sign-in required.' }, { status: 403 }); }
    if (!user || user.role !== 'admin') return Response.json({ error: 'Admin access required.' }, { status: 403 });
    const raw = await req.text();
    if (raw.length > 3000) return Response.json({ error: 'Request too large.' }, { status: 413 });
    const body = JSON.parse(raw);
    if (!body || Array.isArray(body) || !['run', 'selfcheck', 'reviewPlan'].includes(body.action) || Object.keys(body).some(key => !['action', 'jobId'].includes(key))) return Response.json({ error: 'Only validator actions are accepted. Caller-supplied scores or evidence are never accepted.' }, { status: 400 });
    if (body.action === 'selfcheck') return Response.json(await validatorSelfChecks(user.id), { headers: { 'Cache-Control': 'no-store' } });
    if (body.action === 'reviewPlan') {
      const job = await ownedJob(base44, user.id, body.jobId);
      return Response.json(reviewPlan(job.plan), { headers: { 'Cache-Control': 'no-store' } });
    }
    const { data } = await base44.functions.invoke('apexDiscovery', {});
    if (!Array.isArray(data?.capabilities)) throw new Error('Read collector returned no valid capability observations.');
    const allowed = new Set(['drive.read','gmail.read','contacts.read','calendar.read','github.read','supabase.read','analytics.read','search_console.read','vercel.read','railway.read','stripe.read','gateway.models']);
    const observations = data.capabilities.filter(item => allowed.has(item.capability_id)).map(item => {
      const age = Date.now() - Date.parse(item.last_verified_at);
      const passed = item.health_status === 'Connected' && item.validation_status === 'PASS_READ_PROBE_ONLY' && item.authentication_status === 'verified_for_this_read' && Number.isFinite(age) && age >= 0 && age < 120000;
      return { probe_id: item.capability_id, passed, detail: passed ? 'Provider returned a successful read response. No write, isolation, recovery or full feature equivalence is certified.' : typeof item.failure_reason === 'string' ? item.failure_reason.slice(0, 400) : 'Read not verified: missing authorization, timeout or provider rejection. No response contents or credentials retained.', verified_at: passed ? item.last_verified_at : new Date().toISOString() };
    });
    if (!observations.length) throw new Error('No allowlisted read observations returned.');
    const record = { owner_id: user.id, revision: await catalogRevision(), run_nonce: crypto.randomUUID(), observed_at: new Date().toISOString(), observations };
    const signature = await signProof(record);
    const saved = await base44.asServiceRole.entities.BenchmarkRun.create({ ...record, signature });
    return Response.json({ report: await receiptReport(saved, user.id), scope: 'Read observations only. All behavior, authorization, resilience and release checks without independent execution evidence remain NOT_TESTED.' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Benchmark validator failed:', error.message);
    return Response.json({ error: error.message || 'Validation could not complete; no pass awarded.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}