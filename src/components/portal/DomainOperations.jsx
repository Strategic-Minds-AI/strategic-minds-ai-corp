import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Globe, Plus, RefreshCw, TrendingUp, AlertTriangle, Lightbulb, ChevronDown, ChevronRight } from 'lucide-react';

export default function DomainOperations() {
  const [domains, setDomains] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newDomain, setNewDomain] = useState({ domain: '', competitors: '', target_keywords: '', gsc_property: '', ga4_property_id: '' });
  const [analyzing, setAnalyzing] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const { items } = await base44.entities.Domain.filter({}, { sort: '-created_date', limit: 100 });
      setDomains(items);
      const metricMap = {};
      for (const d of items) {
        try {
          const { items: dms } = await base44.entities.DomainMetric.filter({ domain_id: d.id }, { sort: '-snapshot_date', limit: 1 });
          if (dms.length > 0) metricMap[d.id] = dms[0];
        } catch {}
      }
      setMetrics(metricMap);
      setError('');
    } catch (e) { setError(e.message || 'Could not load domains.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const addDomain = async (e) => {
    e.preventDefault();
    try {
      const clean = newDomain.domain.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
      await base44.entities.Domain.create({
        domain: clean,
        canonical_url: `https://${clean}`,
        status: 'active',
        sitemap_url: `https://${clean}/sitemap.xml`,
        competitors: newDomain.competitors,
        target_keywords: newDomain.target_keywords,
        gsc_property: newDomain.gsc_property || `sc-domain:${clean}`,
        ga4_property_id: newDomain.ga4_property_id,
      });
      setNewDomain({ domain: '', competitors: '', target_keywords: '', gsc_property: '', ga4_property_id: '' });
      setShowAdd(false);
      refresh();
    } catch (e) { setError(e.message || 'Could not add domain.'); }
  };

  const analyze = async (domain) => {
    setAnalyzing(domain.id);
    setAnalysisResult(null);
    try {
      const res = await base44.functions.invoke('domainOperations', { domain_id: domain.id });
      setAnalysisResult(res.data);
      refresh();
    } catch (e) { setError(e.response?.data?.error || e.message || 'Analysis failed.'); }
    finally { setAnalyzing(null); }
  };

  const parseInsight = (metric) => {
    if (!metric?.insight) return null;
    try { return JSON.parse(metric.insight); } catch { return null; }
  };

  return <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="mb-1 text-xl">Domain Operations</h2>
        <p className="text-sm text-muted-foreground">Add a URL to auto-register it, then run a full analysis: Google Search Console, Analytics, sitemap health, and competitor intelligence.</p>
      </div>
      <button type="button" onClick={() => setShowAdd(s => !s)} className="agency-button"><Plus size={16} /> Add domain</button>
    </div>

    {error && <p role="alert" className="text-sm text-destructive">{error} <button type="button" className="underline" onClick={() => setError('')}>Dismiss</button></p>}

    {showAdd && <form onSubmit={addDomain} className="space-y-4 rounded border border-border bg-card p-5">
      <label className="block text-sm">Domain URL<input className="agency-input" required placeholder="example.com" value={newDomain.domain} onChange={e => setNewDomain(d => ({ ...d, domain: e.target.value }))} /></label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm">Competitors (comma-separated)<input className="agency-input" placeholder="competitor1.com, competitor2.com" value={newDomain.competitors} onChange={e => setNewDomain(d => ({ ...d, competitors: e.target.value }))} /></label>
        <label className="block text-sm">Target keywords (comma-separated)<input className="agency-input" placeholder="seo, web design, marketing" value={newDomain.target_keywords} onChange={e => setNewDomain(d => ({ ...d, target_keywords: e.target.value }))} /></label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm">GSC property (optional)<input className="agency-input" placeholder="sc-domain:example.com" value={newDomain.gsc_property} onChange={e => setNewDomain(d => ({ ...d, gsc_property: e.target.value }))} /></label>
        <label className="block text-sm">GA4 property ID (optional)<input className="agency-input" placeholder="123456789" value={newDomain.ga4_property_id} onChange={e => setNewDomain(d => ({ ...d, ga4_property_id: e.target.value }))} /></label>
      </div>
      <div className="flex gap-3"><button className="agency-button" type="submit">Add &amp; register</button><button type="button" onClick={() => setShowAdd(false)} className="text-sm underline">Cancel</button></div>
    </form>}

    {loading ? <p role="status">Loading domains…</p> : domains.length === 0 ? <div className="rounded border border-border bg-card p-8 text-center text-sm text-muted-foreground">No domains yet. Click "Add domain" to register a URL and start analyzing.</div> : <div className="space-y-3">
      {domains.map(d => {
        const metric = metrics[d.id];
        const insight = parseInsight(metric);
        const isOpen = expanded === d.id;
        return <div key={d.id} className="rounded border border-border bg-card">
          <div className="flex items-center gap-3 p-4">
            <button type="button" onClick={() => setExpanded(isOpen ? null : d.id)} className="text-muted-foreground hover:text-foreground">{isOpen ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}</button>
            <Globe size={18} className="text-primary" />
            <div className="min-w-0 flex-1">
              <strong className="block truncate">{d.domain}</strong>
              <span className="text-xs text-muted-foreground">{d.status} · {d.last_analyzed_at ? `Last analyzed ${new Date(d.last_analyzed_at).toLocaleDateString()}` : 'Never analyzed'}{d.next_action ? ` · Next: ${d.next_action}` : ''}</span>
            </div>
            <button type="button" onClick={() => analyze(d)} disabled={analyzing === d.id} className="agency-button"><RefreshCw size={14} className={analyzing === d.id ? 'animate-spin' : ''} /> {analyzing === d.id ? 'Analyzing…' : 'Analyze'}</button>
          </div>
          {isOpen && <div className="border-t border-border p-4">
            {metric ? <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded bg-muted p-3"><p className="text-xs text-muted-foreground">GSC Clicks</p><p className="text-lg font-semibold">{metric.gsc_clicks || 0}</p></div>
                <div className="rounded bg-muted p-3"><p className="text-xs text-muted-foreground">GSC Impressions</p><p className="text-lg font-semibold">{metric.gsc_impressions || 0}</p></div>
                <div className="rounded bg-muted p-3"><p className="text-xs text-muted-foreground">GA4 Users</p><p className="text-lg font-semibold">{metric.ga4_users || 0}</p></div>
                <div className="rounded bg-muted p-3"><p className="text-xs text-muted-foreground">Sitemap URLs</p><p className="text-lg font-semibold">{metric.sitemap_url_count || 0}</p></div>
              </div>
              {insight && <div className="space-y-3">
                {insight.executive_summary && <div className="rounded border border-border p-3"><p className="mb-1 text-xs font-medium text-muted-foreground">Executive Summary</p><p className="text-sm">{insight.executive_summary}</p></div>}
                {insight.opportunities?.length > 0 && <div><p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><TrendingUp size={14}/> Opportunities</p><ul className="space-y-1">{insight.opportunities.map((o, i) => <li key={i} className="text-sm">• {o}</li>)}</ul></div>}
                {insight.issues?.length > 0 && <div><p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><AlertTriangle size={14}/> Issues</p><ul className="space-y-1">{insight.issues.map((o, i) => <li key={i} className="text-sm">• {o}</li>)}</ul></div>}
                {insight.next_actions?.length > 0 && <div><p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Lightbulb size={14}/> Next Actions</p><ul className="space-y-1">{insight.next_actions.map((o, i) => <li key={i} className="text-sm">• {o}</li>)}</ul></div>}
              </div>}
            </div> : <p className="text-sm text-muted-foreground">No metrics yet. Click "Analyze" to run the first analysis.</p>}
            {analysisResult?.domain_id === d.id && <div className="mt-4 rounded border border-primary p-3"><p className="text-xs font-medium text-primary">Latest analysis result</p><pre className="mt-2 max-h-60 overflow-auto text-xs">{JSON.stringify(analysisResult, null, 2)}</pre></div>}
          </div>}
        </div>;
      })}
    </div>}

    <div className="rounded border border-border bg-muted p-4">
      <p className="text-xs text-muted-foreground"><strong className="text-foreground">Autonomous mode:</strong> This agent reads your Google Search Console and Analytics data (read-only connectors are connected), fetches and validates sitemaps, and scans competitors. To enable full provisioning (creating GSC/GA properties, submitting sitemaps automatically), re-authorize the Google connectors with write scopes. A scheduled workflow for continuous autonomous monitoring can be added as a next step.</p>
    </div>
  </div>;
}