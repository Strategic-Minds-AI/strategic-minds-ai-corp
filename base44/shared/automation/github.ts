export const REPOSITORY = 'Strategic-Minds-AI/strategic-minds-corp-site';
export const INSTALL_BRANCH = 'benchmark/install-coding-system-v1';
export async function githubClient(base44) {
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('github');
  return async (path, method = 'GET', body) => {
    if (!path.startsWith('/repos/' + REPOSITORY + '/') && !path.startsWith('/organizations/Strategic-Minds-AI/settings/billing/')) throw new Error('Repository boundary rejected.');
    const response = await fetch('https://api.github.com' + path, { method, headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json', 'User-Agent': 'Strategic-Minds-Benchmark', 'X-GitHub-Api-Version': '2026-03-10', ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(20000) });
    const text = await response.text();
    if (!response.ok) { const error = new Error(`GitHub ${response.status}: ${text.slice(0, 300) || 'Request failed.'}`); error.status = response.status; throw error; }
    const data = text ? JSON.parse(text) : null;
    return data;
  };
}
export async function optional(get, path) { try { return await get(path); } catch (error) { if (error.status === 404) return null; throw error; } }
export async function verifyZeroCost(get) {
  let page = 1; let budget = null;
  do {
    const result = await get(`/organizations/Strategic-Minds-AI/settings/billing/budgets?per_page=100&page=${page++}`);
    budget = result.budgets?.find(item => item.budget_type === 'ProductPricing' && (item.budget_product_sku === 'actions' || item.budget_product_skus?.includes('actions')) && item.budget_scope === 'organization' && Number(item.budget_amount) === 0 && item.prevent_further_usage === true && (!item.expires_at || Date.parse(item.expires_at) > Date.now() + 86400000)) || budget;
    if (!result.has_next_page) break;
    if (page > 100) throw new Error('Budget pagination exceeded its safety bound.');
  } while (true);
  return { verified: !!budget, checked_at: new Date().toISOString(), budget_id: budget?.id || null, paid_execution_allowed: false, note: budget ? 'Organization-wide Actions budget is $0 with stop-usage enabled. Included quota can still run out; scheduling is not guaranteed.' : 'No applicable non-expiring $0 stop-usage Actions budget verified. Execution is blocked.' };
}
export async function findCandidateBranch(get) {
  for (let page = 1; page <= 20; page++) {
    const branches = await get(`/repos/${REPOSITORY}/branches?per_page=100&page=${page}`);
    const candidate = branches.find(item => item.name.startsWith('benchmark/candidate-'));
    if (candidate) return { branch: candidate.name, sha: candidate.commit.sha, url: `https://github.com/${REPOSITORY}/compare/main...${encodeURIComponent(candidate.name)}` };
    if (branches.length < 100) return null;
  }
  throw new Error('Candidate-branch pagination exceeded its safety bound.');
}
export async function findPendingDraft(get) {
  const runs = await optional(get, `/repos/${REPOSITORY}/actions/workflows/benchmark-coding.yml/runs?status=success&per_page=10`);
  for (const run of runs?.workflow_runs || []) {
    const result = await get(`/repos/${REPOSITORY}/actions/runs/${run.id}/artifacts?per_page=100`);
    if (result.artifacts.some(item => item.name === 'coding-candidate' && !item.expired)) return { run_id: run.id, url: run.html_url, publish_url: `https://github.com/${REPOSITORY}/actions/workflows/benchmark-publish.yml` };
  }
  return null;
}
export async function setVariable(get, name, value) {
  const root = `/repos/${REPOSITORY}/actions/variables`;
  const current = await optional(get, `${root}/${name}`);
  return get(current ? `${root}/${name}` : root, current ? 'PATCH' : 'POST', { name, value });
}