import { criteria } from './benchmarkCriteria.ts';
import { scoreEvidence, catalogRevision } from './benchmarkPolicy.ts';
import { signProof, verifyProof } from './benchmarkProof.ts';
export async function validatorSelfChecks(ownerId) {
  const empty = scoreEvidence([], true);
  const readProbes = criteria.filter(item => item.probe).map(item => ({ probe_id: item.probe, passed: true, detail: 'Controlled unit fixture — not provider evidence', verified_at: new Date().toISOString() }));
  const partial = scoreEvidence(readProbes, true);
  const duplicate = scoreEvidence([...readProbes, ...readProbes], true);
  const failed = scoreEvidence([...readProbes, { ...readProbes[0], passed: false }], true);
  const record = { owner_id: ownerId, revision: await catalogRevision(), run_nonce: crypto.randomUUID(), observed_at: new Date().toISOString(), observations: readProbes };
  record.signature = await signProof(record);
  const tests = [
    { name: 'Untested criteria remain in the denominator', passed: empty.total_checks === criteria.length * 4 && empty.feature_parity === 0 },
    { name: 'Successful reads cannot certify complete feature parity', passed: partial.passed === readProbes.length && partial.feature_parity === 0 && !partial.release_approved },
    { name: 'Duplicate evidence cannot inflate a score', passed: duplicate.passed === partial.passed },
    { name: 'Conflicting failed evidence overrides a successful read', passed: failed.passed === partial.passed - 1 && failed.failed === 1 },
    { name: 'Unknown or implementer-provided pass assertions receive no credit', passed: scoreEvidence([{ probe_id: 'invented', passed: true, release_approved: true }], true).passed === 0 },
    { name: 'Stale evidence receives zero credit', passed: scoreEvidence(readProbes, false).passed === 0 },
    { name: 'A correctly signed receipt verifies', passed: await verifyProof(record) },
    { name: 'Changing observations invalidates a signature', passed: !await verifyProof({ ...record, observations: [{ ...readProbes[0], passed: false }] }) },
    { name: 'Changing receipt owner invalidates a signature', passed: !await verifyProof({ ...record, owner_id: 'other-owner' }) },
    { name: 'Changing catalog revision invalidates a signature', passed: !await verifyProof({ ...record, revision: 'forged-revision' }) }
  ];
  return { kind: 'SCORING_CONTROL_UNIT_TESTS_ONLY', passed: tests.every(test => test.passed), tests, feature_parity_awarded: 0 };
}