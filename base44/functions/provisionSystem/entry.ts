import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import {
  slugify, railway, godaddyHeaders,
  createGitHubRepo, pushFilesToGitHub,
  createVercelProject, getVercelDeployments, addVercelDomain, setVercelEnvVars,
  listSupabaseOrgs, createSupabaseProject,
  generateStaticFiles, generateBackendFiles, generateViteFiles, resolveFiles
} from '../../shared/provisioning.ts';

// ═══════════════════════════════════════════════════════════════════
// provisionSystem — Unified corporate infrastructure orchestrator
//
// Provisions a full system stack from one call:
//   GitHub repo → Vercel project → Railway service → Supabase DB →
//   GoDaddy domain → Vercel env vars
//
// Every action records into the ClientInfrastructure entity so the
// admin can track every provisioned system from the command center.
// ═══════════════════════════════════════════════════════════════════

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'list';

    switch (action) {
      case 'provision': return await provision(svc, body, user);
      case 'github': return await provisionGithub(svc, body);
      case 'vercel': return await provisionVercel(svc, body);
      case 'railway': return await provisionRailway(svc, body);
      case 'supabase': return await provisionSupabase(svc, body);
      case 'domain_check': return await domainCheck(body);
      case 'domain_configure': return await domainConfigure(svc, body);
      case 'envVars': return await setEnvVars(svc, body);
      case 'list': return await listSystems(svc, body);
      case 'get': return await getSystem(svc, body);
      case 'dashboard': return await dashboard(svc);
      case 'update': return await updateSystem(svc, body);
      case 'delete': return await deleteSystem(svc, body);
      default: return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error('provisionSystem error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════
// FULL ORCHESTRATION — provision an entire system stack in one call
// ═══════════════════════════════════════════════════════════════════
async function provision(svc: any, body: any, user: any) {
  const { name, stack_type, needs_vercel, needs_railway, needs_supabase, needs_domain, domain, env_vars, supabase_region, client_id } = body;
  if (!name) return Response.json({ error: 'name required' }, { status: 400 });

  const slug = slugify(name);
  const clientId = client_id || user.id;
  const capabilities: string[] = [];
  if (needs_vercel !== false && stack_type !== 'backend_api') capabilities.push('code');
  if (needs_supabase) capabilities.push('data');
  if (!capabilities.length) capabilities.push('code');

  let record = await svc.entities.ClientInfrastructure.create({
    name,
    client_id: clientId,
    capabilities,
    stack_type: stack_type || 'static_site',
    domain: domain || '',
    domain_status: 'pending',
    provision_status: 'pending',
    env_vars: env_vars ? JSON.stringify(Object.keys(env_vars)) : '[]',
    description: body.description || `Provisioned system — ${stack_type || 'static_site'}`,
  });

  const log: string[] = [];
  const update = async (changes: any) => { record = await svc.entities.ClientInfrastructure.update(record.id, changes); };

  try {
    // 1. GitHub repo + files
    log.push('Creating GitHub repository…');
    const { accessToken: ghToken } = await svc.connectors.getConnection('github');
    const repo = await createGitHubRepo(ghToken, slug, `Provisioned by Strategic Minds AI — ${name}`);
    const owner = repo.owner.login;
    const branch = repo.default_branch || 'main';
    const files = resolveFiles(body, name);
    await pushFilesToGitHub(ghToken, owner, repo.name, branch, files);
    await update({ github_repo: repo.full_name, github_url: repo.html_url, provision_status: 'github_ready' });
    log.push(`GitHub ready: ${repo.html_url}`);

    // 2. Vercel project (skip for backend-only)
    if (needs_vercel !== false && stack_type !== 'backend_api') {
      log.push('Creating Vercel project…');
      const vercelProject = await createVercelProject(slug, repo.full_name);
      await update({ vercel_id: vercelProject.id, vercel_url: `https://vercel.com/${vercelProject.id}`, provision_status: 'vercel_ready' });
      log.push(`Vercel ready: ${vercelProject.id}`);

      if (env_vars && Object.keys(env_vars).length) {
        await setVercelEnvVars(vercelProject.id, env_vars);
        log.push(`Set ${Object.keys(env_vars).length} env vars on Vercel`);
      }

      await new Promise(r => setTimeout(r, 4000));
      const deployments = await getVercelDeployments(vercelProject.id);
      const deploymentUrl = deployments[0]?.url ? `https://${deployments[0].url}` : `https://${slug}.vercel.app`;
      await update({ deployment_url: deploymentUrl });
      log.push(`Deployment: ${deploymentUrl}`);
    }

    // 3. Railway project + service (for backend/fullstack, or if explicitly requested)
    if (needs_railway || stack_type === 'backend_api' || stack_type === 'fullstack') {
      log.push('Creating Railway project…');
      const rResult = await railway('mutation projectCreate($input: ProjectCreateInput!) { projectCreate(input: $input) { id name } }', { input: { name } });
      const railwayId = rResult.projectCreate.id;
      await update({ railway_id: railwayId, railway_url: `https://railway.com/project/${encodeURIComponent(railwayId)}`, provision_status: 'railway_ready' });
      log.push(`Railway project ready: ${railwayId}`);

      log.push('Creating Railway service from repo…');
      const sResult = await railway('mutation serviceCreate($input: ServiceCreateInput!) { serviceCreate(input: $input) { id name } }', { input: { projectId: railwayId, name, source: { repo: repo.full_name } } });
      await update({ railway_service_id: sResult.serviceCreate.id });
      log.push(`Railway service ready: ${sResult.serviceCreate.id}`);
    }

    // 4. Supabase database
    if (needs_supabase) {
      log.push('Creating Supabase project…');
      try {
        const { accessToken: sbToken } = await svc.connectors.getConnection('supabase');
        const orgs = await listSupabaseOrgs(sbToken);
        if (!orgs?.length) throw new Error('No Supabase organizations found');
        const sbProject = await createSupabaseProject(sbToken, slug, orgs[0].id, supabase_region || 'us-east-1');
        await update({ supabase_ref: sbProject.id, supabase_url: `https://${sbProject.id}.supabase.co`, provision_status: 'supabase_ready' });
        log.push(`Supabase ready: ${sbProject.id}`);
      } catch (sbErr: any) {
        log.push(`Supabase skipped: ${sbErr.message}`);
      }
    }

    // 5. GoDaddy domain → Vercel DNS
    if (needs_domain && domain) {
      log.push(`Configuring domain ${domain}…`);
      try {
        if (record.vercel_id) await addVercelDomain(record.vercel_id, domain);
        const h = godaddyHeaders();
        await fetch(`https://api.godaddy.com/v1/domains/${domain}/records/A/@`, { method: 'PATCH', headers: h, body: JSON.stringify([{ data: '76.76.21.21', ttl: 600 }]) });
        await fetch(`https://api.godaddy.com/v1/domains/${domain}/records/CNAME/www`, { method: 'PATCH', headers: h, body: JSON.stringify([{ data: 'cname.vercel-dns.com', ttl: 600 }]) });
        await update({ domain, domain_status: 'configured', provision_status: 'domain_ready' });
        log.push(`Domain ${domain} configured → Vercel (A + CNAME www)`);
      } catch (domErr: any) {
        await update({ domain_status: 'failed' });
        log.push(`Domain failed: ${domErr.message}`);
      }
    }

    await update({ provision_status: 'complete' });
    log.push('Provisioning complete.');

    return Response.json({ ok: true, system: record, log });
  } catch (err: any) {
    await update({ provision_status: 'failed', description: `${body.description || ''} | ERROR: ${err.message}`.slice(0, 1000) });
    return Response.json({ error: err.message, system_id: record.id, log }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════
// INDIVIDUAL ACTIONS — provision or augment a single resource
// ═══════════════════════════════════════════════════════════════════

async function provisionGithub(svc: any, body: any) {
  const { system_id, name, custom_html, stack_type } = body;
  if (!system_id || !name) return Response.json({ error: 'system_id and name required' }, { status: 400 });
  const record = await svc.entities.ClientInfrastructure.get(system_id);
  if (!record) return Response.json({ error: 'System not found' }, { status: 404 });
  if (record.github_repo) return Response.json({ error: 'GitHub repo already exists' }, { status: 409 });
  const slug = slugify(name);
  const { accessToken } = await svc.connectors.getConnection('github');
  const repo = await createGitHubRepo(accessToken, slug, `Provisioned by Strategic Minds AI — ${name}`);
  const files = resolveFiles({ ...body, stack_type: stack_type || record.stack_type }, name);
  await pushFilesToGitHub(accessToken, repo.owner.login, repo.name, repo.default_branch || 'main', files);
  const updated = await svc.entities.ClientInfrastructure.update(system_id, { github_repo: repo.full_name, github_url: repo.html_url, provision_status: 'github_ready' });
  return Response.json({ ok: true, system: updated, github_url: repo.html_url });
}

async function provisionVercel(svc: any, body: any) {
  const { system_id } = body;
  if (!system_id) return Response.json({ error: 'system_id required' }, { status: 400 });
  const record = await svc.entities.ClientInfrastructure.get(system_id);
  if (!record) return Response.json({ error: 'System not found' }, { status: 404 });
  if (!record.github_repo) return Response.json({ error: 'Create GitHub repo first' }, { status: 400 });
  if (record.vercel_id) return Response.json({ error: 'Vercel project already exists' }, { status: 409 });
  const slug = slugify(record.name);
  const project = await createVercelProject(slug, record.github_repo);
  const updated = await svc.entities.ClientInfrastructure.update(system_id, { vercel_id: project.id, vercel_url: `https://vercel.com/${project.id}`, provision_status: 'vercel_ready' });
  return Response.json({ ok: true, system: updated, vercel_id: project.id });
}

async function provisionRailway(svc: any, body: any) {
  const { system_id, with_service } = body;
  if (!system_id) return Response.json({ error: 'system_id required' }, { status: 400 });
  const record = await svc.entities.ClientInfrastructure.get(system_id);
  if (!record) return Response.json({ error: 'System not found' }, { status: 404 });
  if (record.railway_id) return Response.json({ error: 'Railway project already exists' }, { status: 409 });
  const rResult = await railway('mutation projectCreate($input: ProjectCreateInput!) { projectCreate(input: $input) { id name } }', { input: { name: record.name } });
  const changes: any = { railway_id: rResult.projectCreate.id, railway_url: `https://railway.com/project/${encodeURIComponent(rResult.projectCreate.id)}`, provision_status: 'railway_ready' };
  if (with_service && record.github_repo) {
    const sResult = await railway('mutation serviceCreate($input: ServiceCreateInput!) { serviceCreate(input: $input) { id name } }', { input: { projectId: rResult.projectCreate.id, name: record.name, source: { repo: record.github_repo } } });
    changes.railway_service_id = sResult.serviceCreate.id;
  }
  const updated = await svc.entities.ClientInfrastructure.update(system_id, changes);
  return Response.json({ ok: true, system: updated });
}

async function provisionSupabase(svc: any, body: any) {
  const { system_id, region } = body;
  if (!system_id) return Response.json({ error: 'system_id required' }, { status: 400 });
  const record = await svc.entities.ClientInfrastructure.get(system_id);
  if (!record) return Response.json({ error: 'System not found' }, { status: 404 });
  if (record.supabase_ref) return Response.json({ error: 'Supabase project already exists' }, { status: 409 });
  const { accessToken } = await svc.connectors.getConnection('supabase');
  const orgs = await listSupabaseOrgs(accessToken);
  if (!orgs?.length) return Response.json({ error: 'No Supabase organizations found' }, { status: 400 });
  const slug = slugify(record.name).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30);
  const sbProject = await createSupabaseProject(accessToken, slug, orgs[0].id, region || 'us-east-1');
  const updated = await svc.entities.ClientInfrastructure.update(system_id, { supabase_ref: sbProject.id, supabase_url: `https://${sbProject.id}.supabase.co`, provision_status: 'supabase_ready' });
  return Response.json({ ok: true, system: updated, supabase_id: sbProject.id });
}

async function domainCheck(body: any) {
  const { domain } = body;
  if (!domain) return Response.json({ error: 'domain required' }, { status: 400 });
  const h = godaddyHeaders();
  const res = await fetch(`https://api.godaddy.com/v1/domains/available?domain=${encodeURIComponent(domain)}`, { headers: h });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(`GoDaddy: ${data.error?.message || data.message || `request failed (${res.status})`}`);
  }
  const data = await res.json();
  return Response.json({ domain, available: data.available, price: data.price ? `${data.currency} ${data.price}` : null });
}

async function domainConfigure(svc: any, body: any) {
  const { system_id, domain } = body;
  if (!system_id || !domain) return Response.json({ error: 'system_id and domain required' }, { status: 400 });
  const record = await svc.entities.ClientInfrastructure.get(system_id);
  if (!record) return Response.json({ error: 'System not found' }, { status: 404 });
  if (record.vercel_id) await addVercelDomain(record.vercel_id, domain);
  const h = godaddyHeaders();
  await fetch(`https://api.godaddy.com/v1/domains/${domain}/records/A/@`, { method: 'PATCH', headers: h, body: JSON.stringify([{ data: '76.76.21.21', ttl: 600 }]) });
  await fetch(`https://api.godaddy.com/v1/domains/${domain}/records/CNAME/www`, { method: 'PATCH', headers: h, body: JSON.stringify([{ data: 'cname.vercel-dns.com', ttl: 600 }]) });
  const updated = await svc.entities.ClientInfrastructure.update(system_id, { domain, domain_status: 'configured' });
  return Response.json({ ok: true, system: updated, message: `${domain} → Vercel (A + CNAME www set)` });
}

async function setEnvVars(svc: any, body: any) {
  const { system_id, env_vars } = body;
  if (!system_id || !env_vars) return Response.json({ error: 'system_id and env_vars required' }, { status: 400 });
  const record = await svc.entities.ClientInfrastructure.get(system_id);
  if (!record) return Response.json({ error: 'System not found' }, { status: 404 });
  if (!record.vercel_id) return Response.json({ error: 'Create Vercel project first' }, { status: 400 });
  const results = await setVercelEnvVars(record.vercel_id, env_vars);
  const updated = await svc.entities.ClientInfrastructure.update(system_id, { env_vars: JSON.stringify(Object.keys(env_vars)) });
  return Response.json({ ok: true, system: updated, results });
}

// ── Read / manage ─────────────────────────────────────────────────
async function listSystems(svc: any, body: any) {
  const limit = body.limit || 100;
  const res = await svc.entities.ClientInfrastructure.filter({}, { sort: '-created_date', limit });
  return Response.json({ systems: res.items || [] });
}

async function getSystem(svc: any, body: any) {
  const { system_id } = body;
  if (!system_id) return Response.json({ error: 'system_id required' }, { status: 400 });
  const record = await svc.entities.ClientInfrastructure.get(system_id);
  if (!record) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ system: record });
}

async function dashboard(svc: any) {
  const res = await svc.entities.ClientInfrastructure.filter({}, { limit: 500 });
  const items = res.items || [];
  return Response.json({
    total: items.length,
    with_github: items.filter(i => !!i.github_repo).length,
    with_vercel: items.filter(i => !!i.vercel_id).length,
    with_railway: items.filter(i => !!i.railway_id).length,
    with_railway_service: items.filter(i => !!i.railway_service_id).length,
    with_supabase: items.filter(i => !!i.supabase_ref).length,
    with_domain: items.filter(i => !!i.domain).length,
    complete: items.filter(i => i.provision_status === 'complete').length,
    failed: items.filter(i => i.provision_status === 'failed').length,
  });
}

async function updateSystem(svc: any, body: any) {
  const { system_id, notes, provision_status } = body;
  if (!system_id) return Response.json({ error: 'system_id required' }, { status: 400 });
  const changes: any = {};
  if (notes !== undefined) changes.description = notes;
  if (provision_status) changes.provision_status = provision_status;
  const updated = await svc.entities.ClientInfrastructure.update(system_id, changes);
  return Response.json({ ok: true, system: updated });
}

async function deleteSystem(svc: any, body: any) {
  const { system_id } = body;
  if (!system_id) return Response.json({ error: 'system_id required' }, { status: 400 });
  await svc.entities.ClientInfrastructure.delete(system_id);
  return Response.json({ ok: true, deleted: system_id });
}