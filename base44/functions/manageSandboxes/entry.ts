import { createClientFromRequest } from '../../shared/ownedClient.ts';

const RAILWAY_GRAPHQL = 'https://backboard.railway.app/graphql';
const RAILWAY_PROJECT_ID = '15f90272-e2f6-4739-8286-91447f545d71';

function generateApiKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return 'sk_sbx_' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function computeHealth(lastHeartbeat: string | undefined): string {
  if (!lastHeartbeat) return 'unknown';
  const age = Date.now() - new Date(lastHeartbeat).getTime();
  if (age < 3 * 60 * 1000) return 'healthy';
  if (age < 10 * 60 * 1000) return 'degraded';
  return 'offline';
}

async function railwayQuery(query, variables = {}) {
  const token = process.env.RAILWAY_API_TOKEN;
  if (!token) throw new Error('RAILWAY_API_TOKEN secret not set');

  const res = await fetch(RAILWAY_GRAPHQL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Railway API ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  if (data.errors) throw new Error(data.errors[0]?.message || 'Railway GraphQL error');
  return data.data;
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'list';

    // List all sandboxes from DB
    if (action === 'list') {
      const [dbRes, railwayEnv] = await Promise.all([
        base44.entities.Sandbox.filter({}, { sort: '-created_date', limit: 100 }),
        railwayQuery(`query { railwayEnvironments { id name isEphemeral } }`).catch(e => ({ error: e.message }))
      ]);
      return Response.json({
        sandboxes: dbRes.items || [],
        railway_environments: railwayEnv.railwayEnvironments || [],
        railway_error: railwayEnv.error || null
      });
    }

    // Create a Railway sandbox
    if (action === 'create_railway') {
      const name = body.name || `sandbox-${Date.now()}`;
      const description = body.description || '';
      const agentName = body.agent_name || '';

      // Create Railway environment
      const envResult = await railwayQuery(
        `mutation($projectId: String!, $name: String!) { railwayEnvironmentCreate(input: { projectId: $projectId, name: $name }) { id name } }`,
        { projectId: RAILWAY_PROJECT_ID, name }
      );

      const envId = envResult.railwayEnvironmentCreate?.id;
      if (!envId) throw new Error('Failed to create Railway environment');

      // Generate raw key, hash it, store only the hash
      const rawApiKey = generateApiKey();
      const keyHash = await sha256(rawApiKey);
      const keyPrefix = rawApiKey.slice(0, 10);

      const sandbox = await base44.entities.Sandbox.create({
        name,
        environment: 'railway',
        status: 'active',
        railway_environment_id: envId,
        railway_project_id: RAILWAY_PROJECT_ID,
        agent_name: agentName,
        description,
        api_key_hash: keyHash,
        key_prefix: keyPrefix,
        config: JSON.stringify({ created_via: 'manageSandboxes', railway_environment: envId })
      });

      // Return raw key ONCE — never stored, never retrievable again
      return Response.json({ sandbox, api_key: rawApiKey, railway_environment: envResult.railwayEnvironmentCreate });
    }

    // Create a local sandbox
    if (action === 'create_local') {
      const name = body.name || `local-sandbox-${Date.now()}`;
      const description = body.description || '';
      const agentName = body.agent_name || '';
      const config = body.config || '{}';

      const rawApiKey = generateApiKey();
      const keyHash = await sha256(rawApiKey);
      const keyPrefix = rawApiKey.slice(0, 10);

      const sandbox = await base44.entities.Sandbox.create({
        name,
        environment: 'local',
        status: 'active',
        agent_name: agentName,
        description,
        api_key_hash: keyHash,
        key_prefix: keyPrefix,
        config
      });

      // Return raw key ONCE
      return Response.json({ sandbox, api_key: rawApiKey });
    }

    // Delete a sandbox
    if (action === 'delete') {
      const sandboxId = body.sandbox_id;
      const sandbox = await base44.entities.Sandbox.get(sandboxId);

      // If Railway environment, delete it
      if (sandbox.environment === 'railway' && sandbox.railway_environment_id) {
        await railwayQuery(
          `mutation($id: String!) { railwayEnvironmentDelete(id: $id) }`,
          { id: sandbox.railway_environment_id }
        ).catch(e => { /* environment may already be deleted */ });
      }

      await base44.entities.Sandbox.update(sandboxId, { status: 'deleted' });
      return Response.json({ deleted: true, sandbox_id: sandboxId });
    }

    // Health check: update all sandbox health statuses based on heartbeat staleness
    if (action === 'health_check') {
      const HEALTHY_MS = 3 * 60 * 1000;
      const DEGRADED_MS = 10 * 60 * 1000;
      const sbRes = await base44.entities.Sandbox.filter({ status: { $ne: 'deleted' } }, { limit: 100 });
      const allSandboxes = sbRes.items || [];
      const updates = [];
      for (const sb of allSandboxes) {
        let newStatus = 'unknown';
        if (sb.last_heartbeat_at) {
          const age = Date.now() - new Date(sb.last_heartbeat_at).getTime();
          if (age < HEALTHY_MS) newStatus = 'healthy';
          else if (age < DEGRADED_MS) newStatus = 'degraded';
          else newStatus = 'offline';
        }
        if ((sb.health_status || 'unknown') !== newStatus) {
          await base44.entities.Sandbox.update(sb.id, { health_status: newStatus });
          updates.push({ id: sb.id, name: sb.name, old: sb.health_status || 'unknown', new: newStatus });
        }
      }
      return Response.json({
        ok: true,
        summary: {
          total: allSandboxes.length,
          healthy: allSandboxes.filter(s => computeHealth(s.last_heartbeat_at) === 'healthy').length,
          degraded: allSandboxes.filter(s => computeHealth(s.last_heartbeat_at) === 'degraded').length,
          offline: allSandboxes.filter(s => computeHealth(s.last_heartbeat_at) === 'offline').length,
          unknown: allSandboxes.filter(s => !s.last_heartbeat_at || computeHealth(s.last_heartbeat_at) === 'unknown').length,
        },
        updates,
      });
    }

    // Get Railway environments only
    if (action === 'railway_environments') {
      const envResult = await railwayQuery(`query { railwayEnvironments { id name isEphemeral } }`);
      return Response.json({ environments: envResult.railwayEnvironments || [] });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}