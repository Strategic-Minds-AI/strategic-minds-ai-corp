// Owned background maintenance: real actions and plans are reported separately.
import { createClientFromRequest } from '../../shared/ownedClient.ts';
import { criteria } from '../../shared/benchmarkCriteria.ts';
import { readBenchmarkState } from '../../shared/benchmarkStore.ts';
import { dispatchEvolutionTasks, executeEvolutionTask } from '../../shared/evolutionTasks.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const client = createClientFromRequest(req);
    const user = await client.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });
    const body = await req.json();
    const maxIterations = body.max_iterations ?? 5;
    const targetScore = body.target_score ?? 100;
    if (!Number.isInteger(maxIterations) || maxIterations < 1 || maxIterations > 10 || !Number.isFinite(targetScore) || targetScore < 0 || targetScore > 100) return Response.json({ error: 'Invalid iteration count or target score' }, { status: 400 });
    const initial = await readBenchmarkState(client, user.id);
    let state = initial;
    const evolutionLog = [];
    for (let iteration = 0; iteration < maxIterations; iteration++) {
      const incomplete = new Set(state.report.results.filter(result => !result.complete).map(result => result.criterion_id));
      const failing = criteria.filter(criterion => incomplete.has(criterion.id));
      if (!failing.length && state.report.release_approved) break;
      const dispatched = await dispatchEvolutionTasks(client, user.id, failing, iteration);
      const executed = await executeEvolutionTask(client, user.id);
      state = await readBenchmarkState(client, user.id);
      evolutionLog.push({ iteration: iteration + 1, score: state.report.feature_parity, dispatched, ...executed });
      // One bounded execution per scheduled request; continue in the next durable cycle.
      if (executed.count || !dispatched) break;
    }
    const currentScore = state.report.feature_parity;
    const trend = currentScore > initial.report.feature_parity ? 'improving' : currentScore < initial.report.feature_parity ? 'declining' : 'stable';
    await client.asServiceRole.entities.SystemHealthScore.create({ overall_score: currentScore, qa_pass_rate: state.report.check_coverage, phases_total: evolutionLog.length, phases_passed: evolutionLog.filter(cycle => cycle.completed > 0).length, trend, last_audited_at: new Date().toISOString(), active_remediation: 'Scheduled maintenance; generated plans are not certified implementations.' });
    return Response.json({ ok: !evolutionLog.some(cycle => cycle.failed > 0), iterations: evolutionLog.length, final_score: currentScore, target_score: targetScore, target_reached: state.report.release_approved && currentScore >= targetScore, evidence_fresh: state.report.evidence_fresh, trend, evolution_log: evolutionLog });
  } catch (error) {
    console.error('Evolution cycle failed', error.message);
    return Response.json({ error: error.message, evolution_log: [] }, { status: error.status || 500 });
  }
}