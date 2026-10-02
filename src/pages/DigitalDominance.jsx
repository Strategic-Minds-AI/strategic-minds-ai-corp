import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Rocket, Loader2, AlertCircle, ArrowLeft, RefreshCw, Globe, Target, TrendingUp, Users, FileText, Zap, CheckCircle2, Clock, ChevronRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const PHASES = [
  { id: 'intelligence', label: 'Intelligence', icon: Target, desc: 'Search + spending pattern research' },
  { id: 'brand_domain', label: 'Brand & Domain', icon: Globe, desc: 'Name gen + domain check + purchase' },
  { id: 'infrastructure', label: 'Infrastructure', icon: Zap, desc: 'Vercel + GitHub provisioning' },
  { id: 'content_flood', label: 'Content Flood', icon: FileText, desc: '500+ SEO pages generated' },
  { id: 'persona_fame', label: 'Persona & Fame', icon: Users, desc: 'Social empire + directories' },
  { id: 'technical_seo', label: 'Technical SEO', icon: TrendingUp, desc: 'Schema, sitemaps, CWV, GSC' },
  { id: 'ai_search', label: 'AI Search', icon: Sparkles, desc: 'AEO, llms.txt, knowledge panel' },
  { id: 'continuous', label: 'Continuous', icon: Rocket, desc: '24/7 swarm dominance tasks' },
];

