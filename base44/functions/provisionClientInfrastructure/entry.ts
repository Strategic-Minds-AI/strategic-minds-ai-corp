import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';

async function providerResponse(response, provider) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${provider}: ${data.error?.message || data.message || data.error || `request failed (${response.status})`}`);
  return data;
}

async function railway(query, variables) {
  const response = await fetch('https://backboard.railway.com/graphql/v2', {
    method: 'POST',
    headers: { Authorization: `Bearer ${secrets.get('RAILWAY_API_TOKEN')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const data = await providerResponse(response, 'Railway');
  if (data.errors?.length) throw new Error(`Railway: ${data.errors[0].message}`);
  return data.data;
}

export default async function(req) {
  try {
    if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in required' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const body = await req.json();
    if (body.action === 'list') return Response.json({ items: await base44.entities.ClientInfrastructure.list('-created_date', 100) });
    if (body.action === 'create') {
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      const clientId = typeof body.clientId === 'string' ? body.clientId : '';
      if (name.length < 3 || name.length > 80 || !clientId) return Response.json({ error: 'Choose a client and enter a project name (3–80 characters).' }, { status: 400 });
      const client = await base44.entities.User.get(clientId);
      if (!client || client.role !== 'user') return Response.json({ error: 'Choose a registered client.' }, { status: 400 });
      const item = await base44.entities.ClientInfrastructure.create({ name, client_id: clientId });
      return Response.json({ item });
    }
    if (!['github', 'vercel', 'railway', 'railwayService'].includes(body.action) || typeof body.id !== 'string') return Response.json({ error: 'Invalid provisioning request.' }, { status: 400 });
    const item = await base44.entities.ClientInfrastructure.get(body.id);
    if (!item) return Response.json({ error: 'Client project not found.' }, { status: 404 });
    const slug = item.name.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90);
    if (!slug) return Response.json({ error: 'Project name must contain letters or numbers.' }, { status: 400 });
    let changes;
    if (body.action === 'github') {
      if (item.github_repo) return Response.json({ error: 'GitHub repository already created.' }, { status: 409 });
      const { accessToken } = await base44.asServiceRole.connectors.getConnection('github');
      const response = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28' },
        body: JSON.stringify({ name: slug, description: `Client project: ${item.name}`, private: true, auto_init: true }),
      });
      const repo = await providerResponse(response, 'GitHub');
      changes = { github_repo: repo.full_name, github_url: repo.html_url };
    } else if (body.action === 'vercel') {
      if (item.vercel_id) return Response.json({ error: 'Vercel project already created.' }, { status: 409 });
      if (!item.github_repo) return Response.json({ error: 'Create the GitHub repository first.' }, { status: 400 });
      const response = await fetch('https://api.vercel.com/v11/projects', {
        method: 'POST',
        headers: { Authorization: `Bearer ${secrets.get('VERCEL_API_TOKEN')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: slug, gitRepository: { type: 'github', repo: item.github_repo } }),
      });
      const project = await providerResponse(response, 'Vercel');
      changes = { vercel_id: project.id, vercel_url: 'https://vercel.com/dashboard' };
    } else if (body.action === 'railway') {
      if (item.railway_id) return Response.json({ error: 'Railway project already created.' }, { status: 409 });
      const workspaceId = typeof body.workspaceId === 'string' ? body.workspaceId.trim() : '';
      if (workspaceId && !/^[\w-]{6,100}$/.test(workspaceId)) return Response.json({ error: 'Invalid Railway workspace ID.' }, { status: 400 });
      const input = { name: item.name };
      if (workspaceId) input.workspaceId = workspaceId;
      const result = await railway('mutation projectCreate($input: ProjectCreateInput!) { projectCreate(input: $input) { id name } }', { input });
      changes = { railway_id: result.projectCreate.id, railway_url: `https://railway.com/project/${encodeURIComponent(result.projectCreate.id)}` };
    } else {
      if (!item.railway_id || !item.github_repo) return Response.json({ error: 'Create the GitHub repository and Railway project first.' }, { status: 400 });
      if (item.railway_service_id) return Response.json({ error: 'Railway service already connected.' }, { status: 409 });
      const result = await railway('mutation serviceCreate($input: ServiceCreateInput!) { serviceCreate(input: $input) { id name } }', { input: { projectId: item.railway_id, name: item.name, source: { repo: item.github_repo } } });
      changes = { railway_service_id: result.serviceCreate.id };
    }
    const updated = await base44.entities.ClientInfrastructure.update(item.id, changes);
    return Response.json({ item: updated });
  } catch (error) {
    console.error('Client provisioning failed:', error.message);
    return Response.json({ error: error.message || 'Provisioning failed.' }, { status: 500 });
  }
}