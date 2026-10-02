import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { compileFrontend, scoreAllPatterns } from '../../shared/frontendFactory/compiler.ts';
import { registry, REGISTRY_VERSION, countPatterns } from '../../shared/frontendFactory/registry.ts';
import { choosePattern, chooseDomainPack, chooseRecipe, choosePlatformAdapter } from '../../shared/frontendFactory/compatibility.ts';
import type { IntentContract } from '../../shared/frontendFactory/registry.ts';

// ============================================================
// FRONTEND FACTORY — Universal Frontend Factory API
//
// Actions:
//   compile       — Run the full 12-pass quality compiler → BuildSpec
//   scorePatterns — Score all patterns for a given intent (for builder UI)
//   getRegistry   — Return the full pattern registry
//   getStats      — Return registry stats
//   preview       — Generate a quick BuildSpec preview without persisting
// ============================================================

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'getStats';

    // ── getStats ──
    if (action === 'getStats') {
      const stats: Record<string, number> = {};
      for (const [key, val] of Object.entries(registry)) {
        stats[key] = (val as any[]).length;
      }
      return Response.json({
        registry_version: REGISTRY_VERSION,
        total_patterns: countPatterns(),
        pattern_counts: stats,
      });
    }

    // ── getRegistry ──
    if (action === 'getRegistry') {
      // Return pattern names/ids only (not full data to keep response small)
      const summary: Record<string, Array<{ id: string; name: string }>> = {};
      for (const [key, val] of Object.entries(registry)) {
        summary[key] = (val as any[]).map((p) => ({ id: p.id, name: p.name }));
      }
      return Response.json({ registry_version: REGISTRY_VERSION, patterns: summary });
    }

    // ── getRegistryFull (admin only) ──
    if (action === 'getRegistryFull') {
      if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });
      return Response.json({ registry_version: REGISTRY_VERSION, registry });
    }

    // ── scorePatterns ──
    if (action === 'scorePatterns') {
      const intent: IntentContract = {
        platform: body.platform || 'desktop-web',
        product_archetype: body.product_archetype || body.niche || 'local service',
        primary_goal: body.primary_goal || 'convert leads',
        information_density: body.information_density || 'medium',
        interaction_mode: body.interaction_mode || 'browse',
        conversion_mode: body.conversion_mode || 'lead',
        brand_tone: body.brand_tone || 'professional',
        accessibility_needs: body.accessibility_needs || 'standard',
        seed: body.seed || 'preview-seed',
      };
      const scored = scoreAllPatterns(intent);
      return Response.json({ intent, scored });
    }

    // ── compile ──
    if (action === 'compile') {
      if (user.role !== 'admin') return Response.json({ error: 'Admin only — compilation requires admin role' }, { status: 403 });

      const buildSpec = await compileFrontend({
        project_id: body.project_id,
        seed: body.seed || `seed-${Date.now()}`,
        platform: body.platform || 'desktop-web',
        product_archetype: body.product_archetype || body.niche || 'local service',
        primary_goal: body.primary_goal || 'convert leads',
        information_density: body.information_density || 'medium',
        interaction_mode: body.interaction_mode || 'browse',
        conversion_mode: body.conversion_mode || 'lead',
        brand_tone: body.brand_tone || 'professional',
        brand_color: body.brand_color || '#0066ff',
        accessibility_needs: body.accessibility_needs || 'standard',
      });

      return Response.json({ ok: true, build_spec: buildSpec });
    }

    // ── preview (no admin required) ──
    if (action === 'preview') {
      const buildSpec = await compileFrontend({
        project_id: `preview-${Date.now()}`,
        seed: body.seed || `preview-${Date.now()}`,
        platform: body.platform || 'desktop-web',
        product_archetype: body.product_archetype || 'local service',
        primary_goal: body.primary_goal || 'convert leads',
        brand_color: body.brand_color || '#0066ff',
      });

      // Return a slimmed preview
      return Response.json({
        ok: true,
        preview: {
          project_id: buildSpec.project_id,
          seed: buildSpec.seed,
          registry_version: buildSpec.registry_version,
          selected_patterns: buildSpec.selected_patterns,
          screens: buildSpec.screens.map((s) => ({ name: s.name, route: s.route, content_count: s.content.length, states: s.states })),
          validation_result: buildSpec.validation.result,
          validation_checks: buildSpec.validation.checks.length,
        },
      });
    }

    // ── getPattern ──
    if (action === 'getPattern') {
      const { category, id } = body;
      if (!category || !id) return Response.json({ error: 'category and id required' }, { status: 400 });
      const list = (registry as any)[category] as any[];
      if (!list) return Response.json({ error: 'Unknown category' }, { status: 400 });
      const pattern = list.find((p) => p.id === id);
      if (!pattern) return Response.json({ error: 'Pattern not found' }, { status: 404 });
      return Response.json({ pattern });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error('FrontendFactory error:', error.message);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}