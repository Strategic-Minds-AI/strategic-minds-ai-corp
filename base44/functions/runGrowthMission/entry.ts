import { createClientFromRequest } from '../../shared/ownedClient.ts';
import { callAIGateway } from '../../shared/aiGateway.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const domainName = (body.domain || '').trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!domainName) return Response.json({ error: 'Domain is required' }, { status: 400 });

    const trace: any[] = [];
    const addTrace = (stage: string, detail: any = {}) => trace.push({ stage, ...detail });

    // Stage 1: Load or create domain record
    addTrace('load_domain', { domain: domainName });
    let domainRecord: any;
    const existing = await base44.entities.Domain.filter({ domain: domainName }, { limit: 1 });
    if (existing.items && existing.items.length > 0) {
      domainRecord = existing.items[0];
      addTrace('load_domain', { found: true, id: domainRecord.id });
    } else {
      domainRecord = await base44.entities.Domain.create({
        domain: domainName,
        canonical_url: `https://${domainName}`,
        status: 'active'
      });
      addTrace('create_domain', { created: true, id: domainRecord.id });
    }

    // Stage 2: Fetch robots.txt
    let robotsTxt = '';
    let sitemapUrl = '';
    try {
      const robotsRes = await fetch(`https://${domainName}/robots.txt`, { signal: AbortSignal.timeout(10000) });
      if (robotsRes.ok) {
        robotsTxt = await robotsRes.text();
        const sitemapMatch = robotsTxt.match(/Sitemap:\s*(\S+)/i);
        if (sitemapMatch) sitemapUrl = sitemapMatch[1];
      }
      addTrace('fetch_robots', { found: !!robotsTxt, sitemap: sitemapUrl || 'none' });
    } catch (e) {
      addTrace('fetch_robots', { error: 'fetch failed' });
    }

    // Stage 3: Discover sitemap
    if (!sitemapUrl) {
      sitemapUrl = `https://${domainName}/sitemap.xml`;
      addTrace('discover_sitemap', { guessed: sitemapUrl });
    } else {
      addTrace('discover_sitemap', { from_robots: sitemapUrl });
    }

    // Stage 4: Inspect sitemap & count URLs
    let sitemapOk = false;
    let urlCount = 0;
    try {
      const smRes = await fetch(sitemapUrl, { signal: AbortSignal.timeout(10000) });
      if (smRes.ok) {
        const smText = await smRes.text();
        sitemapOk = true;
        const locMatches = smText.match(/<loc>/g);
        urlCount = locMatches ? locMatches.length : 0;
      }
      addTrace('inspect_sitemap', { ok: sitemapOk, urls: urlCount });
    } catch (e) {
      addTrace('inspect_sitemap', { error: 'fetch failed' });
    }

    // Stage 5: Compute health score
    let healthScore = 0;
    if (robotsTxt) healthScore += 15;
    if (sitemapOk) healthScore += 25;
    if (urlCount > 0) healthScore += Math.min(30, urlCount * 2);
    if (domainRecord.gsc_property) healthScore += 15;
    if (domainRecord.ga4_property_id) healthScore += 15;
    addTrace('compute_health', { score: healthScore });

    // Stage 5b: LLM insight via Vercel AI Gateway
    let insight = null;
    try {
      const aiResult = await callAIGateway({
        model: 'anthropic/claude-sonnet-4-5',
        system: 'You are an SEO growth analyst. Given domain health data, produce a concise JSON insight with "summary" (1-2 sentences), "priority_actions" (array of 2-3 strings), and "estimated_impact" (low/medium/high).',
        prompt: `Domain: ${domainName}\nRobots.txt: ${robotsTxt ? 'found' : 'missing'}\nSitemap: ${sitemapOk ? `${urlCount} URLs` : 'missing'}\nHealth score: ${healthScore}/100\nGSC: ${domainRecord.gsc_property ? 'connected' : 'not connected'}\nGA4: ${domainRecord.ga4_property_id ? 'connected' : 'not connected'}`,
        jsonSchema: { type: 'object', properties: { summary: { type: 'string' }, priority_actions: { type: 'array', items: { type: 'string' } }, estimated_impact: { type: 'string' } } },
        temperature: 0.5,
        maxTokens: 800
      });
      insight = aiResult.json;
      addTrace('llm_insight', { generated: true, gateway: 'vercel' });
    } catch (e) {
      addTrace('llm_insight', { skipped: true, reason: e.message });
    }

    // Stage 6: Update domain record
    const nextAction = insight?.priority_actions?.[0] || (healthScore < 50 ? 'Submit sitemap to Google Search Console and verify ownership' : 'Monitor index coverage and competitor gaps');
    await base44.entities.Domain.update(domainRecord.id, {
      sitemap_url: sitemapUrl,
      last_analyzed_at: new Date().toISOString(),
      next_action: nextAction
    });
    addTrace('update_domain', { updated: true });

    // Stage 7: Dispatch follow-up tasks
    const tasksCreated: any[] = [];
    const taskDefs = [
      { agent_name: 'growth_operator', task_type: 'google_connect', title: `Verify Search Console: ${domainName}`, priority: 'high', autonomous: true },
      { agent_name: 'growth_operator', task_type: 'index_check', title: `Check index coverage: ${domainName}`, priority: 'medium', autonomous: true },
      { agent_name: 'growth_operator', task_type: 'competitor_scan', title: `Competitor intelligence: ${domainName}`, priority: 'medium', autonomous: true }
    ];
    for (const td of taskDefs) {
      try {
        const task = await base44.entities.AgentTask.create({ ...td, domain: domainName, status: 'pending' });
        tasksCreated.push(task.id);
      } catch (e) { /* skip */ }
    }
    addTrace('create_task', { count: tasksCreated.length });

    return Response.json({
      stages_executed: trace.length,
      result: {
        domain_id: domainRecord.id,
        domain_status: domainRecord.status || 'active',
        health_score: healthScore,
        sitemap_ok: sitemapOk,
        sitemap_url: sitemapUrl,
        url_count: urlCount,
        insight,
        tasks_created: tasksCreated
      },
      trace
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}