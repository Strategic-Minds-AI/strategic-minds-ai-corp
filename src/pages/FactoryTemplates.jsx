import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, FileCode, Loader2, Plus, Save, X } from 'lucide-react';

const MODES = ['text', 'file_tree', 'code', 'prompt', 'document', 'config', 'sql', 'ui_recipe', 'workflow_recipe', 'provisioning_recipe', 'compound'];

export default function FactoryTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ template_key: '', name: '', version: '1.0.0', mode: 'text', description: '', category: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('factoryOS', { action: 'listTemplatePacks' });
      setTemplates(res.data?.templates || []);
    } catch (e) { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.template_key || !form.name) return;
    setSaving(true);
    try {
      await base44.functions.invoke('factoryOS', { action: 'createTemplatePack', pack: form });
      setShowForm(false);
      setForm({ template_key: '', name: '', version: '1.0.0', mode: 'text', description: '', category: '' });
      await load();
    } catch (e) { /* silent */ }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="sticky top-0 z-10 flex min-h-16 items-center gap-3 border-b border-border bg-background px-5 py-2 pl-16">
        <button onClick={() => navigate('/factory')} className="rounded-lg p-2 text-foreground hover:bg-muted"><ArrowLeft size={20} /></button>
        <FileCode size={18} className="text-primary" />
        <span className="text-sm font-semibold text-foreground">Template Library</span>
        <button onClick={() => setShowForm(!showForm)} className="ml-auto flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90">
          {showForm ? <X size={14} /> : <Plus size={14} />} {showForm ? 'Cancel' : 'New Template'}
        </button>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-6">
        {showForm && (
          <div className="mb-4 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="grid grid-cols-2 gap-3">
              <input className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="template_key" value={form.template_key} onChange={(e) => setForm({ ...form, template_key: e.target.value })} />
              <input className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="version" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} />
              <select className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
                {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <input className="col-span-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              <textarea className="col-span-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" rows={2} placeholder="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <button onClick={save} disabled={saving} className="mt-3 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Template
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-primary" /></div>
        ) : templates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <FileCode size={32} className="mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No template packs yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {templates.map((t) => (
              <div key={t.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-semibold text-foreground">{t.template_key}</span>
                  <span className="text-xs text-foreground">{t.name}</span>
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">v{t.version}</span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{t.mode}</span>
                  <TemplateStatusBadge status={t.status} />
                </div>
                {t.description && <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TemplateStatusBadge({ status }) {
  const styles = { draft: 'bg-muted text-muted-foreground', active: 'bg-green-500/10 text-green-600', deprecated: 'bg-amber-500/10 text-amber-600', frozen: 'bg-blue-500/10 text-blue-600' };
  return <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${styles[status] || styles.draft}`}>{status}</span>;
}