import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { compileFrontend, scoreAllPatterns } from '@/lib/frontendFactory/compiler';
import { registry, REGISTRY_VERSION, countPatterns, getCategoryNames } from '@/lib/frontendFactory/registry';
import { ArrowLeft, Boxes, Cpu, Eye, Rocket, Save, Trash2, Loader2, CheckCircle, XCircle, Layers, Palette, Type, Layout, Smartphone, Monitor, Zap, Download } from 'lucide-react';

const PLATFORMS = [
  { value: 'desktop-web', label: 'Desktop Web', icon: Monitor },
  { value: 'mobile-web', label: 'Mobile Web', icon: Smartphone },
];

const NICHES = [
  'local service', 'marketing agency', 'web design', 'saas', 'e-commerce', 'healthcare',
  'legal', 'real estate', 'fitness', 'restaurant', 'beauty', 'automotive', 'home services',
];

const GOALS = ['convert leads', 'showcase work', 'sell products', 'build authority', 'generate traffic'];

const TONES = ['professional', 'friendly', 'bold', 'minimal', 'luxury', 'playful'];

export default function FrontendFactory() {
  const navigate = useNavigate();
  const [intent, setIntent] = useState({
    platform: 'desktop-web',
    product_archetype: 'marketing agency',
    primary_goal: 'convert leads',
    information_density: 'medium',
    brand_tone: 'professional',
    brand_color: '#0066ff',
    seed: `seed-${Date.now()}`,
  });
  const [buildSpec, setBuildSpec] = useState(null);
  const [scoring, setScoring] = useState(null);
  const [compiling, setCompiling] = useState(false);
  const [persisting, setPersisting] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [savedSpecs, setSavedSpecs] = useState([]);
  const [activeTab, setActiveTab] = useState('builder');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const patternCount = useMemo(() => countPatterns(), []);
  const categories = useMemo(() => getCategoryNames(), []);

  const runCompile = useCallback(() => {
    setCompiling(true);
    setError(null);
    setSuccess(null);
    try {
      const spec = compileFrontend(intent);
      setBuildSpec(spec);
      const scored = scoreAllPatterns(intent);
      setScoring(scored);
      setSuccess(`Compiled ${spec.screens.length} screens — validation: ${spec.validation.result}`);
    } catch (e) {
      setError(e.message);
    }
    setCompiling(false);
  }, [intent]);

  const persistSpec = async () => {
    if (!buildSpec) return;
    setPersisting(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('frontendFactory', {
        action: 'persist',
        build_spec: buildSpec,
        title: `UFF — ${intent.product_archetype}`,
        niche: intent.product_archetype,
      });
      setSuccess(`Saved BuildSpec: ${res.data?.project_id || buildSpec.project_id}`);
      await loadSpecs();
    } catch (e) {
      setError(e.message);
    }
    setPersisting(false);
  };

  const dispatchBuild = async () => {
    if (!buildSpec) return;
    setDispatching(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('frontendFactory', {
        action: 'dispatchBuild',
        project_id: buildSpec.project_id,
      });
      setSuccess(`Build dispatched to sandbox — Task: ${res.data?.task_id?.slice(0, 8)}`);
    } catch (e) {
      setError(e.message);
    }
    setDispatching(false);
  };

  const loadSpecs = useCallback(async () => {
    try {
      const res = await base44.functions.invoke('frontendFactory', { action: 'listSpecs' });
      setSavedSpecs(res.data?.specs || []);
    } catch (e) {
      // silent — may not have specs yet
    }
  }, []);

  React.useEffect(() => { loadSpecs(); }, [loadSpecs]);

  const deleteSpec = async (projectId) => {
    try {
      await base44.functions.invoke('frontendFactory', { action: 'deleteSpec', project_id: projectId });
      await loadSpecs();
    } catch (e) {
      setError(e.message);
    }
  };

  const eligibleCount = useMemo(() => {
    if (!scoring) return 0;
    let total = 0;
    for (const cats of Object.values(scoring)) {
      total += cats.filter((c) => c.eligible).length;
    }
    return total;
  }, [scoring]);

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-10 flex min-h-16 items-center gap-3 border-b border-border bg-background px-5 py-2 pl-16">
        <button onClick={() => navigate('/agents')} className="rounded-lg p-2 text-foreground hover:bg-muted"><ArrowLeft size={20} /></button>
        <Boxes size={18} className="text-primary" />
        <span className="text-sm font-semibold text-foreground">Frontend Factory</span>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">UFF v{REGISTRY_VERSION}</span>
        <span className="text-xs text-muted-foreground">{patternCount} patterns</span>
        <div className="ml-auto flex gap-1">
          <button onClick={() => setActiveTab('builder')} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${activeTab === 'builder' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>Builder</button>
          <button onClick={() => setActiveTab('patterns')} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${activeTab === 'patterns' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>Patterns</button>
          <button onClick={() => setActiveTab('saved')} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${activeTab === 'saved' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>Saved ({savedSpecs.length})</button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-6">
        {error && <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"><XCircle size={16}/> {error}</div>}
        {success && <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/5 px-4 py-3 text-sm text-green-600"><CheckCircle size={16}/> {success}</div>}

        {activeTab === 'builder' && (
          <div className="space-y-5">
            {/* Intent Form */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground"><Layers size={16} className="text-primary"/> Intent Contract</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-muted-foreground">Platform</label>
                  <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" value={intent.platform} onChange={e => setIntent({...intent, platform: e.target.value})}>
                    {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-muted-foreground">Niche</label>
                  <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" value={intent.product_archetype} onChange={e => setIntent({...intent, product_archetype: e.target.value})}>
                    {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-muted-foreground">Primary Goal</label>
                  <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" value={intent.primary_goal} onChange={e => setIntent({...intent, primary_goal: e.target.value})}>
                    {GOALS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-muted-foreground">Brand Tone</label>
                  <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" value={intent.brand_tone} onChange={e => setIntent({...intent, brand_tone: e.target.value})}>
                    {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-muted-foreground">Density</label>
                  <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" value={intent.information_density} onChange={e => setIntent({...intent, information_density: e.target.value})}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-muted-foreground">Brand Color</label>
                  <div className="flex gap-2">
                    <input type="color" className="h-9 w-12 rounded-lg border border-border bg-background" value={intent.brand_color} onChange={e => setIntent({...intent, brand_color: e.target.value})} />
                    <input className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" value={intent.brand_color} onChange={e => setIntent({...intent, brand_color: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={runCompile} disabled={compiling} className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40">
                  {compiling ? <Loader2 size={16} className="animate-spin"/> : <Cpu size={16}/>} Run 12-Pass Compiler
                </button>
                <button onClick={() => setIntent({...intent, seed: `seed-${Date.now()}`})} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm text-foreground hover:bg-muted">
                  <Zap size={14}/> New Seed
                </button>
              </div>
            </div>

            {/* Build Spec Output */}
            {buildSpec && (
              <>
                {/* Validation */}
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground"><CheckCircle size={16} className={buildSpec.validation.result === 'PASS' ? 'text-green-600' : 'text-destructive'}/> Validation</h2>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${buildSpec.validation.result === 'PASS' ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'}`}>{buildSpec.validation.result}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {buildSpec.validation.checks.map((c, i) => (
                      <div key={i} className="rounded-lg border border-border bg-background p-2.5">
                        <div className="flex items-center gap-1.5">
                          {c.status === 'PASS' ? <CheckCircle size={12} className="text-green-600"/> : <XCircle size={12} className="text-destructive"/>}
                          <span className="text-[10px] font-bold uppercase text-muted-foreground">{c.category.replace(/_/g, ' ')}</span>
                        </div>
                        <p className="mt-1 text-[10px] text-muted-foreground leading-tight">{c.evidence}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selected Patterns */}
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"><Layout size={16} className="text-primary"/> Selected Patterns</h2>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {Object.entries(buildSpec.selected_patterns).map(([key, val]) => (
                      <div key={key} className="rounded-lg border border-border bg-background px-3 py-2">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">{key.replace(/_/g, ' ')}</span>
                        <p className="text-xs font-medium text-foreground">{Array.isArray(val) ? val.join(', ') : val || '—'}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Screens */}
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"><Eye size={16} className="text-primary"/> Generated Screens ({buildSpec.screens.length})</h2>
                  <div className="space-y-2">
                    {buildSpec.screens.map((s, i) => (
                      <div key={i} className="rounded-lg border border-border bg-background p-3">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{s.route}</span>
                          <span className="text-sm font-medium text-foreground">{s.name}</span>
                          <span className="ml-auto text-[10px] text-muted-foreground">{s.components.length} components · {s.states.length} states</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {s.content.map((c, j) => (
                            <code key={j} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{c}</code>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Token Preview */}
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"><Palette size={16} className="text-primary"/> Design Tokens</h2>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {Object.entries(buildSpec.tokens.primitive).filter(([k]) => k.startsWith('color.primary')).slice(0, 8).map(([k, v]) => (
                      <div key={k} className="flex items-center gap-2 rounded-lg border border-border bg-background p-2">
                        <div className="h-6 w-6 rounded border border-border" style={{ background: v }} />
                        <div className="min-w-0">
                          <p className="truncate text-[10px] font-medium text-foreground">{k}</p>
                          <p className="truncate text-[10px] text-muted-foreground">{v}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button onClick={persistSpec} disabled={persisting} className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40">
                    {persisting ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Save BuildSpec
                  </button>
                  <button onClick={dispatchBuild} disabled={dispatching} className="flex items-center gap-2 rounded-lg border border-primary bg-primary/10 px-5 py-2.5 text-sm font-medium text-primary hover:bg-primary/20 disabled:opacity-40">
                    {dispatching ? <Loader2 size={16} className="animate-spin"/> : <Rocket size={16}/>} Dispatch to Sandbox
                  </button>
                </div>
              </>
            )}

            {!buildSpec && !compiling && (
              <div className="rounded-xl border border-dashed border-border p-12 text-center">
                <Cpu size={32} className="mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Configure the intent contract above and run the 12-pass compiler to generate a BuildSpec.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'patterns' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Type size={14}/>
              <span>{patternCount} patterns across {categories.length} categories{scoring ? ` · ${eligibleCount} eligible for current intent` : ''}</span>
            </div>
            {categories.map(cat => {
              const patterns = registry[cat] || [];
              const scored = scoring?.[cat] || patterns.map(p => ({ pattern: p, score: 0, eligible: false }));
              return (
                <div key={cat} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <h3 className="mb-2 text-sm font-semibold text-foreground">{cat} <span className="text-xs font-normal text-muted-foreground">({patterns.length})</span></h3>
                  <div className="flex flex-wrap gap-1.5">
                    {scored.slice(0, 12).map((s, i) => (
                      <div key={i} className={`rounded-lg border px-2.5 py-1.5 ${s.eligible ? 'border-primary/30 bg-primary/5' : 'border-border bg-background'}`} title={s.blocked_reason || `Score: ${s.score}`}>
                        <span className="text-[10px] font-bold text-foreground">{s.pattern.id}</span>
                        <span className="ml-1.5 text-[10px] text-muted-foreground">{s.pattern.name}</span>
                        {s.eligible && <span className="ml-1.5 text-[9px] font-bold text-primary">{s.score}</span>}
                      </div>
                    ))}
                    {patterns.length > 12 && <span className="self-center text-[10px] text-muted-foreground">+{patterns.length - 12} more</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="space-y-2">
            {savedSpecs.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No saved BuildSpecs yet. Compile and save one from the Builder tab.</p>
            ) : (
              savedSpecs.map(spec => (
                <div key={spec.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-sm">
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium text-foreground">{spec.title}</span>
                    <span className="ml-2 text-[10px] text-muted-foreground">{spec.task_id}</span>
                    <div className="text-[10px] text-muted-foreground">
                      <span className={`rounded px-1.5 py-0.5 font-bold uppercase ${spec.status === 'building' ? 'bg-yellow-500/10 text-yellow-600' : spec.status === 'delivered' ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}`}>{spec.status}</span>
                      {spec.deliver_to && <span className="ml-2">{spec.deliver_to}</span>}
                    </div>
                  </div>
                  <button onClick={() => deleteSpec(spec.task_id)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 size={14}/></button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}