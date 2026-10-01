import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { createRemoteJWKSet, jwtVerify } from 'npm:jose@6.1.0';
import { githubClient, REPOSITORY, optional, verifyZeroCost, setVariable } from '../../shared/automation/github.ts';
export default async function(req) {
  const headers = { 'Cache-Control': 'no-store' };
  try {
    if (req.method !== 'POST') return Response.json({ error: 'Method not allowed.' }, { status: 405, headers });
    const raw = await req.text();
    if (raw.length > 16000) return Response.json({ error: 'Request too large.' }, { status: 413, headers });
    let body; try { body = JSON.parse(raw); } catch { return Response.json({ error: 'Signed workflow identity required.' }, { status: 403, headers }); }
    if (!body || Array.isArray(body) || Object.keys(body).some(key => key !== 'token') || typeof body.token !== 'string' || body.token.length > 14000) return Response.json({ error: 'Signed workflow identity required.' }, { status: 403, headers });
    let claims;
    try {
      const keys = createRemoteJWKSet(new URL('https://token.actions.githubusercontent.com/.well-known/jwks'), { timeoutDuration: 5000 });
      const result = await jwtVerify(body.token, keys, { issuer: 'https://token.actions.githubusercontent.com', audience: 'https://strategic-ai-consulting.base44.app/functions/benchmarkCostRenewal', algorithms: ['RS256'], requiredClaims: ['exp', 'iat', 'nbf', 'sub'], maxTokenAge: '5m' });
      claims = result.payload;
    } catch { return Response.json({ error: 'Invalid or expired workflow identity.' }, { status: 403, headers }); }
    if (claims.repository !== REPOSITORY || claims.repository_id !== '1396772471' || claims.repository_owner_id !== '332008865' || claims.repository_visibility !== 'private' || claims.ref !== 'refs/heads/main' || !['repo:' + REPOSITORY + ':ref:refs/heads/main', 'repo:Strategic-Minds-AI@332008865/strategic-minds-ai-corp@1396772471:ref:refs/heads/main'].includes(claims.sub) || claims.workflow_ref !== REPOSITORY + '/.github/workflows/benchmark-coding.yml@refs/heads/main' || claims.runner_environment !== 'github-hosted' || !['schedule', 'workflow_dispatch'].includes(claims.event_name) || !/^[0-9]+$/.test(String(claims.run_id)) || !/^[0-9]+$/.test(String(claims.run_attempt)) || !/^[a-f0-9]{40}$/.test(String(claims.workflow_sha))) return Response.json({ error: 'Workflow identity outside approved scope.' }, { status: 403, headers });
    // This machine-only webhook authenticates GitHub's signed workload, not an app-user session.
    const get = await githubClient(createClientFromRequest(req)); const root = '/repos/' + REPOSITORY;
    const [run, main, flag] = await Promise.all([get(root + '/actions/runs/' + claims.run_id), get(root + '/git/ref/heads/main'), optional(get, root + '/actions/variables/BENCHMARK_AUTOMATION_ENABLED')]);
    if (flag?.value !== 'true' || run.status !== 'in_progress' || run.head_branch !== 'main' || run.path !== '.github/workflows/benchmark-coding.yml' || run.event !== claims.event_name || String(run.run_attempt) !== String(claims.run_attempt) || run.head_sha !== claims.workflow_sha || main.object.sha !== claims.workflow_sha) return Response.json({ error: 'Automation paused or workflow revision is stale.' }, { status: 403, headers });
    const protection = await verifyZeroCost(get);
    if (!protection.verified) return Response.json({ error: 'Fresh zero-cost protection could not be verified.' }, { status: 403, headers });
    // Renew evidence only. Never enable automation, change a budget, publish source or deploy.
    const expiresAt = new Date(Date.now() + 86400000).toISOString();
    await setVariable(get, 'BENCHMARK_ZERO_COST_BUDGET_ID', protection.budget_id);
    await setVariable(get, 'BENCHMARK_ZERO_COST_EXPIRES_AT', expiresAt);
    await setVariable(get, 'BENCHMARK_ZERO_COST_LAST_RUN', JSON.stringify({ run_id: String(claims.run_id), run_attempt: String(claims.run_attempt), workflow_sha: claims.workflow_sha, verified_at: protection.checked_at, expires_at: expiresAt, paid_execution_allowed: false }));
    return Response.json({ verified: true, expires_at: expiresAt, paid_execution_allowed: false, run_id: String(claims.run_id) }, { headers });
  } catch (error) {
    console.error('Cost renewal failed closed:', error.name);
    return Response.json({ error: 'Cost verification unavailable; execution remains blocked.' }, { status: 503, headers });
  }
}