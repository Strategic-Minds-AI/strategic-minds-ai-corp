import { createClientFromRequest } from '../../shared/ownedClient.ts';
import { getSupabaseUser } from '../../shared/supabaseAuth.ts';

const MAX_IDEAS = 25;

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await getSupabaseUser(req);
    if (!user) return Response.json({ error: 'Sign in first.' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required.' }, { status: 403 });

    let body: any = {};
    try { body = await req.json(); } catch {}
    const scan = body.scan === true;

    let accessToken: string;
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('github');
      accessToken = conn.accessToken;
    } catch {
      return Response.json({ error: 'GitHub not connected. Connect your GitHub account in the vault.' }, { status: 400 });
    }

    const resp = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100&type=owner', {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/vnd.github+json' }
    });
    if (!resp.ok) return Response.json({ error: `GitHub API error: ${resp.status}` }, { status: 502 });
    const repos = await resp.json();

    if (!scan) return Response.json({ connected: true, repoCount: repos.length });

    const ideas = [];
    const now = Date.now();
    for (const repo of repos) {
      if (ideas.length >= MAX_IDEAS) break;
      if (repo.archived) continue;
      const daysSinceUpdate = Math.floor((now - new Date(repo.updated_at).getTime()) / 86400000);

      if (daysSinceUpdate > 60) {
        ideas.push({ title: `Review stale repo: ${repo.name}`, description: `${repo.name} hasn't been updated in ${daysSinceUpdate} days. Review for deprecated dependencies, security patches, and ongoing relevance.`, category: 'infrastructure', source: 'github', source_ref: repo.full_name, impact_score: 5, effort_score: 4, risk_score: 2, rationale: `Last updated ${daysSinceUpdate} days ago.`, tags: ['stale', 'maintenance', repo.language].filter(Boolean) });
      }
      if (ideas.length >= MAX_IDEAS) break;
      if (!repo.description) {
        ideas.push({ title: `Add documentation to ${repo.name}`, description: `${repo.name} has no description. Add a clear README with setup, usage, and architecture overview to improve discoverability.`, category: 'content', source: 'github', source_ref: repo.full_name, impact_score: 6, effort_score: 2, risk_score: 1, rationale: 'No description found.', tags: ['documentation', 'readme'] });
      }
      if (ideas.length >= MAX_IDEAS) break;
      if (repo.open_issues_count > 5) {
        ideas.push({ title: `Triage ${repo.open_issues_count} open issues in ${repo.name}`, description: `${repo.name} has ${repo.open_issues_count} open issues. Triage, label, and address the oldest ones first to reduce backlog.`, category: 'bugfix', source: 'github', source_ref: repo.full_name, impact_score: 7, effort_score: 5, risk_score: 3, rationale: `${repo.open_issues_count} open issues.`, tags: ['issues', 'triage'] });
      }
      if (ideas.length >= MAX_IDEAS) break;
      if (repo.stargazers_count > 10) {
        ideas.push({ title: `Plan next features for ${repo.name} (${repo.stargazers_count} stars)`, description: `${repo.name} has ${repo.stargazers_count} stars. Analyze usage patterns and plan high-impact features to grow adoption.`, category: 'feature', source: 'github', source_ref: repo.full_name, impact_score: 8, effort_score: 7, risk_score: 4, rationale: `${repo.stargazers_count} stars.`, tags: ['feature', 'growth'] });
      }
      if (ideas.length >= MAX_IDEAS) break;
      if (!repo.license && !repo.private) {
        ideas.push({ title: `Add a license to ${repo.name}`, description: `${repo.name} is public but has no license. Add an appropriate open-source license to clarify usage rights.`, category: 'infrastructure', source: 'github', source_ref: repo.full_name, impact_score: 4, effort_score: 1, risk_score: 1, rationale: 'Public repo with no license.', tags: ['license', 'compliance'] });
      }
    }

    if (ideas.length > 0) await base44.entities.Idea.bulkCreate(ideas);
    return Response.json({ connected: true, repoCount: repos.length, ideasCreated: ideas.length });
  } catch (error) {
    return Response.json({ error: error.message || 'GitHub scan failed.' }, { status: 500 });
  }
}