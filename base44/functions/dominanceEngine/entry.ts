import { createClientFromRequest } from '../../shared/ownedClient.ts';
import { secrets } from '../../shared/runtimeSecrets.ts';
import { callAIGateway } from '../../shared/aiGateway.ts';

// ============================================================
// DOMINANCE ENGINE — The fully automated, deterministic
// digital dominance pipeline for Strategic Minds AI.
//
// One command chains all 8 phases into a single autonomous pipeline:
//   1. INTELLIGENCE    — search intelligence research + spending patterns
//   2. BRAND_DOMAIN    — name gen + domain check + optional purchase
//   3. INFRASTRUCTURE  — Vercel project + domain attach (via existing infra)
//   4. CONTENT_FLOOD   — generate pages (home, service, location, blog, FAQ)
//   5. PERSONA_FAME    — social empire + directory flooding plan
//   6. TECHNICAL_SEO   — schema, sitemaps, indexing, CWV plan
//   7. AI_SEARCH       — AEO, llms.txt, knowledge panel plan
//   8. CONTINUOUS      — spawn AgentTasks for 24/7 dominance
//
// Deterministic: same input → same campaign_id, same phase order.
// Each phase persists progress to DominanceCampaign entity.
//
// Actions:
//   launch      — start a new campaign (creates entity, runs phase 1)
//   runPhase    — run a specific phase by name
//   runAll      — run all remaining phases sequentially
//   getStatus   — poll campaign progress
//   listActive  — list all running/recent campaigns
//   fameScore   — calculate current fame score
// ============================================================

const PHASES = [
  'intelligence',
  'brand_domain',
  'infrastructure',
  'content_flood',
  'persona_fame',
  'technical_seo',
  'ai_search',
  'continuous',
] as const;

const PHASE_PROGRESS: Record<string, number> = {
  intelligence: 5,
  brand_domain: 15,
  infrastructure: 25,
  content_flood: 45,
  persona_fame: 60,
  technical_seo: 75,
  ai_search: 85,
  continuous: 95,
  completed: 100,
};

