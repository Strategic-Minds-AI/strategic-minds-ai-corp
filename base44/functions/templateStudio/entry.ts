import { createClientFromRequest } from '../../shared/ownedClient.ts';
import { getSupabaseUser } from '../../shared/supabaseAuth.ts';
import { callAIGateway } from '../../shared/aiGateway.ts';

// ============================================================
// TEMPLATE STUDIO — Backend for the 20-gallery template system.
//
// GPT (or the admin) uploads generated websites into one of 20
// galleries. Each upload is stored as a TemplateGallery record
// with HTML/CSS/JS content, a quality score, and metadata.
//
// All AI calls route through the Vercel AI Gateway — no Base44
// integration credits are consumed.
//
// Actions:
//   upload        — GPT uploads a website to a gallery
//   list          — list templates in a gallery (or all)
//   listGalleries — return the 20 gallery definitions with counts
//   score         — AI-score a template's quality
//   publish       — promote a draft to published
//   archive       — archive a template
//   delete        — remove a template
//   generatePreview — generate a thumbnail via AI Gateway
// ============================================================

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await getSupabaseUser(req);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });

    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'list';

    // ── upload — GPT pushes a website into a gallery ──
    if (action === 'upload') {
      const { gallery_id, title, category, city, description, html_content, css_content, js_content, design_style, color_scheme, gpt_thread_id, tags, auto_score } = body;
      if (!gallery_id || !title || !html_content) {
        return Response.json({ error: 'gallery_id, title, and html_content are required' }, { status: 400 });
      }

      // Look up gallery name from the registry
      const galleryMap: Record<string, string> = {
        aurora: 'Aurora', fortress: 'Fortress', serenity: 'Serenity', momentum: 'Momentum',
        heritage: 'Heritage', pulse: 'Pulse', summit: 'Summit', bloom: 'Bloom',
        forge: 'Forge', lumin: 'Lumin', terra: 'Terra', velocity: 'Velocity',
        haven: 'Haven', crystal: 'Crystal', sage: 'Sage', apex: 'Apex',
        beacon: 'Beacon', prism: 'Prism', grid: 'Grid', wave: 'Wave',
      };

      const template = await svc.entities.TemplateGallery.create({
        gallery_id,
        gallery_name: galleryMap[gallery_id] || gallery_id,
        title,
        category: category || 'general',
        city: city || '',
        description: description || '',
        html_content,
        css_content: css_content || '',
        js_content: js_content || '',
        upload_source: gpt_thread_id ? 'gpt' : 'manual',
        gpt_thread_id: gpt_thread_id || '',
        design_style: design_style || '',
        color_scheme: color_scheme || '',
        status: 'draft',
        tags: tags || [],
        quality_score: 0,
      });

      // Optionally AI-score the template
      if (auto_score) {
        try {
          const scoreResult = await callAIGateway({
            system: 'You are a web design quality auditor. Score the template 0-100 based on visual hierarchy, conversion design, mobile responsiveness, and SEO structure. Return only a JSON object.',
            prompt: `Title: ${title}\nGallery: ${gallery_id}\nCategory: ${category}\nHTML length: ${html_content.length} chars\nCSS length: ${(css_content || '').length} chars\n\nFirst 2000 chars of HTML:\n${html_content.slice(0, 2000)}`,
            jsonSchema: { type: 'object', properties: { score: { type: 'number' }, notes: { type: 'string' } } },
            maxTokens: 500,
          });
          if (scoreResult.json?.score) {
            await svc.entities.TemplateGallery.update(template.id, {
              quality_score: scoreResult.json.score,
            });
            template.quality_score = scoreResult.json.score;
          }
        } catch {}
      }

      return Response.json({ ok: true, template_id: template.id, quality_score: template.quality_score });
    }

    // ── list — list templates in a gallery or all ──
    if (action === 'list') {
      const { gallery_id, status, limit } = body;
      const query: any = {};
      if (gallery_id) query.gallery_id = gallery_id;
      if (status) query.status = status;

      const records = await svc.entities.TemplateGallery.filter(query, {
        sort: '-created_date',
        limit: limit || 50,
        fields: ['id', 'gallery_id', 'gallery_name', 'title', 'category', 'city', 'description', 'design_style', 'color_scheme', 'quality_score', 'status', 'is_featured', 'thumbnail_url', 'preview_url', 'created_date', 'tags'],
      });

      return Response.json({ templates: records.items || [], has_more: records.has_more });
    }

    // ── listGalleries — return 20 gallery defs with template counts ──
    if (action === 'listGalleries') {
      const galleries = [
        'aurora', 'fortress', 'serenity', 'momentum', 'heritage', 'pulse', 'summit', 'bloom',
        'forge', 'lumin', 'terra', 'velocity', 'haven', 'crystal', 'sage', 'apex',
        'beacon', 'prism', 'grid', 'wave',
      ];
      const galleryNames: Record<string, string> = {
        aurora: 'Aurora', fortress: 'Fortress', serenity: 'Serenity', momentum: 'Momentum',
        heritage: 'Heritage', pulse: 'Pulse', summit: 'Summit', bloom: 'Bloom',
        forge: 'Forge', lumin: 'Lumin', terra: 'Terra', velocity: 'Velocity',
        haven: 'Haven', crystal: 'Crystal', sage: 'Sage', apex: 'Apex',
        beacon: 'Beacon', prism: 'Prism', grid: 'Grid', wave: 'Wave',
      };

      // Get counts per gallery via aggregate
      const agg = await svc.entities.TemplateGallery.aggregate({
        groupBy: 'gallery_id',
        count: true,
        sort: '-count',
        limit: 20,
      });

      const countMap: Record<string, number> = {};
      for (const row of (agg.rows || [])) {
        countMap[row.gallery_id] = row.count;
      }

      return Response.json({
        galleries: galleries.map(id => ({
          id,
          name: galleryNames[id] || id,
          template_count: countMap[id] || 0,
        })),
      });
    }

    // ── score — AI-score a template ──
    if (action === 'score') {
      const { template_id } = body;
      if (!template_id) return Response.json({ error: 'template_id required' }, { status: 400 });

      const template = await svc.entities.TemplateGallery.get(template_id);
      if (!template) return Response.json({ error: 'Template not found' }, { status: 404 });

      const scoreResult = await callAIGateway({
        system: 'You are a web design quality auditor. Score the template 0-100. Return only JSON.',
        prompt: `Title: ${template.title}\nGallery: ${template.gallery_id}\nHTML preview: ${(template.html_content || '').slice(0, 3000)}`,
        jsonSchema: { type: 'object', properties: { score: { type: 'number' }, notes: { type: 'string' } } },
        maxTokens: 500,
      });

      const score = scoreResult.json?.score || 0;
      await svc.entities.TemplateGallery.update(template_id, { quality_score: score });
      return Response.json({ ok: true, score, notes: scoreResult.json?.notes });
    }

    // ── publish / archive / delete ──
    if (action === 'publish') {
      const { template_id } = body;
      await svc.entities.TemplateGallery.update(template_id, { status: 'published' });
      return Response.json({ ok: true });
    }
    if (action === 'archive') {
      const { template_id } = body;
      await svc.entities.TemplateGallery.update(template_id, { status: 'archived' });
      return Response.json({ ok: true });
    }
    if (action === 'delete') {
      const { template_id } = body;
      await svc.entities.TemplateGallery.delete(template_id);
      return Response.json({ ok: true });
    }

    // ── getTemplate — full content for preview ──
    if (action === 'getTemplate') {
      const { template_id } = body;
      const template = await svc.entities.TemplateGallery.get(template_id);
      if (!template) return Response.json({ error: 'Not found' }, { status: 404 });
      return Response.json({ template });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}