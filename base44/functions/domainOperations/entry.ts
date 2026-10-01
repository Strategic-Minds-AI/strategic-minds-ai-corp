import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json();
    const { domain_id, domain: domainName } = body;

    if (!domain_id && !domainName) {
      return Response.json({ error: 'domain_id or domain is required' }, { status: 400 });
    }

    // Find or create domain record
    let domain;
    if (domain_id) {
      domain = await base44.entities.Domain.get(domain_id);
    } else {
      const cleanDomain = String(domainName).replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
      const existing = await base44.entities.Domain.filter({ domain: cleanDomain }, { limit: 1 });
      if (existing.items && existing.items.length > 0) {
        domain = existing.items[0];
      } else {
        domain = await base44.entities.Domain.create({
          domain: cleanDomain,
          canonical_url: `https://${cleanDomain}`,
          status: 'active',
          sitemap_url: `https://${cleanDomain}/sitemap.xml`,
        });
      }
    }

    const results: any = { sitemap: null, gsc: null, ga4: null, competitors: null };

    // ── 1. Fetch and analyze sitemap ──
    try {
      let sitemapUrl = domain.sitemap_url || `https://${domain.domain}/sitemap.xml`;
      let sitemapRes = await fetch(sitemapUrl, {
        headers: { 'User-Agent': 'StrategicMindsAI/1.0' },
        signal: AbortSignal.timeout(10000),
      });
      // If sitemap.xml fails, try robots.txt to find the sitemap
      if (!sitemapRes.ok) {
        const robotsRes = await fetch(`https://${domain.domain}/robots.txt`, {
          headers: { 'User-Agent': 'StrategicMindsAI/1.0' },
          signal: AbortSignal.timeout(10000),
        });
        if (robotsRes.ok) {
          const robotsText = await robotsRes.text();
          const sitemapMatch = robotsText.match(/Sitemap:\s*(\S+)/i);
          if (sitemapMatch) {
            sitemapUrl = sitemapMatch[1];
            sitemapRes = await fetch(sitemapUrl, {
              headers: { 'User-Agent': 'StrategicMindsAI/1.0' },
              signal: AbortSignal.timeout(10000),
            });
          }
        }
      }
      if (sitemapRes.ok) {
        const sitemapText = await sitemapRes.text();
        const urls: string[] = [];
        const urlRegex = /<loc>([^<]+)<\/loc>/g;
        let match;
        while ((match = urlRegex.exec(sitemapText)) !== null) {
          urls.push(match[1]);
        }
        const isIndex = sitemapText.includes('<sitemapindex');
        results.sitemap = {
          found: true,
          url: sitemapUrl,
          url_count: urls.length,
          is_index: isIndex,
          sample_urls: urls.slice(0, 25),
          status: sitemapRes.status,
        };
      } else {
        results.sitemap = { found: false, url: sitemapUrl, status: sitemapRes.status };
      }
    } catch (e: any) {
      results.sitemap = { found: false, error: e.message };
    }

    // ── 2. Read Google Search Console performance ──
    if (domain.gsc_property) {
      try {
        const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_search_console');
        const siteUrl = encodeURIComponent(domain.gsc_property);
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 28);
        const fmt = (d: Date) => d.toISOString().split('T')[0];

        const gscRes = await fetch(
          `https://www.googleapis.com/webmasters/v3/sites/${siteUrl}/searchAnalytics/query`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              startDate: fmt(startDate),
              endDate: fmt(endDate),
              dimensions: ['query'],
              rowLimit: 25,
            }),
            signal: AbortSignal.timeout(15000),
          }
        );
        if (gscRes.ok) {
          const gscData = await gscRes.json();
          const rows = (gscData.rows || []).map((r: any) => ({
            query: r.keys[0],
            clicks: r.clicks,
            impressions: r.impressions,
            ctr: Number(r.ctr.toFixed(4)),
            position: Number(r.position.toFixed(2)),
          }));
          results.gsc = {
            rows,
            total_clicks: rows.reduce((s: number, r: any) => s + r.clicks, 0),
            total_impressions: rows.reduce((s: number, r: any) => s + r.impressions, 0),
            avg_position: rows.length > 0 ? Number((rows.reduce((s: number, r: any) => s + r.position, 0) / rows.length).toFixed(2)) : null,
          };
        } else {
          const errBody = await gscRes.text();
          results.gsc = { error: `GSC API ${gscRes.status}: ${errBody.slice(0, 200)}` };
        }
      } catch (e: any) {
        results.gsc = { error: e.message };
      }
    }

    // ── 3. Read Google Analytics 4 data ──
    if (domain.ga4_property_id) {
      try {
        const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_analytics');
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 28);
        const fmt = (d: Date) => d.toISOString().split('T')[0];

        const gaRes = await fetch(
          `https://analyticsdata.googleapis.com/v1beta/properties/${domain.ga4_property_id}:runReport`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              dateRanges: [{ startDate: fmt(startDate), endDate: fmt(endDate) }],
              metrics: [
                { name: 'totalUsers' },
                { name: 'sessions' },
                { name: 'screenPageViews' },
                { name: 'conversions' },
              ],
            }),
            signal: AbortSignal.timeout(15000),
          }
        );
        if (gaRes.ok) {
          const gaData = await gaRes.json();
          const totals: any = {};
          if (gaData.totals && gaData.totals[0]) {
            (gaData.metricHeaders || []).forEach((h: any, i: number) => {
              totals[h.name] = gaData.totals[0].metricValues[i].value;
            });
          }
          results.ga4 = totals;
        } else {
          const errBody = await gaRes.text();
          results.ga4 = { error: `GA4 API ${gaRes.status}: ${errBody.slice(0, 200)}` };
        }
      } catch (e: any) {
        results.ga4 = { error: e.message };
      }
    }

    // ── 4. Competitor scan via web search ──
    if (domain.competitors) {
      try {
        const compDomains = domain.competitors.split(',').map((c: string) => c.trim()).filter(Boolean);
        const compSummaries = [];
        for (const comp of compDomains.slice(0, 3)) {
          try {
            const llmRes = await base44.integrations.Core.InvokeLLM({
              prompt: `Analyze the competitor website ${comp}. Search for information about their SEO strategy, top-ranking content, target keywords, market positioning, and any notable strengths or weaknesses. Provide a concise competitive intelligence summary.`,
              add_context_from_internet: true,
              model: 'gemini_3_8_flash',
              response_json_schema: {
                type: 'object',
                properties: {
                  summary: { type: 'string' },
                  top_keywords: { type: 'array', items: { type: 'string' } },
                  strengths: { type: 'string' },
                  gaps: { type: 'string' },
                },
              },
            });
            compSummaries.push({ domain: comp, ...(typeof llmRes === 'object' ? llmRes : { summary: String(llmRes) }) });
          } catch (e: any) {
            compSummaries.push({ domain: comp, error: e.message });
          }
        }
        results.competitors = compSummaries;
      } catch (e: any) {
        results.competitors = { error: e.message };
      }
    }

    // ── 5. Generate strategic insight via LLM (graceful fallback if credits exhausted) ──
    let insight: any = null;
    try {
      const insightPrompt = `You are a domain operations strategist for Strategic Minds AI. Analyze this domain's data and provide strategic recommendations.

Domain: ${domain.domain}
Target keywords: ${domain.target_keywords || 'not set'}
Target geography: ${domain.target_geography || 'not set'}

Sitemap analysis: ${JSON.stringify(results.sitemap)}
Google Search Console (last 28 days): ${JSON.stringify(results.gsc)}
Google Analytics 4 (last 28 days): ${JSON.stringify(results.ga4)}
Competitor intelligence: ${JSON.stringify(results.competitors)}

Provide a strategic analysis with:
1. executive_summary: A concise 2-3 sentence summary of the domain's current state
2. opportunities: Top 3 opportunities for improvement (specific, actionable)
3. issues: Top 3 issues that need attention (ranked by severity)
4. next_actions: Recommended next actions ranked by impact
5. next_action: A single one-line next action (the highest-impact thing to do next)

Be specific and data-driven. Focus on SEO, content, technical health, and growth. If a data source is missing, note what's needed to enable it.`;

      const insightRes = await base44.integrations.Core.InvokeLLM({
        prompt: insightPrompt,
        response_json_schema: {
          type: 'object',
          properties: {
            executive_summary: { type: 'string' },
            opportunities: { type: 'array', items: { type: 'string' } },
            issues: { type: 'array', items: { type: 'string' } },
            next_actions: { type: 'array', items: { type: 'string' } },
            next_action: { type: 'string' },
          },
        },
      });
      insight = typeof insightRes === 'object' ? insightRes : { executive_summary: String(insightRes), opportunities: [], issues: [], next_actions: [], next_action: 'Review latest analysis' };
    } catch (llmError: any) {
      // Fallback: generate a basic insight from raw data without LLM
      const issues: string[] = [];
      if (!results.sitemap?.found) issues.push('Sitemap not found or inaccessible — create and deploy a sitemap.xml');
      if (results.sitemap?.url_count === 0) issues.push('Sitemap contains zero URLs — check generation logic');
      if (!domain.gsc_property) issues.push('Google Search Console property not set — add gsc_property to enable search performance tracking');
      if (!domain.ga4_property_id) issues.push('GA4 property ID not set — add ga4_property_id to enable analytics tracking');
      if (!domain.competitors) issues.push('No competitors configured — add competitor domains for competitive intelligence');

      const opportunities: string[] = [];
      if (results.gsc?.rows?.length > 0) {
        const topQuery = results.gsc.rows[0];
        opportunities.push(`Your top query "${topQuery.query}" gets ${topQuery.impressions} impressions at position ${topQuery.position} — improve its ranking page to capture more clicks`);
      }
      if (results.gsc && results.gsc.avg_position > 20) opportunities.push('Average position is beyond page 2 — focus on content quality and internal linking');
      if (results.sitemap?.url_count > 0 && results.sitemap.url_count < 50) opportunities.push('Sitemap has fewer than 50 URLs — consider adding more indexable content pages');

      insight = {
        executive_summary: `Domain ${domain.domain} analyzed. Sitemap: ${results.sitemap?.found ? results.sitemap.url_count + ' URLs' : 'not found'}. GSC: ${results.gsc?.rows?.length || 0} queries tracked. GA4: ${results.ga4?.totalUsers || 'not connected'} users. LLM insight generation unavailable — showing data-driven fallback.`,
        opportunities,
        issues,
        next_actions: opportunities.concat(issues).slice(0, 5),
        next_action: issues[0] || opportunities[0] || 'Review the analysis data and configure missing properties',
      };
    }

    // ── 6. Store metric snapshot ──
    const today = new Date().toISOString().split('T')[0];
    const metric = await base44.entities.DomainMetric.create({
      domain_id: domain.id,
      snapshot_date: today,
      gsc_clicks: results.gsc?.total_clicks || 0,
      gsc_impressions: results.gsc?.total_impressions || 0,
      gsc_top_queries: JSON.stringify(results.gsc?.rows?.slice(0, 10) || []),
      ga4_users: results.ga4?.totalUsers ? Number(results.ga4.totalUsers) : 0,
      ga4_sessions: results.ga4?.sessions ? Number(results.ga4.sessions) : 0,
      ga4_pageviews: results.ga4?.screenPageViews ? Number(results.ga4.screenPageViews) : 0,
      ga4_conversions: results.ga4?.conversions ? Number(results.ga4.conversions) : 0,
      sitemap_url_count: results.sitemap?.url_count || 0,
      sitemap_errors: JSON.stringify(
        results.sitemap?.error ? [results.sitemap.error] :
        (results.sitemap?.found ? [] : ['sitemap not found'])
      ),
      competitor_summary: JSON.stringify(results.competitors),
      insight: JSON.stringify(insight),
    });

    // ── 7. Update domain record ──
    await base44.entities.Domain.update(domain.id, {
      last_analyzed_at: new Date().toISOString(),
      next_action: insight.next_action || 'Review latest analysis',
    });

    return Response.json({
      domain: domain.domain,
      domain_id: domain.id,
      metric_id: metric.id,
      results,
      insight,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}