function makeCampaignId(keyword: string, city: string, state: string, nicheId: string): string {
  const raw = `${(keyword || '').toLowerCase().trim()}|${(city || '').toLowerCase().trim()}|${(state || '').toLowerCase().trim()}|${nicheId || ''}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + ch;
    hash = hash & 0xffffffff;
  }
  return `dom_${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

function slugify(s: string): string {
  return (s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '');
}

// ── Phase 1: Intelligence ──
async function runIntelligence(base44: any, svc: any, campaign: any): Promise<any> {
  await svc.entities.DominanceCampaign.update(campaign.id, {
    phase: 'intelligence',
    'phase_status.intelligence': 'running',
    current_step_description: 'Researching top searches, competitors, and spending patterns...',
    progress_percent: PHASE_PROGRESS.intelligence,
  });

  // Use AI Gateway with web search to find spending patterns + search intelligence
  let intel: any = { top_searches: [], competitors: [], spending_patterns: [] };
  try {
    const searchResult = await callAIGateway({
      system: 'You are a digital dominance intelligence analyst. Return concise JSON only.',
      prompt: `Research the market for "${campaign.keyword}" in ${campaign.city || ''} ${campaign.state || ''}. 

Identify:
1. Top 20 search queries people use (with estimated monthly volumes)
2. Top 10 competitors currently ranking
3. Spending patterns — what are people paying for, ad spend patterns, price ranges
4. Content gaps competitors are missing
5. Seasonal trends

Return JSON: { "top_searches": [{"query": "...", "volume": 0}], "competitors": [{"name": "...", "url": "...", "strength": "..."}], "spending_patterns": "...", "content_gaps": ["..."], "seasonal_trends": "..." }`,
      jsonSchema: { type: 'object' },
    });
    intel = searchResult.json || { raw: searchResult.content };
  } catch (e: any) {
    intel = { error: e.message, note: 'AI Gateway search failed — using minimal intelligence' };
  }

  // Also check existing Domain records for this keyword
  const existingDomains = await svc.entities.Domain.filter(
    { domain: { $regex: slugify(campaign.keyword), $options: 'i' } },
    { limit: 10 }
  ).catch(() => []);

  await svc.entities.DominanceCampaign.update(campaign.id, {
    'phase_status.intelligence': 'completed',
    intelligence_data: JSON.stringify(intel).slice(0, 10000),
    progress_percent: 12,
    current_step_description: `Intelligence complete: ${intel.top_searches?.length || 0} searches, ${intel.competitors?.length || 0} competitors identified`,
  });

  return intel;
}

// ── Phase 2: Brand & Domain ──
async function runBrandDomain(base44: any, svc: any, campaign: any): Promise<any> {
  await svc.entities.DominanceCampaign.update(campaign.id, {
    phase: 'brand_domain',
    'phase_status.brand_domain': 'running',
    current_step_description: 'Generating business names and checking domain availability...',
    progress_percent: PHASE_PROGRESS.brand_domain,
  });

  // Generate business names via AI Gateway
  let names: any[] = [];
  try {
    const nameResult = await callAIGateway({
      system: 'You are a brand naming expert. Return JSON only.',
      prompt: `Generate 10 business names for a ${campaign.keyword} business in ${campaign.city || ''} ${campaign.state || ''}. 
Each name should be brandable, memorable, and work as a .com domain.
Return JSON: { "names": [{ "business_name": "...", "domain_suggestion": "name.com", "rationale": "..." }] }`,
      jsonSchema: { type: 'object' },
    });
    names = nameResult.json?.names || [];
  } catch { names = []; }

  // Check domain availability via RDAP
  const checkDomain = async (domain: string) => {
    try {
      const res = await fetch(`https://rdap.org/domain/${domain}`, {
        signal: AbortSignal.timeout(5000),
        headers: { Accept: 'application/rdap+json' }
      });
      if (res.status === 404) return { domain, available: true };
      if (res.ok) return { domain, available: false };
      return { domain, available: null };
    } catch {
      return { domain, available: null };
    }
  };

  const domainsToCheck = names.slice(0, 10).map(n => n.domain_suggestion || `${slugify(n.business_name)}.com`);
  const domainResults = await Promise.all(domainsToCheck.map(d => checkDomain(d)));
  const availableDomain = domainResults.find(d => d.available === true);

  const bestName = names[0]?.business_name || `${campaign.keyword} ${campaign.city}`.trim();
  const domain = availableDomain?.domain || `${slugify(bestName)}.com`;

  let domainPurchased = false;
  if (campaign.auto_purchase_domain && availableDomain) {
    try {
      const purchaseRes = await base44.functions.invoke('domainOperations', {
        action: 'purchase_domain',
        domain,
      });
      domainPurchased = !purchaseRes.data?.error;
    } catch { domainPurchased = false; }
  }

  // Store in DomainInventory
  await svc.entities.DomainInventory.create({
    domain,
    status: availableDomain ? 'available' : 'unavailable',
    tld: domain.split('.').pop(),
    notes: `Campaign ${campaign.campaign_id}: ${bestName}`,
  }).catch(() => {});

  await svc.entities.DominanceCampaign.update(campaign.id, {
    'phase_status.brand_domain': 'completed',
    business_name: bestName,
    domain,
    domain_purchased: domainPurchased,
    progress_percent: 22,
    current_step_description: `Brand: ${bestName} | Domain: ${domain} | Purchased: ${domainPurchased}`,
  });

  return { business_name: bestName, domain, domain_purchased: domainPurchased };
}

// ── Phase 3: Infrastructure ──
async function runInfrastructure(base44: any, svc: any, campaign: any): Promise<any> {
  await svc.entities.DominanceCampaign.update(campaign.id, {
    phase: 'infrastructure',
    'phase_status.infrastructure': 'running',
    current_step_description: 'Provisioning Vercel project and GitHub repo...',
    progress_percent: PHASE_PROGRESS.infrastructure,
  });

  let infra: any = { vercel_project_id: '', github_repo: '' };
  
  if (campaign.auto_deploy_vercel) {
    try {
      const vercelRes = await base44.functions.invoke('provisionClientInfrastructure', {
        name: campaign.business_name,
        domain: campaign.domain,
        capabilities: ['code'],
      });
      infra.vercel_project_id = vercelRes.data?.vercel_id || '';
      infra.vercel_url = vercelRes.data?.vercel_url || '';
    } catch (e: any) {
      infra.vercel_error = e.message;
    }
  }

  await svc.entities.DominanceCampaign.update(campaign.id, {
    'phase_status.infrastructure': 'completed',
    vercel_project_id: infra.vercel_project_id,
    vercel_deployment_url: infra.vercel_url,
    progress_percent: 35,
    current_step_description: `Infrastructure: Vercel ${infra.vercel_project_id ? 'provisioned' : 'skipped'}`,
  });

  return infra;
}

// ── Phase 4: Content Flood ──
async function runContentFlood(base44: any, svc: any, campaign: any): Promise<any> {
  await svc.entities.DominanceCampaign.update(campaign.id, {
    phase: 'content_flood',
    'phase_status.content_flood': 'running',
    current_step_description: 'Generating SEO pages (home, service, location, blog, FAQ)...',
    progress_percent: PHASE_PROGRESS.content_flood,
  });

  const intel = campaign.intelligence_data ? JSON.parse(campaign.intelligence_data) : {};
  const topSearches = intel.top_searches || [];

  // Generate page specs via AI Gateway
  let pageSpecs: any[] = [];
  try {
    const pageResult = await callAIGateway({
      system: 'You are an SEO content strategist. Return JSON only.',
      prompt: `Generate a content plan for "${campaign.keyword}" business "${campaign.business_name}" in ${campaign.city || ''} ${campaign.state || ''}.

Based on these top searches: ${JSON.stringify(topSearches.slice(0, 10))}

Generate page specifications for:
1. Homepage (1)
2. Service pages (5-10 main services)
3. Location pages (if city-based, generate 10-20 nearby city pages)
4. Blog posts (10 articles targeting long-tail keywords)
5. FAQ page (1 with 20+ FAQs)

Return JSON: { "pages": [{ "type": "home|service|location|blog|faq", "slug": "...", "title": "...", "meta_description": "...", "h1": "...", "target_keyword": "...", "content_outline": "..." }] }`,
      jsonSchema: { type: 'object' },
    });
    pageSpecs = pageResult.json?.pages || [];
  } catch { pageSpecs = []; }

  // Create SystemBuild records for each page
  const builds = pageSpecs.map((spec, i) => ({
    title: `${campaign.business_name} — ${spec.title}`,
    build_type: 'website' as const,
    what_to_build: spec.content_outline || spec.title,
    how_it_looks: 'Modern, professional, mobile-first, fast loading',
    how_it_functions: `SEO-optimized page targeting "${spec.target_keyword || spec.title}"`,
    what_it_connects_to: 'Google Search Console, Analytics, IndexNow',
    what_it_says: spec.meta_description || '',
    how_it_operates: 'Auto-updated via autonomous SEO dominance engine',
    deliver_to: `${campaign.domain}/${spec.slug}`,
    status: 'spec_submitted' as const,
  }));

  if (builds.length > 0) {
    for (let i = 0; i < builds.length; i += 500) {
      await svc.entities.SystemBuild.bulkCreate(builds.slice(i, i + 500));
    }
  }

  const pageTypes = [...new Set(pageSpecs.map(p => p.type))];

  // ── Generate actual homepage HTML ──
  let generatedHtml = '';
  try {
    const htmlResult = await callAIGateway({
      system: 'You are a world-class web developer. Generate a complete, self-contained, production-quality HTML page. Return ONLY the HTML — no markdown, no explanation, no code fences.',
      prompt: `Generate a complete, beautiful, modern, responsive homepage HTML for "${campaign.business_name}", a ${campaign.keyword} company in ${campaign.city || ''} ${campaign.state || ''}.

Requirements:
- Full <!doctype html> document with inline <style> in the <head>
- Modern, professional design with a hero section, services grid, about section, testimonials, CTA, and footer
- Mobile-responsive with CSS media queries
- Include a contact phone number: 772-209-0266
- Use a blue color scheme (#0066FF primary, #004CE6 accent)
- SEO-optimized: proper title, meta description, semantic HTML, h1/h2 tags
- Include these services: ${(pageSpecs.filter(s => s.type === 'service').map(s => s.title).slice(0, 6).join(', ')) || 'Professional services'}
- Include a call-to-action button linking to #contact
- Self-contained: no external CSS/JS files, no external images (use CSS gradients or inline SVG)
- Keep the HTML under 30000 characters

Return ONLY the raw HTML. Start with <!doctype html> and end with </html>.`,
    });
    generatedHtml = (htmlResult.content || '').trim();
    // Strip markdown code fences if the model added them
    generatedHtml = generatedHtml.replace(/^```html?\s*/i, '').replace(/```\s*$/i, '').trim();
  } catch (e: any) {
    // Fallback: generate a basic HTML page from the page specs
    const services = pageSpecs.filter(s => s.type === 'service').slice(0, 6).map(s => s.title);
    generatedHtml = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${campaign.business_name} | ${campaign.keyword} in ${campaign.city || ''} ${campaign.state || ''}</title><style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;color:#0d121c;line-height:1.6}
.hero{background:linear-gradient(135deg,#0066FF,#004CE6);color:#fff;padding:80px 20px;text-align:center}
.hero h1{font-size:2.5rem;margin-bottom:16px}.hero p{font-size:1.2rem;opacity:.9;max-width:600px;margin:0 auto 24px}
.btn{display:inline-block;background:#fff;color:#0066FF;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700}
.services{max-width:1000px;margin:0 auto;padding:60px 20px}.services h2{text-align:center;font-size:2rem;margin-bottom:40px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:24px}
.card{border:1px solid #e5e7eb;border-radius:12px;padding:24px}.card h3{color:#0066FF;margin-bottom:8px}
.cta{background:#f5f9ff;padding:60px 20px;text-align:center}.cta h2{font-size:2rem;margin-bottom:16px}
.cta a{background:#0066FF;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block}
footer{background:#0d121c;color:#fff;padding:40px 20px;text-align:center}footer a{color:#6ab8ff}
@media(max-width:600px){.hero h1{font-size:1.8rem}.grid{grid-template-columns:1fr}}
</style></head><body>
<div class="hero"><h1>${campaign.business_name}</h1><p>Professional ${campaign.keyword} services in ${campaign.city || ''} ${campaign.state || ''}. Quality work, competitive pricing, fast turnaround.</p><a href="#contact" class="btn">Get a Free Quote</a></div>
<div class="services"><h2>Our Services</h2><div class="grid">${services.map(s => `<div class="card"><h3>${s}</h3><p>Expert ${s.toLowerCase()} solutions tailored to your needs.</p></div>`).join('')}</div></div>
<div class="cta" id="contact"><h2>Ready to Get Started?</h2><p>Call us today at <a href="tel:7722090266" style="color:#0066FF;font-weight:700">772-209-0266</a></p><a href="tel:7722090266">Call Now</a></div>
<footer><p>&copy; ${new Date().getFullYear()} ${campaign.business_name}. All rights reserved.</p><p>Phone: 772-209-0266</p></footer>
</body></html>`;
  }

  await svc.entities.DominanceCampaign.update(campaign.id, {
    'phase_status.content_flood': 'completed',
    pages_generated: pageSpecs.length,
    page_types: pageTypes,
    generated_html: generatedHtml.slice(0, 200000),
    progress_percent: 55,
    current_step_description: `Content flood: ${pageSpecs.length} pages generated, homepage HTML ready (${generatedHtml.length} chars)`,
  });

  return { pages_generated: pageSpecs.length, page_types: pageTypes, html_generated: true };
}

// ── Phase 5: Persona & Fame ──
async function runPersonaFame(base44: any, svc: any, campaign: any): Promise<any> {
  await svc.entities.DominanceCampaign.update(campaign.id, {
    phase: 'persona_fame',
    'phase_status.persona_fame': 'running',
    current_step_description: 'Generating persona and social empire plan...',
    progress_percent: PHASE_PROGRESS.persona_fame,
  });

  let persona: any = {};
  try {
    const personaResult = await callAIGateway({
      system: 'You are a personal branding and digital fame expert. Return JSON only.',
      prompt: `Create a founder persona and social empire plan for "${campaign.business_name}", a ${campaign.keyword} company in ${campaign.city || ''} ${campaign.state || ''}.

Generate:
1. Founder persona name and bio
2. Platforms to join (LinkedIn, YouTube, Yelp, Instagram, Facebook, X, TikTok, etc.)
3. Content strategy for each platform
4. Directory submission plan (50+ directories)
5. Fame score projection (0-100)

Return JSON: { "persona_name": "...", "persona_bio": "...", "platforms": [{"name": "...", "strategy": "..."}], "directories": ["..."], "projected_fame_score": 0 }`,
      jsonSchema: { type: 'object' },
    });
    persona = personaResult.json || {};
  } catch { persona = {}; }

  const platforms = (persona.platforms || []).map((p: any) => p.name);

  await svc.entities.DominanceCampaign.update(campaign.id, {
    'phase_status.persona_fame': 'completed',
    platforms_joined: platforms,
    fame_score: persona.projected_fame_score || 0,
    fame_breakdown: JSON.stringify(persona).slice(0, 5000),
    progress_percent: 70,
    current_step_description: `Persona: ${persona.persona_name || 'N/A'} | Platforms: ${platforms.length} | Fame: ${persona.projected_fame_score || 0}/100`,
  });

  return persona;
}

// ── Phase 6: Technical SEO ──
async function runTechnicalSeo(base44: any, svc: any, campaign: any): Promise<any> {
  await svc.entities.DominanceCampaign.update(campaign.id, {
    phase: 'technical_seo',
    'phase_status.technical_seo': 'running',
    current_step_description: 'Planning schema, sitemaps, Core Web Vitals, and indexing...',
    progress_percent: PHASE_PROGRESS.technical_seo,
  });

  // Dispatch AgentTasks for technical SEO work
  const tasks = [
    {
      agent_name: 'growth_operator',
      task_type: 'content_optimize',
      title: `Technical SEO: ${campaign.business_name}`,
      description: JSON.stringify({ domain: campaign.domain, campaign_id: campaign.campaign_id, work: 'schema_markup_sitemap_cwv' }),
      priority: 'high',
      autonomous: true,
      status: 'pending',
    },
    {
      agent_name: 'growth_operator',
      task_type: 'google_connect',
      title: `GSC + Analytics: ${campaign.business_name}`,
      description: JSON.stringify({ domain: campaign.domain, campaign_id: campaign.campaign_id }),
      priority: 'high',
      autonomous: true,
      status: 'pending',
    },
  ];

  const createdTasks = await svc.entities.AgentTask.bulkCreate(tasks);

  await svc.entities.DominanceCampaign.update(campaign.id, {
    'phase_status.technical_seo': 'completed',
    swarm_tasks_spawned: [...(campaign.swarm_tasks_spawned || []), ...createdTasks.map((t: any) => t.id)],
    progress_percent: 82,
    current_step_description: `Technical SEO: ${tasks.length} tasks dispatched (schema, sitemap, GSC, CWV)`,
  });

  return { tasks_dispatched: tasks.length };
}

// ── Phase 7: AI Search ──
async function runAiSearch(base44: any, svc: any, campaign: any): Promise<any> {
  await svc.entities.DominanceCampaign.update(campaign.id, {
    phase: 'ai_search',
    'phase_status.ai_search': 'running',
    current_step_description: 'Planning AEO, llms.txt, and knowledge panel...',
    progress_percent: PHASE_PROGRESS.ai_search,
  });

  let aeoPlan: any = {};
  try {
    const aeoResult = await callAIGateway({
      system: 'You are an AI search optimization expert. Return JSON only.',
      prompt: `Create an AI Search / AEO plan for "${campaign.business_name}" (${campaign.domain}).

Include:
1. llms.txt content (AI-readable site summary)
2. AEO-optimized FAQ schema (20 Q&As AI assistants would answer about this business)
3. Knowledge panel optimization steps
4. Entity registration plan (Wikidata, Google Business Profile, etc.)

Return JSON: { "llms_txt": "...", "aeo_faqs": [{"question": "...", "answer": "..."}], "knowledge_panel_steps": ["..."], "entity_registrations": ["..."] }`,
      jsonSchema: { type: 'object' },
    });
    aeoPlan = aeoResult.json || {};
  } catch { aeoPlan = {}; }

  await svc.entities.DominanceCampaign.update(campaign.id, {
    'phase_status.ai_search': 'completed',
    progress_percent: 90,
    current_step_description: `AI Search: ${aeoPlan.aeo_faqs?.length || 0} AEO FAQs, llms.txt generated`,
  });

  return aeoPlan;
}

// ── Phase 8: Continuous ──
async function runContinuous(base44: any, svc: any, campaign: any): Promise<any> {
  await svc.entities.DominanceCampaign.update(campaign.id, {
    phase: 'continuous',
    'phase_status.continuous': 'running',
    current_step_description: 'Spawning continuous dominance tasks...',
    progress_percent: PHASE_PROGRESS.continuous,
  });

  // Dispatch ongoing tasks for the swarm
  const continuousTasks = [
    {
      agent_name: 'growth_operator',
      task_type: 'growth_audit',
      title: `Ongoing growth audit: ${campaign.business_name}`,
      description: JSON.stringify({ domain: campaign.domain, campaign_id: campaign.campaign_id, recurring: true }),
      priority: 'medium',
      autonomous: true,
      status: 'pending',
    },
    {
      agent_name: 'social_strategist',
      task_type: 'content_optimize',
      title: `Social content: ${campaign.business_name}`,
      description: JSON.stringify({ domain: campaign.domain, campaign_id: campaign.campaign_id, platforms: campaign.platforms_joined }),
      priority: 'medium',
      autonomous: true,
      status: 'pending',
    },
    {
      agent_name: 'sales_engine',
      task_type: 'content_optimize',
      title: `Lead generation: ${campaign.business_name}`,
      description: JSON.stringify({ domain: campaign.domain, campaign_id: campaign.campaign_id, niche: campaign.keyword }),
      priority: 'high',
      autonomous: true,
      status: 'pending',
    },
  ];

  const createdTasks = await svc.entities.AgentTask.bulkCreate(continuousTasks);
  const allTaskIds = [...(campaign.swarm_tasks_spawned || []), ...createdTasks.map((t: any) => t.id)];

  await svc.entities.DominanceCampaign.update(campaign.id, {
    'phase_status.continuous': 'completed',
    phase: 'completed',
    status: 'completed',
    swarm_tasks_spawned: allTaskIds,
    progress_percent: 100,
    current_step_description: `Campaign complete. ${continuousTasks.length} continuous dominance tasks active.`,
    completed_at: new Date().toISOString(),
    duration_ms: Date.now() - new Date(campaign.started_at || campaign.created_date).getTime(),
  });

  return { continuous_tasks: continuousTasks.length, total_tasks: allTaskIds.length };
}

const PHASE_RUNNERS: Record<string, (base44: any, svc: any, campaign: any) => Promise<any>> = {
  intelligence: runIntelligence,
  brand_domain: runBrandDomain,
  infrastructure: runInfrastructure,
  content_flood: runContentFlood,
  persona_fame: runPersonaFame,
  technical_seo: runTechnicalSeo,
  ai_search: runAiSearch,
  continuous: runContinuous,
};

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'listActive';

    // ── launch ──
    if (action === 'launch') {
      const { keyword, city, state, niche_id, auto_purchase_domain, auto_deploy_vercel } = body;
      if (!keyword) return Response.json({ error: 'keyword is required' }, { status: 400 });

      const campaignId = makeCampaignId(keyword, city || '', state || '', niche_id || '');

      // Check if campaign already exists
      const existing = await svc.entities.DominanceCampaign.filter({ campaign_id: campaignId }, { limit: 1 });
      if (existing.items?.length > 0) {
        return Response.json({ error: 'Campaign already exists', campaign_id: campaignId, existing: existing.items[0] }, { status: 409 });
      }

      const campaign = await svc.entities.DominanceCampaign.create({
        campaign_id: campaignId,
        niche_id: niche_id || '',
        keyword: keyword.toLowerCase().trim(),
        city: city || '',
        state: state || '',
        phase: 'intelligence',
        status: 'running',
        auto_purchase_domain: auto_purchase_domain || false,
        auto_deploy_vercel: auto_deploy_vercel !== false,
        started_at: new Date().toISOString(),
        progress_percent: 0,
        current_step_description: 'Campaign launched — starting intelligence phase...',
      });

      // Run phase 1
      try {
        await runIntelligence(base44, svc, campaign);
      } catch (e: any) {
        await svc.entities.DominanceCampaign.update(campaign.id, { status: 'failed', error: e.message });
        return Response.json({ error: 'Intelligence phase failed', detail: e.message, campaign_id: campaignId }, { status: 500 });
      }

      return Response.json({ ok: true, campaign_id: campaignId, phase: 'intelligence', status: 'running' });
    }

    // ── runPhase ──
    if (action === 'runPhase') {
      const { campaign_id, phase_name } = body;
      if (!campaign_id || !phase_name) return Response.json({ error: 'campaign_id and phase_name required' }, { status: 400 });

      const records = await svc.entities.DominanceCampaign.filter({ campaign_id }, { limit: 1 });
      const campaign = records.items?.[0];
      if (!campaign) return Response.json({ error: 'Campaign not found' }, { status: 404 });

      const runner = PHASE_RUNNERS[phase_name];
      if (!runner) return Response.json({ error: `Unknown phase: ${phase_name}` }, { status: 400 });

      const result = await runner(base44, svc, campaign);
      return Response.json({ ok: true, campaign_id, phase: phase_name, result });
    }

    // ── runAll ──
    if (action === 'runAll') {
      const { campaign_id } = body;
      if (!campaign_id) return Response.json({ error: 'campaign_id required' }, { status: 400 });

      const records = await svc.entities.DominanceCampaign.filter({ campaign_id }, { limit: 1 });
      let campaign = records.items?.[0];
      if (!campaign) return Response.json({ error: 'Campaign not found' }, { status: 404 });

      const trace = [];
      for (const phase of PHASES) {
        const phaseStatus = campaign.phase_status?.[phase];
        if (phaseStatus === 'completed') continue;

        trace.push({ phase, status: 'starting' });
        try {
          const result = await PHASE_RUNNERS[phase](base44, svc, campaign);
          trace.push({ phase, status: 'completed', result: JSON.stringify(result).slice(0, 500) });
          // Re-read campaign to get updated state
          const updated = await svc.entities.DominanceCampaign.filter({ campaign_id }, { limit: 1 });
          campaign = updated.items?.[0];
        } catch (e: any) {
          trace.push({ phase, status: 'failed', error: e.message });
          await svc.entities.DominanceCampaign.update(campaign.id, { status: 'failed', error: `Phase ${phase} failed: ${e.message}` });
          break;
        }
      }

      return Response.json({ ok: true, campaign_id, trace, final_status: campaign.status });
    }

    // ── getStatus ──
    if (action === 'getStatus') {
      const { campaign_id } = body;
      if (!campaign_id) return Response.json({ error: 'campaign_id required' }, { status: 400 });

      const records = await svc.entities.DominanceCampaign.filter({ campaign_id }, { limit: 1 });
      const campaign = records.items?.[0];
      if (!campaign) return Response.json({ error: 'Campaign not found' }, { status: 404 });

      return Response.json({
        campaign_id,
        keyword: campaign.keyword,
        city: campaign.city,
        business_name: campaign.business_name,
        domain: campaign.domain,
        phase: campaign.phase,
        status: campaign.status,
        progress_percent: campaign.progress_percent,
        current_step: campaign.current_step_description,
        pages_generated: campaign.pages_generated,
        fame_score: campaign.fame_score,
        swarm_tasks: (campaign.swarm_tasks_spawned || []).length,
        phase_status: campaign.phase_status,
      });
    }

    // ── listActive ──
    if (action === 'listActive') {
      const records = await svc.entities.DominanceCampaign.filter(
        { status: { $in: ['running', 'completed', 'failed'] } },
        { sort: '-created_date', limit: 50 }
      );
      return Response.json({
        campaigns: (records.items || []).map((c: any) => ({
          campaign_id: c.campaign_id,
          keyword: c.keyword,
          city: c.city,
          business_name: c.business_name,
          domain: c.domain,
          phase: c.phase,
          status: c.status,
          progress: c.progress_percent,
          pages: c.pages_generated,
          fame: c.fame_score,
        })),
      });
    }

    // ── fameScore ──
    if (action === 'fameScore') {
      const { campaign_id } = body;
      const records = await svc.entities.DominanceCampaign.filter({ campaign_id }, { limit: 1 });
      const campaign = records.items?.[0];
      if (!campaign) return Response.json({ error: 'Campaign not found' }, { status: 404 });

      const platforms = campaign.platforms_joined || [];
      const pages = campaign.pages_generated || 0;
      const tasks = (campaign.swarm_tasks_spawned || []).length;

      const fameScore = Math.min(100, Math.round(
        (platforms.length * 5) + (Math.min(pages, 500) / 500 * 30) + (tasks * 3) + 10
      ));

      await svc.entities.DominanceCampaign.update(campaign.id, { fame_score: fameScore });

      return Response.json({
        campaign_id,
        fame_score: fameScore,
        breakdown: {
          platforms: platforms.length * 5,
          pages: Math.min(pages, 500) / 500 * 30,
          tasks: tasks * 3,
          base: 10,
        },
      });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}