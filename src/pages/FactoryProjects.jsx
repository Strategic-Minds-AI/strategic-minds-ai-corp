import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, FolderKanban, Loader2, Plus, Save, X } from 'lucide-react';

const STATUSES = ['intake', 'planning', 'building', 'validating', 'delivered', 'failed', 'cancelled'];

export default function FactoryProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ project_key: '', name: '', description: '', objective: '', industry: '', product: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('factoryOS', { action: 'listProjects' });
      setProjects(res.data?.projects || []);
    } catch (e) { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.project_key || !form.name) return;
    setSaving(true);
    try {
      await base44.functions.invoke('factoryOS', { action: 'createProject', project: form });
      setShowForm(false);
      setForm({ project_key: '', name: '', description: '', objective: '', industry: '', product: '' });
      await load();
    } catch (e) { /* silent */ }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="sticky top-0 z-10 flex min-h-16 items-center gap-3 border-b border-border bg-background px-5 py-2 pl-16">
        <button onClick={() => navigate('/factory')} className="rounded-lg p-2 text-foreground hover:bg-muted"><ArrowLeft size={20} /></button>
        <FolderKanban size={18} className="text-primary" />
        <span className="text-sm font-semibold text-foreground">Projects</span>
        <button onClick={() => setShowForm(!showForm)} className="ml-auto flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90">
          {showForm ? <X size={14} /> : <Plus size={14} />} {showForm ? 'Cancel' : 'New Project'}
        </button>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-6">
        {showForm && (
          <div className="mb-4 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="grid grid-cols-2 gap-3">
              <input className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="project_key (url-safe)" value={form.project_key} onChange={(e) => setForm({ ...form, project_key: e.target.value })} />
              <input className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="industry" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
              <input className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="product" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} />
              <input className="col-span-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="objective" value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} />
              <textarea className="col-span-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" rows={2} placeholder="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <button onClick={save} disabled={saving} className="mt-3 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Create Project
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-primary" /></div>
        ) : projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <FolderKanban size={32} className="mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No projects yet. Create one to start the intake process.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {projects.map((p) => (
              <div key={p.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground">{p.project_key}</span>
                  <span className="text-sm font-semibold text-foreground">{p.name}</span>
                  <ProjectStatusBadge status={p.status} />
                </div>
                {p.description && <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>}
                <div className="mt-2 flex gap-3 text-[10px] text-muted-foreground">
                  {p.industry && <span>Industry: {p.industry}</span>}
                  {p.product && <span>Product: {p.product}</span>}
                  <span>{p.run_count || 0} runs</span>
                  <span>{p.artifact_count || 0} artifacts</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectStatusBadge({ status }) {
  const styles = { intake: 'bg-muted text-muted-foreground', planning: 'bg-blue-500/10 text-blue-600', building: 'bg-cyan-500/10 text-cyan-600', validating: 'bg-amber-500/10 text-amber-600', delivered: 'bg-green-500/10 text-green-600', failed: 'bg-destructive/10 text-destructive', cancelled: 'bg-muted text-muted-foreground' };
  return <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${styles[status] || styles.intake}`}>{status}</span>;
}