import { createClientFromRequest } from '../../shared/ownedClient.ts';
import { getSupabaseUser } from '../../shared/supabaseAuth.ts';
import { callAIGateway } from '../../shared/aiGateway.ts';

// ============================================================
// MASS LAUNCH — Universal nationwide website production engine.
//
// Takes a business category + list of cities + brand config and
// batch-creates DominanceCampaign records for every city. Each
// campaign runs the 8-phase dominance pipeline (intelligence →
// brand_domain → infrastructure → content_flood → persona_fame →
// technical_seo → ai_search → continuous).
//
// Also creates a MassBuildProject to track the batch, optionally
// syncs the launch plan to ChatGPT via gptSync, and provisions
// Vercel + GitHub infrastructure for each site.
//
// Actions:
//   createBatch  — create a MassBuildProject + N DominanceCampaigns
//   listBatches  — list all mass launch batches
//   getBatch    — get a batch with its campaigns
//   syncToGpt   — push the batch plan to ChatGPT for bidirectional sync
// ============================================================

function makeCampaignId(keyword: string, city: string, state: string): string {
  const raw = `${(keyword || '').toLowerCase().trim()}|${(city || '').toLowerCase().trim()}|${(state || '').toLowerCase().trim()}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + ch;
    hash = hash & 0xffffffff;
  }
  return `dom_${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

function parseCityEntry(entry: string): { city: string; state: string } {
  const parts = entry.split(',').map(s => s.trim());
  return { city: parts[0] || '', state: parts[1] || '' };
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await getSupabaseUser(req);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });

    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'listBatches';

    // ── createBatch ──
    if (action === 'createBatch') {
      const { category_id, category_label, keyword, services, cities, config, auto_deploy_vercel, auto_purchase_domain, sync_to_gpt, run_full_pipeline } = body;
      if (!category_id || !cities?.length) {
        return Response.json({ error: 'category_id and cities are required' }, { status: 400 });
      }

      const batchName = `${category_label || category_id} Nationwide Launch — ${cities.length} cities`;

      // Create the MassBuildProject
      const batch = await svc.entities.MassBuildProject.create({
        name: batchName,
        industry: category_id,
        template_id: 'universal_dominance',
        cities,
        website_names: [],
        name_strategy: 'cycle_names',
        background_color: config?.primaryColor || '#0066FF',
        accent_color: config?.accentColor || '#004CE6',
        color_strategy: 'fixed',
        tones: [config?.tone || 'professional'],
        site_count_target: cities.length,
        auto_provision_vercel: auto_deploy_vercel !== false,
        status: 'generating',
        total_sites: cities.length,
        current_step: 'logos',
        logs: [`Batch created: ${batchName}`],
      });

      // Create a DominanceCampaign for each city
      const campaigns: any[] = [];
      for (const cityEntry of cities) {
        const { city, state } = parseCityEntry(cityEntry);
        const campaignId = makeCampaignId(keyword || category_id, city, state);

        // Check if campaign already exists (idempotent)
        const existing = await svc.entities.DominanceCampaign.filter({ campaign_id: campaignId }, { limit: 1 });
        if (existing.items?.length > 0) {
          campaigns.push({ campaign_id: campaignId, city, state, status: 'already_exists', ...existing.items[0] });
          continue;
        }

        const campaign = await svc.entities.DominanceCampaign.create({
          campaign_id: campaignId,
          niche_id: category_id,
          keyword: (keyword || category_id).toLowerCase().trim(),
          city,
          state,
          phase: 'intelligence',
          status: 'running',
          auto_purchase_domain: auto_purchase_domain || false,
          auto_deploy_vercel: auto_deploy_vercel !== false,
          started_at: new Date().toISOString(),
          progress_percent: 0,
          current_step_description: `Queued in batch ${batch.id}`,
        });

        campaigns.push({
          campaign_id: campaignId,
          city,
          state,
          status: 'created',
          campaign_id_ref: campaign.id,
        });
      }

      // Update batch with generated count
      await svc.entities.MassBuildProject.update(batch.id, {
        generated_count: campaigns.length,
        logs: [...(batch.logs || []), `Created ${campaigns.length} campaigns`],
      });

      // Optionally sync to GPT
      let gptSyncResult = null;
      if (sync_to_gpt) {
        try {
          const gptRes = await base44.functions.invoke('gptSync', {
            action: 'sync',
            message: `MASS LAUNCH PLAN:\nCategory: ${category_label}\nKeyword: ${keyword}\nCities: ${cities.join(', ')}\nServices: (services?.join(', '))\nBrand: ${config?.primaryColor} / ${config?.accentColor}\nPhone: ${config?.phone}\nTone: ${config?.tone}\nTotal sites: ${cities.length}\n\nEach site will run the 8-phase dominance pipeline. Please acknowledge and prepare to receive webpack uploads for each city.`,
            instructions: 'You are the Strategic Minds AI mass launch coordinator. Acknowledge this batch plan and prepare to receive and process webpack uploads for each city website.',
          });
          gptSyncResult = gptRes.data;
        } catch (e: any) {
          gptSyncResult = { error: e.message };
        }
      }

      // Launch the first campaign's intelligence phase (async, non-blocking)
      // The rest will be picked up by polling or manual runAll
      if (run_full_pipeline && campaigns.length > 0) {
        const first = campaigns.find(c => c.status === 'created');
        if (first) {
          try {
            await base44.functions.invoke('dominanceEngine', {
              action: 'runAll',
              campaign_id: first.campaign_id,
            });
          } catch (e: any) {
            // Non-fatal — campaigns are queued and can be run later
          }
        }
      }

      return Response.json({
        ok: true,
        batch_id: batch.id,
        batch_name: batchName,
        total_campaigns: campaigns.length,
        campaigns,
        gpt_sync: gptSyncResult,
      });
    }

    // ── listBatches ──
    if (action === 'listBatches') {
      const records = await svc.entities.MassBuildProject.filter(
        { industry: { $exists: true } },
        { sort: '-created_date', limit: 50 }
      );
      return Response.json({
        batches: (records.items || []).map((b: any) => ({
          id: b.id,
          name: b.name,
          industry: b.industry,
          total_sites: b.total_sites,
          generated_count: b.generated_count,
          deployed_count: b.deployed_count,
          status: b.status,
          created_date: b.created_date,
        })),
      });
    }

    // ── getBatch ──
    if (action === 'getBatch') {
      const { batch_id } = body;
      if (!batch_id) return Response.json({ error: 'batch_id required' }, { status: 400 });

      const batch = await svc.entities.MassBuildProject.get(batch_id);
      if (!batch) return Response.json({ error: 'Batch not found' }, { status: 404 });

      // Get all campaigns for this batch's industry/cities
      const campaignRecords = await svc.entities.DominanceCampaign.filter(
        { niche_id: batch.industry },
        { sort: '-created_date', limit: 500 }
      );

      // Filter to only cities in this batch
      const batchCities = new Set((batch.cities || []).map((c: string) => c.toLowerCase()));
      const campaigns = (campaignRecords.items || []).filter((c: any) =>
        batchCities.has(`${c.city}, ${c.state}`.toLowerCase())
      );

      return Response.json({
        batch: {
          id: batch.id,
          name: batch.name,
          industry: batch.industry,
          status: batch.status,
          total_sites: batch.total_sites,
          generated_count: batch.generated_count,
          deployed_count: batch.deployed_count,
        },
        campaigns: campaigns.map((c: any) => ({
          campaign_id: c.campaign_id,
          keyword: c.keyword,
          city: c.city,
          state: c.state,
          business_name: c.business_name,
          domain: c.domain,
          phase: c.phase,
          status: c.status,
          progress_percent: c.progress_percent,
          vercel_deployment_url: c.vercel_deployment_url,
        })),
      });
    }

    // ── syncToGpt ──
    if (action === 'syncToGpt') {
      const { batch_id } = body;
      if (!batch_id) return Response.json({ error: 'batch_id required' }, { status: 400 });

      const batch = await svc.entities.MassBuildProject.get(batch_id);
      if (!batch) return Response.json({ error: 'Batch not found' }, { status: 404 });

      const gptRes = await base44.functions.invoke('gptSync', {
        action: 'sync',
        message: `BATCH SYNC: ${batch.name}\nIndustry: ${batch.industry}\nCities: ${(batch.cities || []).join(', ')}\nTotal: ${batch.total_sites} sites\nStatus: ${batch.status}\n\nPlease review this mass launch batch and prepare webpack templates for each city.`,
        instructions: 'You are the Strategic Minds AI mass launch coordinator. Review the batch and generate webpack templates for each city website.',
      });

      return Response.json({ ok: true, gpt_response: gptRes.data });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}