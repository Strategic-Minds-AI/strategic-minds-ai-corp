import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Boxes, Cpu, FileCode, CheckCircle, XCircle, Loader2, Plus, Layers, Workflow, Package, Shield, Wrench, Cloud, FolderKanban, Settings, Activity, ShieldCheck, FileSearch } from 'lucide-react';
import { REGISTRY_VERSION, ALL_GENERATOR_TYPES, GENERATOR_CATEGORIES, countGeneratorTypes, countProvisioningTemplates, countAIConsultingTemplates } from '@/lib/universalFactory/registry';

export default function FactoryOS() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [generators, setGenerators] = useState([]);
  const [recentRuns, setRecentRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, gensRes, runsRes] = await Promise.all([
        base44.functions.invoke('factoryOS', { action: 'dashboardStats' }),
        base44.functions.invoke('factoryOS', { action: 'listGenerators' }),
        base44.functions.invoke('factoryOS', { action: 'listRuns', limit: 10 }),
      ]);
      setStats(statsRes.data);
      setGenerators(gensRes.data?.generators || []);
      setRecentRuns(runsRes.data?.runs || []);
    } catch (e) {
      // silent — may not have data yet
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const ROUTES = [
    { path: '/factory/studio', label: 'Generator Studio', icon: Workflow, desc: 'Compose generator DAGs visually' },
    { path: '/factory/runs', label: 'Run Console', icon: Activity, desc: 'Monitor execution and step logs' },
    { path: '/factory/artifacts', label: 'Artifact Explorer', icon: Package, desc: 'Browse generated artifacts' },
    { path: '/factory/validation', label: 'Validation Center', icon: CheckCircle, desc: 'Review validation receipts' },
    { path: '/factory/repairs', label: 'Repair Center', icon: Wrench, desc: 'Track repair tasks' },
    { path: '/factory/approvals', label: 'Approvals', icon: Shield, desc: 'Approve protected actions' },
    { path: '/factory/provisioning', label: 'Provisioning Center', icon: Cloud, desc: 'Plan-first provisioning' },
    { path: '/factory/consulting', label: 'AI Consulting Factory', icon: Cpu, desc: '34 consulting generators' },
    { path: '/factory/templates', label: 'Template Library', icon: FileCode, desc: 'Versioned template packs' },
    { path: '/factory/adapters', label: 'Adapter Library', icon: Boxes, desc: 'Extensible adapter system' },
    { path: '/factory/projects', label: 'Projects', icon: FolderKanban, desc: 'Factory project intake' },
    { path: '/factory/scanner', label: 'No-Stub Scanner', icon: ShieldCheck, desc: 'Completeness audit & stub detection' },
    { path: '/provisioner', label: 'System Provisioner', icon: Cloud, desc: 'Provision GitHub + Vercel + Railway + Supabase + domains' },
    { path: '/diagnostic', label: 'Business Diagnostic', icon: FileSearch, desc: 'Audit companies, find revenue leaks, repair plans' },
    { path: '/frontend-factory', label: 'Frontend Factory', icon: Layers, desc: 'UFF v2 — 740 patterns' },
  ];

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="sticky top-0 z-10 flex min-h-16 items-center gap-3 border-b border-border bg-background px-5 py-2 pl-16">
        <button onClick={() => navigate('/agents')} className="rounded-lg p-2 text-foreground hover:bg-muted"><ArrowLeft size={20} /></button>
        <Boxes size={18} className="text-primary" />
        <span className="text-sm font-semibold text-foreground">Universal Factory OS</span>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">v{REGISTRY_VERSION}</span>
        <span className="text-xs text-muted-foreground">{countGeneratorTypes()} generator types · {countProvisioningTemplates()} provisioning · {countAIConsultingTemplates()} consulting</span>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-primary" /></div>
        ) : (
          <>
            {/* Dashboard Stats */}
            {stats && (
              <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <StatCard label="Generators" value={stats.generators || 0} icon={Workflow} />
                <StatCard label="Runs" value={stats.runs || 0} icon={Activity} />
                <StatCard label="Projects" value={stats.projects || 0} icon={FolderKanban} />
                <StatCard label="Artifacts" value={stats.artifacts || 0} icon={Package} />
                <StatCard label="Open Repairs" value={stats.open_repairs || 0} icon={Wrench} />
                <StatCard label="Pending Approvals" value={stats.pending_approvals || 0} icon={Shield} />
              </div>
            )}

            {/* Route Grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ROUTES.map((route) => (
                <button
                  key={route.path}
                  onClick={() => navigate(route.path)}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:-top-0.5 hover:shadow-md"
                >
                  <route.icon size={20} className="mt-0.5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{route.label}</p>
                    <p className="text-xs text-muted-foreground">{route.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Recent Runs */}
            {recentRuns.length > 0 && (
              <div className="mt-6">
                <h2 className="mb-3 text-sm font-semibold text-foreground">Recent Runs</h2>
                <div className="space-y-2">
                  {recentRuns.map((run) => (
                    <div key={run.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                      <StatusBadge status={run.status} />
                      <span className="text-xs font-mono text-muted-foreground">{run.run_id}</span>
                      <span className="text-sm text-foreground">{run.generator_key}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{run.generator_version}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generator Registry Preview */}
            <div className="mt-6">
              <h2 className="mb-3 text-sm font-semibold text-foreground">Generator Type Registry ({countGeneratorTypes()} types)</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {GENERATOR_CATEGORIES.map((cat) => {
                  const count = ALL_GENERATOR_TYPES.filter((g) => g.category === cat).length;
                  return (
                    <div key={cat} className="rounded-lg border border-border bg-card p-3">
                      <p className="text-xs font-bold uppercase text-primary">{cat}</p>
                      <p className="text-lg font-semibold text-foreground">{count}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <Icon size={14} className="text-primary" />
        <span className="text-[10px] font-bold uppercase text-muted-foreground">{label}</span>
      </div>
      <p className="mt-1 text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    PASSED: 'bg-green-500/10 text-green-600',
    FAILED: 'bg-destructive/10 text-destructive',
    RUNNING: 'bg-blue-500/10 text-blue-600',
    BLOCKED: 'bg-amber-500/10 text-amber-600',
    CANCELLED: 'bg-muted text-muted-foreground',
    DRAFT: 'bg-muted text-muted-foreground',
    EXPORTED: 'bg-purple-500/10 text-purple-600',
  };
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${styles[status] || styles.DRAFT}`}>{status}</span>;
}