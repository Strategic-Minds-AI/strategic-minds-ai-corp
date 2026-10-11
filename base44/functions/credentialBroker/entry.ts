import { getSupabaseUser } from '../../shared/supabaseAuth.ts';
import { createClientFromRequest } from '../../shared/ownedClient.ts';
import { CATALOG, GALLERY_IDS, capabilityReadiness, hasCapability } from '../../shared/credentialCapabilityPolicy.ts';

const reply = (body: object, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const safeList = (record: any, keys: string[]) =>
  Object.fromEntries(keys.map(key => [key, record?.[key] ?? null]));
const CAP = 50;

export default async function credentialBroker(request: Request): Promise<Response> {
  if (request.method !== 'POST') return reply({ error: 'POST required' }, 405);
  const actor = await getSupabaseUser(request);
  if (!actor) return reply({ error: 'Authenticated session required' }, 401);
  if (actor.role !== 'admin') return reply({ error: 'Admin access required' }, 403);
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > 8192) return reply({ error: 'Request too large' }, 413);
  let body: any;
  try { body = JSON.parse(raw); } catch { return reply({ error: 'Invalid JSON' }, 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return reply({ error: 'Invalid request' }, 400);
  const action = body.action;
  if (action === 'catalog') return reply({
    capabilities: Object.keys(CATALOG).map(id => capabilityReadiness(id as keyof typeof CATALOG)),
    writes_enabled: false,
    credentials_returned: false,
  });
  const id = body.capability;
  if (typeof id !== 'string' || !hasCapability(id)) return reply({ error: 'Capability not allowed' }, 403);
  const readiness = capabilityReadiness(id);
  if (action === 'preflight') return reply(readiness);
  if (action !== 'execute') return reply({ error: 'Unsupported operation' }, 400);
  if (!readiness.ready) return reply({ error: 'Provider connection not ready', missing: readiness.missing }, 503);
  if (id === 'ai.gateway.readiness' || id === 'studio.sync.readiness') {
    return reply(readiness);
  }
  const limit = body.limit === undefined ? 20 : body.limit;
  if (!Number.isInteger(limit) || limit < 1 || limit > CAP) return reply({ error: 'Invalid limit' }, 400);
  try {
    const svc = createClientFromRequest(request).asServiceRole.entities;
    if (id === 'studio.templates.list') {
      const gallery = body.gallery_id;
      if (gallery !== undefined && (typeof gallery !== 'string' || !GALLERY_IDS.has(gallery))) {
        return reply({ error: 'Unknown gallery' }, 400);
      }
      const data = await svc.TemplateGallery.filter(gallery ? { gallery_id: gallery } : {}, {
        sort: '-created_date', limit,
        fields: ['gallery_id', 'gallery_name', 'title', 'category', 'city',
          'design_style', 'color_scheme', 'quality_score', 'status', 'created_date'],
      });
      const fields = ['id', 'gallery_id', 'gallery_name', 'title', 'category', 'city',
        'design_style', 'color_scheme', 'quality_score', 'status', 'created_date'];
      const rows = Array.isArray(data) ? data : (data?.items || []);
      return reply({ capability: id, count: rows.length, items: rows.map((record: any) => safeList(record, fields)) });
    }
    if (id === 'vault.accounts.list') {
      const data = await svc.VaultAccount.filter({ created_by_id: actor.id }, {
        sort: '-created_date', limit, fields: ['name', 'provider'],
      });
      const rows = Array.isArray(data) ? data : (data?.items || []);
      return reply({
        capability: id, count: rows.length,
        items: rows.map((record: any) => safeList(record, ['id', 'name', 'provider'])),
      });
    }
  } catch {
    return reply({ error: 'Capability adapter unavailable' }, 503);
  }
  return reply({ error: 'Operation unsupported' }, 403);
}
