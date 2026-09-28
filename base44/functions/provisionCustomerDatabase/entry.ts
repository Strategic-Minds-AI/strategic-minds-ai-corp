import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  try {
    if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in required' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const body = await req.json();
    if (!['list', 'create'].includes(body.action)) return Response.json({ error: 'Invalid action' }, { status: 400 });
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('supabase');
    const headers = { Authorization: `Bearer ${accessToken}` };
    const orgResponse = await fetch('https://api.supabase.com/v1/organizations', { headers });
    if (!orgResponse.ok) throw new Error('Unable to access Supabase organizations');
    const organizations = (await orgResponse.json()).map(o => ({ name: o.name, slug: o.slug }));
    if (body.action === 'list') {
      const sites = await base44.entities.CustomerSite.list('-created_date', 100);
      return Response.json({ organizations, sites });
    }
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const clientId = typeof body.clientId === 'string' ? body.clientId : '';
    const org = organizations.find(o => o.slug === body.organizationSlug);
    if (name.length < 3 || name.length > 120 || !org || !clientId) return Response.json({ error: 'Choose a client and organization, and enter a site name.' }, { status: 400 });
    const client = await base44.entities.User.get(clientId);
    if (!client || client.role !== 'user') return Response.json({ error: 'Select a registered client.' }, { status: 400 });
    const dbPassword = crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '') + 'Aa1!';
    const created = await fetch('https://api.supabase.com/v1/projects', {
      method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, organization_slug: org.slug, db_pass: dbPassword }),
    });
    if (!created.ok) {
      const detail = await created.json().catch(() => ({}));
      console.error('Supabase project creation failed:', created.status, detail.message || detail.error || 'Unknown error');
      return Response.json({ error: detail.message || 'Supabase could not create this project.' }, { status: created.status });
    }
    const project = await created.json();
    const ref = project.ref || project.id;
    // Return the generated password once; never store it in a customer record.
    try {
      const site = await base44.entities.CustomerSite.create({ name, client_id: clientId, supabase_ref: ref, supabase_organization: org.slug });
      return Response.json({ site, db_password: dbPassword });
    } catch (saveError) {
      console.error('Supabase project created but site record could not be saved:', ref, saveError.message);
      return Response.json({ error: 'The Supabase project was created but could not be added to this portal. Save the project details shown here and contact support.', project_ref: ref, db_password: dbPassword }, { status: 500 });
    }
  } catch (error) {
    console.error('Customer database provisioning failed:', error.message);
    return Response.json({ error: error.message || 'Provisioning failed' }, { status: 500 });
  }
}