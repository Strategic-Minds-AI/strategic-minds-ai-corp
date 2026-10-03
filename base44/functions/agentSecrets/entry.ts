import { createClientFromRequest } from '../../shared/ownedClient.ts';
import { getSupabaseUser } from '../../shared/supabaseAuth.ts';
import { secrets } from '../../shared/runtimeSecrets.ts';
import { encryptSecret, decryptSecret } from '../../shared/agentSecretCrypto.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await getSupabaseUser(req);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });

    const appId = secrets.get('BASE44_APP_ID') || 'standalone';
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'list';

    if (action === 'list') {
      const res = await base44.entities.AgentSecret.filter({}, { sort: '-created_date', limit: 200, fields: ['name', 'description', 'category', 'last_used', 'used_count', 'created_date'] });
      return Response.json({ secrets: res.items || [] });
    }

    if (action === 'store') {
      const { name, value, description, category } = body;
      if (!name || !value) return Response.json({ error: 'name and value are required' }, { status: 400 });
      const cleanName = String(name).trim().toUpperCase().replace(/\s+/g, '_');
      const encrypted = await encryptSecret(String(value), appId);
      // Check if a secret with this name already exists — update or create
      const existing = await base44.entities.AgentSecret.filter({ name: cleanName }, { limit: 1, fields: ['id'] });
      if (existing.items && existing.items.length > 0) {
        const updated = await base44.entities.AgentSecret.update(existing.items[0].id, {
          encrypted_value: encrypted,
          description: description || '',
          category: category || 'api_key',
        });
        return Response.json({ ok: true, action: 'updated', name: cleanName, id: updated.id });
      }
      const record = await base44.entities.AgentSecret.create({
        name: cleanName,
        encrypted_value: encrypted,
        description: description || '',
        category: category || 'api_key',
        used_count: 0,
      });
      return Response.json({ ok: true, action: 'created', name: cleanName, id: record.id });
    }

    if (action === 'retrieve') {
      const { name } = body;
      if (!name) return Response.json({ error: 'name is required' }, { status: 400 });
      const cleanName = String(name).trim().toUpperCase().replace(/\s+/g, '_');
      const res = await base44.entities.AgentSecret.filter({ name: cleanName }, { limit: 1 });
      if (!res.items || res.items.length === 0) {
        return Response.json({ error: `No secret found named "${cleanName}"` }, { status: 404 });
      }
      const secret = res.items[0];
      const value = await decryptSecret(secret.encrypted_value, appId);
      // Update usage tracking (fire-and-forget)
      try {
        await base44.entities.AgentSecret.update(secret.id, {
          last_used: new Date().toISOString(),
          used_count: (secret.used_count || 0) + 1,
        });
      } catch { /* usage tracking is best-effort */ }
      return Response.json({ ok: true, name: cleanName, value });
    }

    if (action === 'delete') {
      const { name } = body;
      if (!name) return Response.json({ error: 'name is required' }, { status: 400 });
      const cleanName = String(name).trim().toUpperCase().replace(/\s+/g, '_');
      const res = await base44.entities.AgentSecret.filter({ name: cleanName }, { limit: 1, fields: ['id'] });
      if (!res.items || res.items.length === 0) {
        return Response.json({ error: `No secret found named "${cleanName}"` }, { status: 404 });
      }
      await base44.entities.AgentSecret.delete(res.items[0].id);
      return Response.json({ ok: true, deleted: cleanName });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('agentSecrets error:', error);
    return Response.json({ error: error instanceof Error ? error.message : 'Failed to manage agent secrets' }, { status: 500 });
  }
}