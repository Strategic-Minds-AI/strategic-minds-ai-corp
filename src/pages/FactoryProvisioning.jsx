import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Cloud, Loader2, Plus, Shield, FileCode } from 'lucide-react';
import { ALL_PROVISIONING_TEMPLATES, countProvisioningTemplates } from '@/lib/universalFactory/registry';

export default function FactoryProvisioning() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRegistry, setShowRegistry] = useState(false);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('factoryOS', { action: 'listProvisioningPlans' });
      setPlans(res.data?.plans || []);
    } catch (e) { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadPlans(); }, [loadPlans]);

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="sticky top-0 z-10 flex min-h-16 items-center gap-3 border-b border-border bg-background px-5 py-2 pl-16">
        <button onClick={() => navigate('/factory')} className="rounded-lg p-2 text-foreground hover:bg-muted"><ArrowLeft size={20} /></button>
        <Cloud size={18} className="text-primary" />
        <span className="text-sm font-semibold text-foreground">Provisioning Center</span>
        <span className="text-xs text-muted-foreground">{countProvisioningTemplates()} templates in registry</span>
        <button onClick={() => setShowRegistry(!showRegistry)} className="ml-auto rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:bg-muted">Registry</button>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-6">
        {showRegistry ? (
          <div className="space-y-2">
            <h2 className="mb-2 text-sm font-semibold text-foreground">Provisioning Template Registry ({ALL_PROVISIONING_TEMPLATES.length})</h2>
            {ALL_PROVISIONING_TEMPLATES.map((t) => (
              <div key={t.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <FileCode size={16} className="text-primary" />
                  <span className="font-mono text-sm font-semibold text-foreground">{t.id}</span>
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">v{t.version}</span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{t.mode}</span>
                  {t.live_execution_requires_approval && <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">approval required</span>}
                </div>
              </div>
            ))}
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-primary" /></div>
        ) : plans.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <Cloud size={32} className="mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No provisioning plans yet. Plans are created from the execution engine.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {plans.map((p) => (
              <div key={p.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <PlanStatusBadge status={p.status} />
                  <span className="text-sm font-semibold text-foreground">{p.name}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{p.plan_id}</span>
                  {p.template_id && <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">{p.template_id}</span>}
                </div>
                {p.credential_requirements?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Shield size={10} className="text-muted-foreground" />
                    {p.credential_requirements.map((c) => <span key={c} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{c}</span>)}
                  </div>
                )}
                {p.risk_summary && p.risk_summary !== '{}' && (
                  <pre className="mt-2 max-h-24 overflow-auto rounded-lg bg-muted p-2 text-xs text-muted-foreground">{p.risk_summary}</pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PlanStatusBadge({ status }) {
  const styles = { draft: 'bg-muted text-muted-foreground', awaiting_approval: 'bg-amber-500/10 text-amber-600', approved: 'bg-blue-500/10 text-blue-600', executing: 'bg-cyan-500/10 text-cyan-600', completed: 'bg-green-500/10 text-green-600', failed: 'bg-destructive/10 text-destructive', rolled_back: 'bg-orange-500/10 text-orange-600' };
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${styles[status] || styles.draft}`}>{status}</span>;
}