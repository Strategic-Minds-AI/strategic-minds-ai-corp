export const policySource = String.raw`import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
export const sha256 = value => createHash('sha256').update(value).digest('hex');
export function allowed(file) { return typeof file === 'string' && /^(src\/(components|pages)\/|base44\/(shared|functions)\/)[A-Za-z0-9_./-]+\.(jsx?|tsx?)$/.test(file) && !file.split('/').some(part => part === '..' || part === '.' || part === '') && !/(^|\/)(automation|\.github|entities|agents|workflows|connectors|api|lib)(\/|$)|benchmark|vault|Auth|Login|Register|Password|ProtectedRoute|package|lock|\.env/i.test(file); }
export function requireReview(raw, expected, acknowledged) {
  if (acknowledged !== 'true' || !/^[a-f0-9]{64}$/.test(expected || '') || sha256(raw) !== expected) throw new Error('Exact-content security review approval required; no publication permitted.');
  const proposal = JSON.parse(raw);
  if (!/^[a-f0-9]{40}$/.test(proposal.source_sha) || proposal.status !== 'PROPOSED_NOT_VALIDATED' || proposal.parity_awarded !== 0 || proposal.line_gate_contract !== 'INDEPENDENT_LINE_GATE_V1' || !Number.isInteger(proposal.validated_materialized_lines) || proposal.validated_materialized_lines < 1 || proposal.validated_materialized_lines > 120 || !Array.isArray(proposal.changes) || !proposal.changes.length || proposal.changes.length > 3) throw new Error('Invalid reviewed proposal or missing line-level validation contract.');
  const paths = new Set();
  for (const change of proposal.changes) { if (!allowed(change.path) || paths.has(change.path) || !/^[a-f0-9]{64}$/.test(change.sha256 || '')) throw new Error('Protected, duplicate or invalid change.'); paths.add(change.path); }
  return proposal;
}
if (process.argv.includes('--verify-diff')) {
  const { BASELINE_SHA: baseline, CANDIDATE_SHA: candidate } = process.env;
  if (![baseline, candidate].every(value => /^[a-f0-9]{40}$/.test(value || ''))) throw new Error('Full immutable revisions required.');
  const git = (directory, ...args) => execFileSync('git', ['-C', directory, ...args], { encoding: 'utf8' }).trim();
  if (git('trusted', 'rev-parse', 'HEAD') !== baseline || git('candidate', 'rev-parse', 'HEAD') !== candidate) throw new Error('Revision identity mismatch.');
  git('candidate', 'merge-base', '--is-ancestor', baseline, candidate);
  if (baseline !== candidate) {
    const names = git('candidate', 'diff', '--name-only', '-z', baseline, candidate).split('\0').filter(Boolean);
    if (!names.length || names.length > 3 || names.some(file => !allowed(file))) throw new Error('Change exceeds reviewed source scope.');
    for (const file of names) if (!git('candidate', 'ls-tree', candidate, '--', file).startsWith('100644 blob ')) throw new Error('Deletion or non-regular source rejected.');
  }
}
`;
export const publishWorkflow = `name: Publish security-reviewed candidate
on:
  workflow_dispatch:
    inputs:
      source_run_id:
        description: Successful coding run containing the reviewed draft artifact
        required: true
        type: string
      proposal_sha256:
        description: Exact proposal SHA256 printed by that coding run
        required: true
        type: string
      security_reviewed:
        description: I reviewed every changed file and its line-gate evidence, including authorization and side effects
        required: true
        default: false
        type: boolean
permissions:
  contents: write
  actions: write
concurrency:
  group: benchmark-coding-cycle
  cancel-in-progress: false
jobs:
  publish:
    if: github.ref == 'refs/heads/main' && inputs.security_reviewed == true
    runs-on: ubuntu-24.04
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
        with:
          ref: main
          persist-credentials: false
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020
        with:
          node-version: '22.18.0'
      - uses: actions/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093
        with:
          name: coding-candidate
          run-id: \\RUNID
          github-token: \\TOKEN
          path: candidate
      - name: Verify exact content approval and publish review branch
        env:
          GH_TOKEN: \\TOKEN
          SOURCE_RUN_ID: \\RUNID
          APPROVED_PROPOSAL_SHA256: \\DIGEST
          SECURITY_REVIEWED: \\REVIEWED
        run: node automation/publish.mjs
`.replaceAll('\\RUNID', '${{ inputs.source_run_id }}').replaceAll('\\TOKEN', '${{ github.token }}').replaceAll('\\DIGEST', '${{ inputs.proposal_sha256 }}').replaceAll('\\REVIEWED', '${{ inputs.security_reviewed }}');