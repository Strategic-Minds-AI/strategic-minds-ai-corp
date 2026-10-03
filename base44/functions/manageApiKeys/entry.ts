import { createClientFromRequest } from '../../shared/ownedClient.ts';
import { getSupabaseUser } from '../../shared/supabaseAuth.ts';

const PREFIXES: Record<string, string> = {
  admin: 'xa_admin_',
  user: 'xa_user_',
  vision_cortex: 'xa_vision_',
};

function generateKeyValue(type: string): string {
  const prefix = PREFIXES[type] || 'xa_key_';
  const random = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  return `${prefix}${random}`;
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await getSupabaseUser(req);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'list';

    if (action === 'list') {
      const res = await base44.entities.ApiKey.filter({}, { sort: '-created_date', limit: 100 });
      return Response.json({ keys: (res.items || []).map((k: any) => ({
        id: k.id, key_name: k.key_name, key_type: k.key_type, key_prefix: k.key_prefix,
        permissions: k.permissions || [], active: k.active, expires_at: k.expires_at,
        last_used: k.last_used, created_date: k.created_date, created_by_email: k.created_by_email,
      })) });
    }

    if (action === 'create') {
      const { key_name, key_type, permissions, expires_at } = body;
      if (!key_name || !key_type) return Response.json({ error: 'key_name and key_type are required' }, { status: 400 });
      if (!PREFIXES[key_type]) return Response.json({ error: 'Invalid key_type' }, { status: 400 });
      const key_value = generateKeyValue(key_type);
      const key_prefix = key_value.slice(0, 12);
      const record = await base44.entities.ApiKey.create({
        key_name,
        key_type,
        key_value,
        key_prefix,
        permissions: permissions || (key_type === 'admin' ? ['all'] : key_type === 'vision_cortex' ? ['diagnostics', 'heal', 'harden', 'optimize'] : ['read']),
        active: true,
        expires_at: expires_at || null,
        created_by_email: user.email || '',
      });
      return Response.json({ ok: true, key: { id: record.id, key_value, key_prefix, key_name, key_type } });
    }

    if (action === 'revoke') {
      const { key_id } = body;
      if (!key_id) return Response.json({ error: 'key_id is required' }, { status: 400 });
      await base44.entities.ApiKey.update(key_id, { active: false });
      return Response.json({ ok: true, revoked: key_id });
    }

    if (action === 'delete') {
      const { key_id } = body;
      if (!key_id) return Response.json({ error: 'key_id is required' }, { status: 400 });
      await base44.entities.ApiKey.delete(key_id);
      return Response.json({ ok: true, deleted: key_id });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Failed to manage API keys' }, { status: 500 });
  }
}