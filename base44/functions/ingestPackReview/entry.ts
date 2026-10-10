import { createClientFromRequest } from '../../shared/ownedClient.ts';
import { getSupabaseUser } from '../../shared/supabaseAuth.ts';

const ALLOWED_KINDS = new Set(['web_pack', 'mockup', 'logo_pack', 'brand_pack']);
const MAX_HTML_BYTES = 250000;
const invalid = (error, status = 400) => Response.json({ error }, { status });
const normalizeObject = (value, field) => {
  if (value === undefined || value === null || value === '') return {};
  const parsed = typeof value === 'string' ? JSON.parse(value) : value;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(field + ' must be a JSON object');
  return parsed;
};
const fingerprint = async value => {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('');
};

export default async function ingestPackReview(request: Request): Promise<Response> {
  if (request.method !== 'POST') return invalid('POST required', 405);
  const user = await getSupabaseUser(request);
  if (!user) return invalid('Unauthorized', 401);
  if (user.role !== 'admin') return invalid('Admin access required', 403);
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > 300000) return invalid('Request too large', 413);
  let body: Record<string, any>;
  try { body = JSON.parse(raw); } catch { return invalid('Valid JSON required'); }
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const kind = body.kind || 'web_pack';
  const html = body.preview_html || '';
  if (!name || name.length > 120) return invalid('Pack name required (maximum 120 characters)');
  if (!ALLOWED_KINDS.has(kind)) return invalid('Unsupported pack kind');
  if (typeof html !== 'string') return invalid('preview_html must be a string');
  if (['web_pack', 'mockup'].includes(kind) && !html.trim()) return invalid('preview_html is required');
  if (new TextEncoder().encode(html).length > MAX_HTML_BYTES) return invalid('HTML exceeds 250 KB', 413);
  let tokens, manifest;
  try {
    tokens = normalizeObject(body.brand_tokens, 'brand_tokens');
    manifest = normalizeObject(body.manifest, 'manifest');
  } catch (error: any) { return invalid(error.message); }
  const payload = {
    name, kind, preview_html: html, brand_tokens: tokens, manifest,
    source: String(body.source || 'gpt_sync').slice(0, 80),
    submitted_by_label: String(body.submitted_by_label || 'GPT').slice(0, 80),
  };
  const digest = await fingerprint(JSON.stringify(payload));
  const templateKey = 'gpt-' + kind + '-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 56);
  const client = createClientFromRequest(request);
  try {
    const existing = await client.entities.TemplatePack.filter({ template_key: templateKey }, { sort: '-created_date', limit: 50 });
    const rows = Array.isArray(existing) ? existing : existing.items || [];
    const duplicate = rows.find(row => row.sha256 === digest);
    if (duplicate) return Response.json({ ok: true, pack_id: duplicate.id, status: 'draft', duplicate: true });
    const pack = await client.entities.TemplatePack.create({
      template_key: templateKey,
      name,
      mode: kind === 'web_pack' ? 'file_tree' : 'ui_recipe',
      category: kind,
      description: String(body.description || '').slice(0, 1000),
      version: 'sha-' + digest.slice(0, 12),
      files_json: JSON.stringify(payload),
      sha256: digest,
      status: 'draft',
      tags: [kind, 'gpt_sync', 'pending_review'],
    });
    return Response.json({ ok: true, pack_id: pack.id, status: 'draft', review_required: true, published: false }, { status: 201 });
  } catch (error: any) {
    return invalid('Pack storage failed: ' + String(error.message || 'unknown error').slice(0, 180), 503);
  }
}
