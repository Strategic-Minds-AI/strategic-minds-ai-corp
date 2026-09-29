import { criteria } from './benchmarkCriteria.ts';
import { sources, BENCHMARK_VERSION } from './benchmarkSources.ts';
import { sourceBaseline } from './benchmarkAudit.ts';
import { digest } from './benchmarkProof.ts';
export async function catalogRevision() { return `${BENCHMARK_VERSION}:${await digest({ criteria, sources, sourceBaseline })}`; }
export const FRESHNESS_MS = 15 * 60 * 1000;
export function scoreEvidence(observations, evidenceFresh = false) {
  const byProbe = new Map();
  for (const item of observations || []) {
    if (!item || typeof item.probe_id !== 'string') continue;
    const existing = byProbe.get(item.probe_id);
    byProbe.set(item.probe_id, existing?.passed === false ? existing : item);
  }
  const results = criteria.map(criterion => {
    const observation = criterion.probe ? byProbe.get(criterion.probe) : null;
    const tests = criterion.tests.map(test => ({ ...test, status: test.kind === 'functional' && criterion.probe && evidenceFresh && observation ? observation.passed === true ? 'PASS' : 'FAIL' : 'NOT_TESTED', evidence: test.kind === 'functional' && observation ? observation.detail : 'No trusted independent execution evidence for this check.' }));
    return { criterion_id: criterion.id, domain: criterion.domain, name: criterion.name, tests, complete: tests.every(test => test.status === 'PASS') };
  });
  const checks = results.flatMap(result => result.tests);
  const passed = checks.filter(test => test.status === 'PASS').length;
  const failed = checks.filter(test => test.status === 'FAIL').length;
  const complete = results.filter(result => result.complete).length;
  return { feature_parity: Math.floor(100 * complete / criteria.length), check_coverage: Math.floor(1000 * passed / checks.length) / 10, passed, failed, not_tested: checks.length - passed - failed, total_checks: checks.length, complete_features: complete, total_features: criteria.length, release_approved: complete === criteria.length && failed === 0 && evidenceFresh, evidence_fresh: evidenceFresh, results };
}
export function reviewPlan(plan) {
  const headings = ['Evidence', 'Implementation', 'Google synchronization', 'Tests', 'Rollback', 'Blockers'];
  const checks = headings.map(heading => ({ name: `${heading} section`, passed: new RegExp(`^#{1,3}\\s+${heading}\\s*$`, 'im').test(plan || '') }));
  return { kind: 'Document completeness only — not implementation or runtime validation', checks, complete: checks.every(check => check.passed), awards_parity_credit: false };
}