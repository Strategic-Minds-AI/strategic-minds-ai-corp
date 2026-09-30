import { Buffer } from 'node:buffer';
import { criteria } from '../benchmarkCriteria.ts';
import { catalogRevision } from '../benchmarkPolicy.ts';
import { implementationPrompt } from '../benchmarkPrompts.ts';
import { codingWorkflow, validatorWorkflow } from './workflowTemplate.ts';
import { workerSource, publisherSource } from './workerTemplate.ts';
import { validatorSource, loaderSource } from './validatorTemplate.ts';
import { finalizerSource } from './finalizerTemplate.ts';
import { REPOSITORY, INSTALL_BRANCH, optional, verifyZeroCost, setVariable, findCandidateBranch } from './github.ts';
const root = `/repos/${REPOSITORY}`;
export async function automationStatus(get) {
  const [zeroCost, installed, flag, expiry, pulls, runs, candidate] = await Promise.all([
    verifyZeroCost(get), optional(get, `${root}/contents/.github/workflows/benchmark-coding.yml?ref=main`), optional(get, `${root}/actions/variables/BENCHMARK_AUTOMATION_ENABLED`), optional(get, `${root}/actions/variables/BENCHMARK_ZERO_COST_EXPIRES_AT`), get(`${root}/pulls?state=open&head=${encodeURIComponent('Strategic-Minds-AI:' + INSTALL_BRANCH)}&per_page=100`), get(`${root}/actions/runs?per_page=30`), findCandidateBranch(get)
  ]);
  const enabled = !!installed && flag?.value === 'true' && zeroCost.verified && Date.parse(expiry?.value) > Date.now();
  const latest = runs.workflow_runs?.find(run => run.path === '.github/workflows/benchmark-validator.yml');
  const blockers = [];
  if (!installed) blockers.push('Installation must be reviewed and merged before the scheduled coding workflow can run on the default branch.');
  if (!zeroCost.verified) blockers.push(zeroCost.note);
  if (installed && !enabled) blockers.push('Coding is paused. Enabling requires explicit approval and renews zero-cost verification for 24 hours; at most six scheduled attempts per day.');
  blockers.push('Offline CI cannot verify deployed authorization, browser continuity, Google mutations or rollback. Those 236 acceptance checks retain their existing evidence status.');
  if (candidate) blockers.push('An isolated candidate is awaiting review. The worker will not create another until this branch is reviewed and deleted.');
  return { repository: REPOSITORY, candidate, installed: !!installed, enabled, state: enabled ? candidate ? 'Waiting for candidate review' : 'Review-only coding cycle enabled' : installed ? 'Installed; coding paused' : pulls[0] ? 'Installation awaiting review' : 'Not installed', zero_cost: zeroCost, review_url: pulls[0]?.html_url || null, actions_url: `https://github.com/${REPOSITORY}/actions`, blockers, latest_run: latest ? { id: latest.id, status: latest.status, conclusion: latest.conclusion, sha: latest.head_sha, url: latest.html_url } : null, parity_awarded: 0 };
}
export async function installAutomation(get) {
  const protection = await verifyZeroCost(get);
  if (!protection.verified) throw new Error(protection.note);
  const branch = await optional(get, `${root}/git/ref/heads/${INSTALL_BRANCH}`);
  const pulls = await get(`${root}/pulls?state=open&head=${encodeURIComponent('Strategic-Minds-AI:' + INSTALL_BRANCH)}&per_page=100`);
  {
    const base = branch || await get(`${root}/git/ref/heads/main`); const parent = await get(`${root}/git/commits/${base.object.sha}`);
    const previousFile = branch ? await optional(get, `${root}/contents/automation/manifest.json?ref=${encodeURIComponent(INSTALL_BRANCH)}`) : null;
    const previousManifest = previousFile ? JSON.parse(Buffer.from(previousFile.content, 'base64').toString('utf8')) : null;
    const manifest = { schema_version: 1, catalog_revision: await catalogRevision(), source_sha: previousManifest?.source_sha || base.object.sha, criteria: criteria.map(item => ({ id: item.id, domain: item.domain, name: item.name, tests: item.tests, prompt: implementationPrompt(item) })), policy: { no_paid_execution: true, no_paid_model_api: true, max_changes_per_cycle: 3, max_cycles_per_day: 6, automatic_merge: false, automatic_deployment: false, self_grading: false, missing_evidence_earns_zero: true } };
    const files = { '.github/workflows/benchmark-coding.yml': codingWorkflow, '.github/workflows/benchmark-validator.yml': validatorWorkflow, 'automation/manifest.json': JSON.stringify(manifest, null, 2), 'automation/worker.mjs': workerSource, 'automation/publish.mjs': publisherSource, 'automation/validator.mjs': validatorSource, 'automation/runtime-loader.mjs': loaderSource, 'automation/finalize.mjs': finalizerSource, 'automation/README.md': '# Review-only benchmark coding system\n\nLocal CPU inference using Ollama v0.35.0 with a verified release checksum and qwen2.5-coder:1.5b with a pinned manifest digest; no paid AI endpoint. A pinned software version and seeded, zero-temperature inference reduce variability but do not guarantee deterministic or correct model output.\n\nThe five-minute GitHub schedule is best-effort, with one change under review, six daily attempts and a 24-hour cost verification expiry. The organization $0 Actions stop-usage budget blocks paid execution; included minutes and artifact storage may be exhausted. Never increase it automatically.\n\nEnable only from the authenticated admin benchmark panel after this installation is reviewed and merged. Protected benchmark, auth, security, credential and automation files are outside the coding worker write scope. No automatic merge, deployment, notification, provider mutation or permissions change. Failed, incomplete or oversized model output is rejected.\n\nSeparate CI uses the immutable ancestor validator, verifies exact commit identities, parses backend modules, resolves relative backend imports, runs offline regression assertions and compiles the frontend without production secrets. Its report deliberately awards zero full benchmark parity: it does not certify deployed runtime behavior. Artifact retention is one day; keep raw independent evidence elsewhere before claiming release validation.\n\nRollback: pause through the admin panel, close candidate drafts, and revert the installation commit after review. Production changes require explicit separate merge/deployment approval.\n' };
    const tree = await get(`${root}/git/trees`, 'POST', { base_tree: parent.tree.sha, tree: Object.entries(files).map(([path, content]) => ({ path, mode: '100644', type: 'blob', content })) });
    if (tree.sha !== parent.tree.sha) {
      const commit = await get(`${root}/git/commits`, 'POST', { message: 'benchmark: install bounded local coding worker and separate offline CI for review', tree: tree.sha, parents: [parent.sha] });
      await setVariable(get, 'BENCHMARK_AUTOMATION_ENABLED', 'false');
      await setVariable(get, 'BENCHMARK_ZERO_COST_BUDGET_ID', protection.budget_id);
      await setVariable(get, 'BENCHMARK_ZERO_COST_EXPIRES_AT', new Date(Date.now() + 86400000).toISOString());
      if (branch) await get(`${root}/git/refs/heads/${INSTALL_BRANCH}`, 'PATCH', { sha: commit.sha, force: false });
      else await get(`${root}/git/refs`, 'POST', { ref: `refs/heads/${INSTALL_BRANCH}`, sha: commit.sha });
    }
  }
  if (pulls[0]) return automationStatus(get);
  await get(`${root}/pulls`, 'POST', { title: 'Install benchmark coding worker and independent offline CI', head: INSTALL_BRANCH, base: 'main', body: 'Review-only installation. The coding schedule stays OFF until this is merged and explicitly enabled in the admin benchmark panel.\n\nUses local CPU inference (no paid AI API), a verified organization-wide $0 Actions stop-usage budget, one draft at a time, six daily attempts, and 24-hour cost-verification expiry. No automatic merging, deployment or protected mutations. Candidate branches have comparison links; Actions pull-request creation/approval permissions are not expanded.\n\nThe separate validator pins candidate and trusted baseline commits, runs regression assertions and builds the frontend. All 236 full end-to-end acceptance checks remain unverified unless separate trusted runtime evidence exists. Offline CI does not award benchmark parity.\n\nRollback: close this PR/delete its branch; production is unchanged. After merge, pause and revert the installation commit through review.' });
  return automationStatus(get);
}
export async function controlAutomation(get, action) {
  if (action === 'pause') { await setVariable(get, 'BENCHMARK_AUTOMATION_ENABLED', 'false'); return automationStatus(get); }
  const state = await automationStatus(get);
  if (!state.installed) { const error = new Error('Review and merge the installation first; no direct mutation of main is permitted.'); error.status = 409; throw error; }
  if (!state.zero_cost.verified) throw new Error(state.zero_cost.note);
  if (action === 'enable') {
    await setVariable(get, 'BENCHMARK_ZERO_COST_BUDGET_ID', state.zero_cost.budget_id);
    await setVariable(get, 'BENCHMARK_ZERO_COST_EXPIRES_AT', new Date(Date.now() + 86400000).toISOString());
    await setVariable(get, 'BENCHMARK_AUTOMATION_ENABLED', 'true');
  } else {
    if (!state.enabled) throw new Error('Explicitly enable the review-only cycle first.');
    await get(`${root}/actions/workflows/benchmark-coding.yml/dispatches`, 'POST', { ref: 'main', inputs: { criterion_id: 'agents.context' } });
  }
  return automationStatus(get);
}