import { createClientFromRequest } from '../../shared/ownedClient.ts';

// ============================================================
// TEMPLATE INGESTION — Backend persistence API
//
// The actual HTML/CSS parsing runs CLIENT-SIDE in the browser
// (src/lib/frontendFactory/templateIngestor.ts) using DOMParser.
// This backend function persists the raw template + extracted
// patterns to the TemplateAsset entity.
//
// Actions:
//   ingest    — Store raw template content (admin only)
//   update    — Update extracted patterns after client-side parsing
//   list      — List all templates
//   get       — Get a single template with full content
//   delete    — Delete a template
//   activate  — Mark a template as active (available to agents)
//   deactivate— Mark a template as inactive
// ============================================================

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'list';

    // ── ingest ──
    if (action === 'ingest') {
      const { name, source_type, content, source_url, tags } = body;
      if (!name || !content) return Response.json({ error: 'name and content required' }, { status: 400 });

      const slug = slugify(name);
      const existing = await svc.entities.TemplateAsset.filter({ slug }, { limit: 1 });

      let record;
      const data: any = {
        name,
        slug,
        source_type: source_type || 'html',
        source_url: source_url || '',
        raw_content: typeof content === 'string' ? content.slice(0, 50000) : '',
        status: 'pending',
        tags: Array.isArray(tags) ? tags : [],
      };

      if (existing.items?.length > 0) {
        record = await svc.entities.TemplateAsset.update(existing.items[0].id, data);
      } else {
        record = await svc.entities.TemplateAsset.create(data);
      }

      return Response.json({ ok: true, template: record });
    }

    // ── update (save extracted patterns) ──
    if (action === 'update') {
      const { template_id, extracted_patterns, pattern_summary, color_palette, font_families, section_count } = body;
      if (!template_id) return Response.json({ error: 'template_id required' }, { status: 400 });

      const updateData: any = { status: 'extracted' };
      if (extracted_patterns) updateData.extracted_patterns = JSON.stringify(extracted_patterns).slice(0, 40000);
      if (pattern_summary) updateData.pattern_summary = pattern_summary;
      if (color_palette) updateData.color_palette = JSON.stringify(color_palette);
      if (font_families) updateData.font_families = JSON.stringify(font_families);
      if (typeof section_count === 'number') updateData.section_count = section_count;

      // Count patterns
      if (extracted_patterns) {
        let count = 0;
        if (extracted_patterns.colorSystem) count++;
        if (extracted_patterns.typographyPattern) count++;
        if (extracted_patterns.componentPatterns) count += extracted_patterns.componentPatterns.length;
        if (extracted_patterns.navigationPattern) count++;
        if (extracted_patterns.layoutPattern) count++;
        if (extracted_patterns.templatePack) count++;
        updateData.pattern_count = count;
      }

      const record = await svc.entities.TemplateAsset.update(template_id, updateData);
      return Response.json({ ok: true, template: record });
    }

    // ── activate ──
    if (action === 'activate') {
      const { template_id } = body;
      if (!template_id) return Response.json({ error: 'template_id required' }, { status: 400 });
      const record = await svc.entities.TemplateAsset.update(template_id, { status: 'active' });
      return Response.json({ ok: true, template: record });
    }

    // ── deactivate ──
    if (action === 'deactivate') {
      const { template_id } = body;
      if (!template_id) return Response.json({ error: 'template_id required' }, { status: 400 });
      const record = await svc.entities.TemplateAsset.update(template_id, { status: 'extracted' });
      return Response.json({ ok: true, template: record });
    }

    // ── list ──
    if (action === 'list') {
      const status = body.status;
      const query = status ? { status } : {};
      const records = await svc.entities.TemplateAsset.filter(query, { sort: '-created_date', limit: 100, fields: ['name', 'slug', 'source_type', 'status', 'pattern_count', 'section_count', 'tags', 'created_date'] });
      return Response.json({ templates: records.items || [] });
    }

    // ── get ──
    if (action === 'get') {
      const { template_id } = body;
      if (!template_id) return Response.json({ error: 'template_id required' }, { status: 400 });
      const record = await svc.entities.TemplateAsset.get(template_id);
      if (!record) return Response.json({ error: 'Template not found' }, { status: 404 });
      return Response.json({ template: record });
    }

    // ── delete ──
    if (action === 'delete') {
      const { template_id } = body;
      if (!template_id) return Response.json({ error: 'template_id required' }, { status: 400 });
      await svc.entities.TemplateAsset.delete(template_id);
      return Response.json({ ok: true, deleted: template_id });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error('Template ingestion error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}