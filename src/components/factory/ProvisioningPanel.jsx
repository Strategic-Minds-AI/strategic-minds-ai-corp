import React, { useState, useCallback, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Github, Cloud, Database, Loader2, CheckCircle, XCircle, Rocket, ExternalLink, RefreshCw, Trash2, Server, Globe, Zap } from 'lucide-react';

export default function ProvisioningPanel({ buildSpec, templateId }) {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [provisioning, setProvisioning] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [progress, setProgress] = useState('');

  const [form, setForm] = useState({
    project_name: '',
    needs_backend: false,
    supabase_region: 'us-east-1',
    source: buildSpec ? 'buildspec' : templateId ? 'template' : 'custom',
    custom_html: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('provisionSite', { action: 'list' });
      setSites(res.data?.sites || []);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const provision = async () => {
    if (!form.project_name.trim()) return;
    setProvisioning(true);
    setError(null);
    setSuccess(null);
    setProgress('Starting...');

    try {
      const payload = {
        action: 'provision',
        project_name: form.project_name,
        needs_backend: form.needs_backend,
        supabase_region: form.supabase_region,
      };

      if (form.source === 'buildspec' && buildSpec) {
        payload.build_spec = buildSpec;
      } else if (form.source === 'template' && templateId) {
        payload.template_id = templateId;
      } else if (form.source === 'custom' && form.custom_html) {
        payload.custom_html = form.custom_html;
      }

      const res = await base44.functions.invoke('provisionSite', payload);
      if (res.data?.error) throw new Error(res.data.error);

      const site = res.data?.site;
      if (site?.deployment_url) {
        setSuccess(`Provisioned! Live at ${site.deployment_url}`);
      } else if (site?.github_url) {
        setSuccess(`Provisioned! GitHub: ${site.github_url} — Vercel deploying...`);
      } else {
        setSuccess('Provisioning dispatched. Check status below.');
      }

      setForm({ ...form, project_name: '', custom_html: '' });
      await load();
    } catch (e) {
      setError(e.message);
    }
    setProvisioning(false);
    setProgress('');
  };

  const refreshDeployment = async (siteId) => {
    try {
      const res = await base44.functions.invoke('provisionSite', { action: 'refresh_deployment', site_id: siteId });
      if (res.data?.deployment_url) {
        setSuccess(`Deployment URL found: ${res.data.deployment_url}`);
        await load();
      } else {
        setError('Deployment not ready yet — Vercel may still be building. Try again in a minute.');
      }
    } catch (e) {
      setError(e.message);
    }
  };

  const remove = async (id) => {
    try {
      await base44.functions.invoke('provisionSite', { action: 'delete', site_id: id });
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const statusColors = {
    pending: 'bg-muted text-muted-foreground',
    github_created: 'bg-blue-500/10 text-blue-600',
    files_pushed: 'bg-blue-500/10 text-blue-600',
    vercel_connected: 'bg-primary/10 text-primary',
    supabase_created: 'bg-purple-500/10 text-purple-600',
    deployed: 'bg-green-500/10 text-green-600',
    failed: 'bg-destructive/10 text-destructive',
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground"><Rocket size={16} className="text-primary"/> Provisioning Engine</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">GitHub repo → Vercel deploy → Supabase backend (optional, free tier)</p>
        </div>
        <button onClick={load} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" title="Refresh"><RefreshCw size={14}/></button>
      </div>

      {error && <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"><XCircle size={16}/> {error}</div>}
      {success && <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/5 px-4 py-3 text-sm text-green-600"><CheckCircle size={16}/> {success}</div>}

      {/* Provisioning form */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Provision New Site</h3>
        <div className="grid grid-cols-2 gap-3">
          <input className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="Project name (e.g. dental-site-001)" value={form.project_name} onChange={e => setForm({...form, project_name: e.target.value})} />
          <select className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" value={form.supabase_region} onChange={e => setForm({...form, supabase_region: e.target.value})}>
            <option value="us-east-1">US East (Virginia)</option>
            <option value="us-west-1">US West (North California)</option>
            <option value="eu-west-1">EU West (Ireland)</option>
            <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
          </select>
        </div>

        {/* Source selector */}
        <div className="flex gap-2">
          <button onClick={() => setForm({...form, source: buildSpec ? 'buildspec' : templateId ? 'template' : 'custom'})} disabled={!buildSpec}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${form.source === 'buildspec' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'} ${!buildSpec ? 'opacity-40' : ''}`}>
            <Zap size={12}/> BuildSpec
          </button>
          <button onClick={() => setForm({...form, source: 'template'})} disabled={!templateId}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${form.source === 'template' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'} ${!templateId ? 'opacity-40' : ''}`}>
            <Server size={12}/> Template
          </button>
          <button onClick={() => setForm({...form, source: 'custom'})}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${form.source === 'custom' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}>
            <Globe size={12}/> Custom HTML
          </button>
        </div>

        {form.source === 'custom' && (
          <textarea className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground" rows={4} placeholder="Paste HTML content..." value={form.custom_html} onChange={e => setForm({...form, custom_html: e.target.value})} />
        )}

        {/* Backend toggle */}
        <label className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3">
          <input type="checkbox" className="h-4 w-4 rounded border-border" checked={form.needs_backend} onChange={e => setForm({...form, needs_backend: e.target.checked})} />
          <div>
            <span className="flex items-center gap-1.5 text-sm font-medium text-foreground"><Database size={14}/> Provision Supabase backend</span>
            <p className="text-[10px] text-muted-foreground">Free tier — only enable if the site needs a database, auth, or API</p>
          </div>
        </label>

        <button onClick={provision} disabled={provisioning || !form.project_name.trim()} className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40 w-full justify-center">
          {provisioning ? <><Loader2 size={16} className="animate-spin"/> Provisioning...</> : <><Rocket size={16}/> Provision Site</>}
        </button>
        {provisioning && progress && <p className="text-center text-xs text-muted-foreground">{progress}</p>}
      </div>

      {/* Pipeline visualization */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <Github size={18} className="mx-auto mb-1 text-foreground"/>
          <p className="text-[10px] font-bold uppercase text-muted-foreground">GitHub</p>
          <p className="text-[10px] text-muted-foreground">Repo + files</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <Cloud size={18} className="mx-auto mb-1 text-foreground"/>
          <p className="text-[10px] font-bold uppercase text-muted-foreground">Vercel</p>
          <p className="text-[10px] text-muted-foreground">Auto-deploy</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <Database size={18} className="mx-auto mb-1 text-foreground"/>
          <p className="text-[10px] font-bold uppercase text-muted-foreground">Supabase</p>
          <p className="text-[10px] text-muted-foreground">Free tier (opt)</p>
        </div>
      </div>

      {/* Provisioned sites list */}
      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-muted-foreground"/></div>
      ) : sites.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Rocket size={32} className="mx-auto mb-3 text-muted-foreground"/>
          <p className="text-sm text-muted-foreground">No sites provisioned yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sites.map(s => (
            <div key={s.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {s.status === 'deployed' ? <CheckCircle size={18}/> : s.status === 'failed' ? <XCircle size={18}/> : <Loader2 size={18} className="animate-spin"/>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{s.project_name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusColors[s.status] || 'bg-muted text-muted-foreground'}`}>{s.status}</span>
                    {s.needs_backend && <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-purple-600">+ Supabase</span>}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    {s.github_url && <a href={s.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary"><Github size={10}/> Repo</a>}
                    {s.vercel_deployment_url && <a href={s.vercel_deployment_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary"><ExternalLink size={10}/> Live</a>}
                    {s.supabase_url && <a href={s.supabase_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary"><Database size={10}/> DB</a>}
                  </div>
                </div>
                {s.status !== 'deployed' && s.status !== 'failed' && (
                  <button onClick={() => refreshDeployment(s.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" title="Check deployment"><RefreshCw size={14}/></button>
                )}
                <button onClick={() => remove(s.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Delete"><Trash2 size={14}/></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}