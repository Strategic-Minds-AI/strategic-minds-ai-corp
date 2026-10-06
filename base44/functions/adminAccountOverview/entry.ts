import { createClientFromRequest } from '../../shared/ownedClient.ts';
import { secrets } from '../../shared/runtimeSecrets.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in first.' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required.' }, { status: 403 });
    const { provider } = await req.json();
    let items: { id: string; name: string; detail?: string; url?: string }[] = [];
    if (provider === 'vercel') {
      const token = secrets.get('VERCEL_API_TOKEN');
      if (!token) return Response.json({ error: 'Your live server is missing its Vercel account token. Add VERCEL_API_TOKEN in the project’s Production environment settings, then redeploy.', code: 'VERCEL_ACCOUNT_NOT_CONFIGURED', setupUrl: secrets.get('VERCEL_ACCOUNT_SETTINGS_URL') || 'https://vercel.com/dashboard', requiredVariable: 'VERCEL_API_TOKEN' }, { status: 503 });
      const projectsUrl = new URL('https://api.vercel.com/v10/projects?limit=100');
      const teamId = secrets.get('VERCEL_TEAM_ID');
      if (teamId) projectsUrl.searchParams.set('teamId', teamId);
      const response = await fetch(projectsUrl, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Vercel request failed.');
      items = (data.projects || []).map((p: any) => ({ id: p.id, name: p.name, detail: p.framework || '', url: `https://vercel.com/dashboard` }));
    } else if (provider === 'supabase') {
      const { accessToken } = await base44.asServiceRole.connectors.getConnection('supabase');
      const response = await fetch('https://api.supabase.com/v1/projects', { headers: { Authorization: `Bearer ${accessToken}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Supabase request failed.');
      items = (Array.isArray(data) ? data : []).map((p: any) => ({ id: p.id, name: p.name, detail: p.region || '', url: `https://supabase.com/dashboard/project/${encodeURIComponent(p.id)}` }));
    } else if (provider === 'github') {
      const { accessToken } = await base44.asServiceRole.connectors.getConnection('github');
      const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator,organization_member', { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'StrategicMindsAI' } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'GitHub request failed.');
      items = (Array.isArray(data) ? data : []).map((p: any) => ({ id: String(p.id), name: p.full_name, detail: p.description || '', url: p.html_url }));
    } else if (provider === 'railway') {
      const token = secrets.get('RAILWAY_API_TOKEN');
      if (!token) return Response.json({ error: 'Railway is not connected.' }, { status: 503 });
      const response = await fetch('https://backboard.railway.com/graphql/v2', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query: 'query { projects { edges { node { id name description } } } }' }) });
      const data = await response.json();
      if (!response.ok || data.errors?.length) throw new Error(data.errors?.[0]?.message || 'Railway request failed.');
      items = (data.data?.projects?.edges || []).map((entry: any) => ({ id: entry.node.id, name: entry.node.name, detail: entry.node.description || '', url: `https://railway.com/project/${encodeURIComponent(entry.node.id)}` }));
    } else return Response.json({ error: 'Unsupported account.' }, { status: 400 });
    return Response.json({ provider, items });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Could not load account.' }, { status: 500 });
  }
}