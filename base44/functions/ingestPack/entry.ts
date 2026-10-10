import { createClientFromRequest } from '../../shared/ownedClient.ts';

// ============================================================
// INGEST PACK — Server-to-server endpoint for GPT (and other
// external systems) to upload generated website packs.
//
// Auth: Bearer token matching SERVER_SIDE_SYNC_TOKEN or WORKER_SECRET.
// This is NOT a user-auth endpoint — it's a machine-to-machine sync.
//
// Payload:
//   name               — website label
//   kind               — "web_pack" (future: "logo_pack", "brand_pack")
//   preview_html       — full HTML content of the generated site
//   brand_tokens       — design tokens (colors, fonts, spacing)
//   manifest           — file manifest (pages, assets, routes)
//   source             — "gpt_sync" | "manual" | "api"
//   submitted_by_label — who submitted (e.g. "ChatGPT")
//   status             — "pending_review" | "auto_deploy"
//   gallery_id         — optional: which of the 20 galleries to file into
//   category           — optional: business category
//   city               — optional: target city
//
// Stores the pack as a WebPack record. If gallery_id is provided,
// also creates a TemplateGallery record so it appears in the studio.
// ============================================================

export default async function(req: Request): Promise<Response> {
  try {
    // ── Verify server-side sync token ──
    const auth = req.headers.get('authorization') || '';
    const token = auth.replace(/^Bearer\s+/i, '');
    const validToken = process.env.SERVER_SIDE_SYNC_TOKEN || process.env.WORKER_SECRET;
    if (!validToken || token !== validToken) {
      return Response.json({ error: 'Invalid sync token' }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));

    const {
      name,
      kind,
      preview_html,
      brand_tokens,
      manifest,
      source,
      submitted_by_label,
      status,
      gallery_id,
      category,
      city,
    } = body;

    if (!name || !preview_html) {
      return Response.json({ error: 'name and preview_html are required' }, { status: 400 });
    }

    // ── Store as WebPack record ──
    const pack = await svc.entities.WebPack.create({
      name,
      image_url: '', // HTML-based pack, no design image
      status: status === 'auto_deploy' ? 'queued' : 'queued',
      generated_html: preview_html,
      logs: [
        `[${new Date().toISOString()}] Pack ingested from ${source || 'external'}`,
        `Submitted by: ${submitted_by_label || 'unknown'}`,
        `Kind: ${kind || 'web_pack'}`,
        `HTML size: ${preview_html.length} chars`,
        `Brand tokens: ${brand_tokens ? Object.keys(brand_tokens).length : 0} keys`,
        `Manifest entries: ${manifest ? (Array.isArray(manifest) ? manifest.length : Object.keys(manifest).length) : 0}`,
      ],
    });

    // ── If gallery_id is provided, also file into TemplateGallery ──
    let templateId: string | null = null;
    if (gallery_id) {
      const galleryNames: Record<string, string> = {
        aurora: 'Aurora', fortress: 'Fortress', serenity: 'Serenity', momentum: 'Momentum',
        heritage: 'Heritage', pulse: 'Pulse', summit: 'Summit', bloom: 'Bloom',
        forge: 'Forge', lumin: 'Lumin', terra: 'Terra', velocity: 'Velocity',
        haven: 'Haven', crystal: 'Crystal', sage: 'Sage', apex: 'Apex',
        beacon: 'Beacon', prism: 'Prism', grid: 'Grid', wave: 'Wave',
      };

      const gallery = await svc.entities.TemplateGallery.create({
        gallery_id,
        gallery_name: galleryNames[gallery_id] || gallery_id,
        title: name,
        category: category || 'general',
        city: city || '',
        description: `Uploaded via ${source || 'sync'} by ${submitted_by_label || 'external'}`,
        html_content: preview_html,
        css_content: '',
        js_content: '',
        upload_source: 'gpt',
        design_style: brand_tokens?.style || '',
        color_scheme: brand_tokens?.primaryColor || '',
        status: 'draft',
        tags: [source || 'sync', submitted_by_label || 'external', category, city].filter(Boolean),
        quality_score: 0,
      });
      templateId = gallery.id;
    }

    return Response.json({
      ok: true,
      pack_id: pack.id,
      template_id: templateId,
      status: 'queued',
      message: `Pack "${name}" ingested successfully. ${templateId ? `Filed into gallery "${gallery_id}".` : 'No gallery specified — stored as standalone pack.'}`,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}