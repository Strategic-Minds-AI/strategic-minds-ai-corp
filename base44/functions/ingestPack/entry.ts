import { createClientFromRequest } from '../../shared/ownedClient.ts';
import { secrets } from '../../shared/runtimeSecrets.ts';
import { GALLERIES, MAX_BATCH, MAX_REQUEST_BYTES, bytes, safeToken, reply, isObject, normalizePack, digest, type Pack } from '../../shared/gptStudioPack.ts';

export default async function ingestPack(request: Request): Promise<Response> {
  if (request.method !== 'POST') return reply('POST required', 405);
  const configured = secrets.get('SERVER_SIDE_SYNC_TOKEN');
  if (!configured) return reply('SERVER_SIDE_SYNC_TOKEN is not configured', 503);
  const match = (request.headers.get('authorization') || '').match(/^Bearer ([^\s]+)$/i);
  if (!(await safeToken(match?.[1] || '', configured))) return reply('Unauthorized', 401);
  const raw = await request.text();
  if (bytes(raw) > MAX_REQUEST_BYTES) return reply('Payload exceeds 3.5 MB', 413);
  let body: any;
  try { body = JSON.parse(raw); } catch { return reply('Invalid JSON'); }
  if (!isObject(body)) return reply('JSON object required');
  const approval = body.approval;
  if (!isObject(approval) || approval.state !== 'approved'
    || approval.channel !== 'chatgpt_ui'
    || typeof approval.approval_id !== 'string'
    || !/^[a-zA-Z0-9_-]{8,128}$/.test(approval.approval_id)
    || typeof approval.approved_by !== 'string'
    || !approval.approved_by.trim()) {
    return reply('Explicit ChatGPT operator approval receipt required', 403);
  }
  // The machine credential authenticates the submitter; this receipt records
  // user intent but is not a cryptographic ChatGPT identity assertion.
  const rawItems = Array.isArray(body.items) ? body.items : [body];
  if (!rawItems.length || rawItems.length > MAX_BATCH) return reply('Batch size must be 1 to 100');
  let items: Pack[];
  try { items = rawItems.map(normalizePack); }
  catch (error: any) { return reply(String(error.message || 'Invalid pack')); }
  const client = createClientFromRequest(request);
  const store = client.asServiceRole.entities.TemplateGallery;
  const results: any[] = [];
  const seen = new Map<string, string>();
  const batch_id = String(body.batch_id || approval.approval_id).slice(0, 128);
  try {
    for (const item of items) {
      const hash = await digest(JSON.stringify(item));
      const key = item.gallery_id + ':' + hash;
      if (seen.has(key)) {
        results.push({ gallery_id: item.gallery_id, template_id: seen.get(key), duplicate: true, sha256: hash });
        continue;
      }
      const existing = await store.filter({ gallery_id: item.gallery_id, title: item.title }, { sort: '-created_date', limit: 100 });
      const rows = Array.isArray(existing) ? existing : (existing?.items || []);
      const duplicate = rows.find((row: any) => Array.isArray(row.tags) && row.tags.includes('sha256:' + hash));
      if (duplicate) {
        seen.set(key, duplicate.id);
        results.push({ gallery_id: item.gallery_id, template_id: duplicate.id, duplicate: true, sha256: hash });
        continue;
      }
      const saved = await store.create({
        gallery_id: item.gallery_id,
        gallery_name: GALLERIES[item.gallery_id],
        title: item.title,
        category: item.category,
        city: item.city,
        description: item.description,
        html_content: item.html_content,
        css_content: item.css_content,
        js_content: item.js_content,
        upload_source: 'gpt',
        design_style: String((item.brand_tokens as any).style || '').slice(0, 200),
        color_scheme: String((item.brand_tokens as any).primaryColor || '').slice(0, 80),
        brand_tokens: item.brand_tokens,
        manifest: item.manifest,
        version: item.version,
        content_sha256: hash,
        approval_receipt: {
          channel: approval.channel,
          approval_id: approval.approval_id,
          approved_by: approval.approved_by.slice(0, 160),
          approved_at: String(approval.approved_at || new Date().toISOString()).slice(0, 60),
        },
        batch_id,
        status: 'draft',
        quality_score: 0,
        tags: [item.kind, 'approved-in-chatgpt', 'sha256:' + hash, 'batch:' + batch_id],
      });
      seen.set(key, saved.id);
      results.push({ gallery_id: item.gallery_id, template_id: saved.id, duplicate: false, sha256: hash });
    }
  } catch (error: any) {
    return Response.json({ ok: false, error: 'Library storage failed', saved: results.length, total: items.length, results, detail: String(error.message || '').slice(0, 160) }, { status: 503 });
  }
  return Response.json({
    ok: true, batch_id, total: items.length, saved: results.filter(r => !r.duplicate).length,
    duplicates: results.filter(r => r.duplicate).length, results,
    library_status: 'draft', published: false, launch_queued: false,
  }, { status: 201 });
}
