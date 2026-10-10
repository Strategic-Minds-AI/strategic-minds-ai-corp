export const GALLERIES: Record<string, string> = {
  aurora: 'Aurora', fortress: 'Fortress', serenity: 'Serenity', momentum: 'Momentum',
  heritage: 'Heritage', pulse: 'Pulse', summit: 'Summit', bloom: 'Bloom',
  forge: 'Forge', lumin: 'Lumin', terra: 'Terra', velocity: 'Velocity',
  haven: 'Haven', crystal: 'Crystal', sage: 'Sage', apex: 'Apex',
  beacon: 'Beacon', prism: 'Prism', grid: 'Grid', wave: 'Wave',
};
export const KINDS = new Set(['web_pack', 'mockup', 'logo_pack', 'brand_pack']);
export const MAX_BATCH = 100;
export const MAX_REQUEST_BYTES = 3_500_000;
export const MAX_HTML_BYTES = 500_000;
export const reply = (error: string, status = 400) => Response.json({ ok: false, error }, { status });
export const isObject = (value: unknown): value is Record<string, any> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);
export const bytes = (value: string) => new TextEncoder().encode(value).byteLength;
export const digest = async (value: string) => {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash)).map(byte => byte.toString(16).padStart(2, '0')).join('');
};
export const safeToken = async (provided: string, expected: string) => {
  if (!provided || !expected || provided.length !== expected.length) return false;
  return (await digest(provided)) === (await digest(expected));
};

export type Pack = {
  gallery_id: string; title: string; kind: string; html_content: string;
  css_content: string; js_content: string; category: string; city: string;
  description: string; brand_tokens: object; manifest: object; version: string;
};
export function normalizePack(value: any, index: number): Pack {
  if (!isObject(value)) throw new Error('items[' + index + '] must be an object');
  const gallery_id = value.gallery_id;
  const title = typeof (value.title || value.name) === 'string' ? (value.title || value.name).trim() : '';
  const kind = value.kind || 'web_pack';
  const html_content = value.html_content ?? value.preview_html;
  if (!GALLERIES[gallery_id]) throw new Error('items[' + index + ']: unknown gallery_id');
  if (!title || title.length > 160) throw new Error('items[' + index + ']: invalid title');
  if (!KINDS.has(kind)) throw new Error('items[' + index + ']: invalid kind');
  if (typeof html_content !== 'string' || !html_content.trim()) throw new Error('items[' + index + ']: HTML required');
  if (bytes(html_content) > MAX_HTML_BYTES) throw new Error('items[' + index + ']: HTML exceeds 500 KB');
  for (const key of ['brand_tokens', 'manifest']) if (value[key] !== undefined && !isObject(value[key])) throw new Error('items[' + index + ']: ' + key + ' must be an object');
  const css_content = value.css_content || '';
  const js_content = value.js_content || '';
  if (typeof css_content !== 'string' || typeof js_content !== 'string') throw new Error('items[' + index + ']: CSS/JS must be strings');
  if (bytes(css_content) > 200_000 || bytes(js_content) > 200_000) throw new Error('items[' + index + ']: CSS/JS too large');
  return {
    gallery_id, title, kind, html_content, css_content, js_content,
    category: String(value.category || 'general').slice(0, 120),
    city: String(value.city || '').slice(0, 120),
    description: String(value.description || '').slice(0, 1800),
    brand_tokens: value.brand_tokens || {},
    manifest: value.manifest || {},
    version: String(value.version || '1.0.0').slice(0, 48),
  };
}