export default function DigitalDominance() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLaunch, setShowLaunch] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [form, setForm] = useState({ keyword: '', city: '', state: 'FL', niche_id: '', auto_purchase_domain: false, auto_deploy_vercel: true });
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [runningPhase, setRunningPhase] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('dominanceEngine', { action: 'listActive' });
      setCampaigns(res.data?.campaigns || []);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Poll active campaign for updates
  useEffect(() => {
    if (!activeCampaign) return;
    const interval = setInterval(async () => {
      try {
        const res = await base44.functions.invoke('dominanceEngine', { action: 'getStatus', campaign_id: activeCampaign });
        if (res.data && !res.data.error) {
          setActiveCampaign(prev => ({ ...prev, ...res.data }));
          if (res.data.status === 'completed' || res.data.status === 'failed') {
            clearInterval(interval);
            load();
          }
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [activeCampaign?.campaign_id]);

  const launch = async () => {
    if (!form.keyword.trim()) return;
    setLaunching(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('dominanceEngine', { action: 'launch', ...form });
      if (res.data?.error) throw new Error(res.data.error);
      setShowLaunch(false);
      setActiveCampaign(res.data);
      await load();
    } catch (e) {
      setError(e.message);
    }
    setLaunching(false);
  };

  const runAll = async (campaignId) => {
    setRunningPhase(campaignId);
    setError(null);
    try {
      const res = await base44.functions.invoke('dominanceEngine', { action: 'runAll', campaign_id: campaignId });
      if (res.data?.error) throw new Error(res.data.error);
      await load();
    } catch (e) {
      setError(e.message);
    }
    setRunningPhase(null);
  };

  const runPhase = async (campaignId, phaseName) => {
    setRunningPhase(`${campaignId}-${phaseName}`);
    try {
      await base44.functions.invoke('dominanceEngine', { action: 'runPhase', campaign_id: campaignId, phase_name: phaseName });
      await load();
    } catch (e) {
      setError(e.message);
    }
    setRunningPhase(null);
  };

  const activeCampaigns = campaigns.filter(c => c.status === 'running');
  const completedCampaigns = campaigns.filter(c => c.status === 'completed');
  const failedCampaigns = campaigns.filter(c => c.status === 'failed');

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="sticky top-0 z-10 flex min-h-16 items-center gap-3 border-b border-border bg-background px-5 py-2 pl-16">
        <Link to="/agents" className="rounded-lg p-2 text-foreground hover:bg-muted"><ArrowLeft size={20} /></Link>
        <Rocket size={18} className="text-primary" />
        <span className="text-sm font-semibold text-foreground">Digital Dominance Engine</span>
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">8-Phase Pipeline</span>
        <button onClick={load} className="ml-auto rounded-lg p-2 text-foreground hover:bg-muted" title="Refresh"><RefreshCw size={16} /></button>
        <button onClick={() => setShowLaunch(!showLaunch)} className="flex items-center gap-2 rounded-lg bg-consoleAccent px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"><Rocket size={16} /> Launch Campaign</button>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {error && <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"><AlertCircle size={16} /> {error}</div>}

        {/* Stats */}
        <div className="mb-6 grid grid-cols-4 gap-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2"><Rocket size={14} className="text-primary" /><span className="text-[10px] font-bold uppercase text-muted-foreground">Active</span></div>
            <p className="mt-1 text-2xl font-bold text-foreground">{activeCampaigns.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-green-600" /><span className="text-[10px] font-bold uppercase text-muted-foreground">Completed</span></div>
            <p className="mt-1 text-2xl font-bold text-foreground">{completedCampaigns.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2"><AlertCircle size={14} className="text-destructive" /><span className="text-[10px] font-bold uppercase text-muted-foreground">Failed</span></div>
            <p className="mt-1 text-2xl font-bold text-foreground">{failedCampaigns.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2"><Globe size={14} className="text-muted-foreground" /><span className="text-[10px] font-bold uppercase text-muted-foreground">Total</span></div>
            <p className="mt-1 text-2xl font-bold text-foreground">{campaigns.length}</p>
          </div>
        </div>

        {/* Launch form */}
        {showLaunch && (
          <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Launch Dominance Campaign</h2>
            <div className="grid grid-cols-2 gap-3">
              <input className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground" placeholder="Seed keyword (e.g. epoxy flooring)" value={form.keyword} onChange={e => setForm({ ...form, keyword: e.target.value })} />
              <input className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground" placeholder="City (optional)" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
              <input className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground" placeholder="State (e.g. FL)" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} />
              <input className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground" placeholder="Niche ID (optional)" value={form.niche_id} onChange={e => setForm({ ...form, niche_id: e.target.value })} />
            </div>
            <div className="mt-3 flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={form.auto_purchase_domain} onChange={e => setForm({ ...form, auto_purchase_domain: e.target.checked })} /> Auto-purchase domain (GoDaddy)</label>
              <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={form.auto_deploy_vercel} onChange={e => setForm({ ...form, auto_deploy_vercel: e.target.checked })} /> Auto-deploy to Vercel</label>
            </div>
            <button onClick={launch} disabled={launching || !form.keyword.trim()} className="mt-4 flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-40">
              {launching ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />} Launch Campaign
            </button>
          </div>
        )}

        {/* Active campaign detail */}
        {activeCampaign && (
          <div className="mb-6 rounded-xl border-2 border-primary/30 bg-primary/5 p-5">
            <div className="flex items-center gap-3 mb-4">
              <Rocket size={20} className="text-primary" />
              <div>
                <h3 className="text-sm font-bold text-foreground">{activeCampaign.business_name || activeCampaign.keyword}</h3>
                <p className="text-xs text-muted-foreground">{activeCampaign.domain || 'No domain yet'} · {activeCampaign.campaign_id}</p>
              </div>
              <button onClick={() => setActiveCampaign(null)} className="ml-auto text-xs text-muted-foreground hover:text-foreground">Close</button>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-foreground">{activeCampaign.current_step || activeCampaign.phase}</span>
                <span className="text-xs font-bold text-primary">{activeCampaign.progress_percent || 0}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${activeCampaign.progress_percent || 0}%` }} />
              </div>
            </div>

            {/* Phase tracker */}
            <div className="grid grid-cols-4 gap-2">
              {PHASES.map((phase, i) => {
                const status = activeCampaign.phase_status?.[phase.id] || 'pending';
                const Icon = phase.icon;
                return (
                  <div key={phase.id} className={`rounded-lg border p-2.5 ${status === 'completed' ? 'border-green-500/30 bg-green-500/5' : status === 'running' ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'}`}>
                    <div className="flex items-center gap-1.5">
                      <Icon size={12} className={status === 'completed' ? 'text-green-600' : status === 'running' ? 'text-primary' : 'text-muted-foreground'} />
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">{i + 1}. {phase.label}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{phase.desc}</p>
                    <div className="mt-1">
                      {status === 'completed' && <span className="text-[10px] font-bold text-green-600">Done</span>}
                      {status === 'running' && <span className="flex items-center gap-1 text-[10px] font-bold text-primary"><Loader2 size={8} className="animate-spin" /> Running</span>}
                      {status === 'pending' && <button onClick={() => runPhase(activeCampaign.campaign_id, phase.id)} disabled={!!runningPhase} className="text-[10px] font-bold text-primary hover:underline">Run</button>}
                      {status === 'failed' && <span className="text-[10px] font-bold text-destructive">Failed</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex items-center gap-3">
              <button onClick={() => runAll(activeCampaign.campaign_id)} disabled={!!runningPhase} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40">
                {runningPhase === activeCampaign.campaign_id ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />} Run All Remaining Phases
              </button>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>Pages: {activeCampaign.pages_generated || 0}</span>
                <span>Fame: {activeCampaign.fame_score || 0}/100</span>
                <span>Tasks: {activeCampaign.swarm_tasks || 0}</span>
              </div>
            </div>
          </div>
        )}

        {/* Campaign list */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground"><Loader2 size={24} className="animate-spin" /></div>
        ) : campaigns.length === 0 ? (
          <div className="py-12 text-center">
            <Rocket size={40} className="mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No campaigns yet. Launch one to start the 8-phase dominance pipeline.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map(c => (
              <div key={c.campaign_id} className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition cursor-pointer" onClick={() => setActiveCampaign(c)}>
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${c.status === 'running' ? 'bg-primary/10 text-primary' : c.status === 'completed' ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'}`}>
                    {c.status === 'running' ? <Loader2 size={18} className="animate-spin" /> : c.status === 'completed' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{c.business_name || c.keyword}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${c.status === 'running' ? 'bg-primary/10 text-primary' : c.status === 'completed' ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'}`}>{c.status}</span>
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">{c.phase}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {c.domain || 'No domain'} · {c.city || 'No city'} · {c.pages || 0} pages · {c.fame || 0}/100 fame
                    </div>
                    {/* Mini progress bar */}
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
                      <div className={`h-full rounded-full ${c.status === 'completed' ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${c.progress || 0}%` }} />
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Universal Pattern Reference */}
        <div className="mt-8 rounded-xl border border-border bg-muted/30 p-5">
          <h3 className="mb-3 text-sm font-bold text-foreground">The Universal Digital Dominance Pattern</h3>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            {PHASES.map((phase, i) => (
              <div key={phase.id} className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">{i + 1}</span>
                <div><span className="font-semibold text-foreground">{phase.label}</span> — {phase.desc}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground italic">Same input always produces the same campaign_id and phase order. Deterministic, resumable, and fully integrated with the Strategic Minds AI sandbox + agent system.</p>
        </div>
      </div>
    </div>
  );
}