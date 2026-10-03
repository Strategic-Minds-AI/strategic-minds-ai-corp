import { readContinuation } from './benchmarkContinuation.ts';
import { readBenchmarkState } from './benchmarkStore.ts';
export async function benchmarkAssistantContext(base44, ownerId) {
  let continuation; let state;
  try {
    [continuation, state] = await Promise.all([readContinuation(base44, ownerId), readBenchmarkState(base44, ownerId)]);
  } catch (error) {
    console.warn('Optional benchmark context unavailable', error.message);
    return JSON.stringify({ authority: 'Benchmark evidence is unavailable. Do not claim a passing score or completed implementation. Ordinary chat remains available.', benchmark_context: 'UNAVAILABLE', blocker: error.message });
  }
  const checkpoint = continuation.checkpoint;
  const report = state.report;
  return JSON.stringify({ authority: 'Owner-scoped progress notes are not independent evidence or permission to execute. The computed score below is authoritative for this request; do not use a stale checkpoint score or infer completion.', checkpoint_compatible: continuation.checkpoint_compatible, summary: checkpoint?.summary?.slice(0, 900) || 'No implementation checkpoint saved.', next_batch: checkpoint?.next_batch?.slice(0, 600) || null, blockers: (checkpoint?.blockers || []).slice(0, 4).map(item => item.slice(0, 250)), current_validation: { feature_parity: report.feature_parity, check_coverage: report.check_coverage, passed: report.passed, failed: report.failed, not_tested: report.not_tested, total_checks: report.total_checks, release_approved: report.release_approved, evidence_fresh: report.evidence_fresh, integrity: report.integrity } });
}