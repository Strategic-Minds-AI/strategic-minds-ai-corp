import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';
import CategoryPicker from '@/components/masslaunch/CategoryPicker';
import CityPicker from '@/components/masslaunch/CityPicker';
import BrandConfig from '@/components/masslaunch/BrandConfig';
import LaunchSummary from '@/components/masslaunch/LaunchSummary';
import CampaignMonitor from '@/components/masslaunch/CampaignMonitor';
import { base44 } from '@/api/base44Client';
import { getCategoryById } from '@/lib/universalCategories';

const STEPS = [
  { id: 'category', label: 'Category', desc: 'Pick your business vertical' },
  { id: 'cities', label: 'Cities', desc: 'Choose launch locations' },
  { id: 'brand', label: 'Brand', desc: 'Configure look & feel' },
  { id: 'launch', label: 'Launch', desc: 'Review & deploy' },
  { id: 'monitor', label: 'Monitor', desc: 'Track progress' },
];

export default function MassLaunchConsole() {
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState('');
  const [cities, setCities] = useState([]);
  const [config, setConfig] = useState({
    phone: '772-209-0266',
    email: '',
    primaryColor: '#0066FF',
    accentColor: '#004CE6',
    tone: 'professional',
    autoDeployVercel: true,
    autoPurchaseDomain: false,
    syncToGpt: true,
    runFullPipeline: true,
  });
  const [launching, setLaunching] = useState(false);
  const [batchId, setBatchId] = useState(null);
  const [error, setError] = useState(null);

  const canProceed = () => {
    if (step === 0) return !!category;
    if (step === 1) return cities.length > 0;
    return true;
  };

  const handleLaunch = async () => {
    setLaunching(true);
    setError(null);
    try {
      const cat = getCategoryById(category);
      const res = await base44.functions.invoke('massLaunch', {
        action: 'createBatch',
        category_id: category,
        category_label: cat?.label,
        keyword: cat?.keyword,
        services: cat?.services,
        cities,
        config,
        auto_deploy_vercel: config.autoDeployVercel,
        auto_purchase_domain: config.autoPurchaseDomain,
        sync_to_gpt: config.syncToGpt,
        run_full_pipeline: config.runFullPipeline,
      });
      if (res.data?.error) throw new Error(res.data.error);
      setBatchId(res.data?.batch_id);
      setStep(4);
    } catch (e) {
      setError(e.message);
    }
    setLaunching(false);
  };

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="sticky top-0 z-10 flex min-h-16 items-center gap-3 border-b border-border bg-background px-5 py-2 pl-16">
        <Link to="/agents" className="rounded-lg p-2 text-foreground hover:bg-muted"><ArrowLeft size={20} /></Link>
        <Rocket size={18} className="text-primary" />
        <span className="text-sm font-semibold text-foreground">Mass Launch Console</span>
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">Universal · Nationwide</span>
        <Link to="/dominance" className="ml-auto rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted">Single Campaign →</Link>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Step indicator */}
        <div className="mb-8 flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-all ${i < step ? 'border-primary bg-primary text-primary-foreground' : i === step ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground'}`}>
                  {i < step ? <Check className="h-5 w-5" /> : i + 1}
                </div>
                <div className="mt-1.5 text-center">
                  <p className={`text-xs font-semibold ${i <= step ? 'text-foreground' : 'text-muted-foreground'}`}>{s.label}</p>
                  <p className="hidden text-[10px] text-muted-foreground sm:block">{s.desc}</p>
                </div>
              </div>
              {i < STEPS.length - 1 && <div className={`mx-2 h-0.5 flex-1 rounded ${i < step ? 'bg-primary' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Step content */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {step === 0 && <CategoryPicker selected={category} onSelect={setCategory} />}
          {step === 1 && <CityPicker selected={cities} onChange={setCities} />}
          {step === 2 && <BrandConfig config={config} onChange={setConfig} category={category} />}
          {step === 3 && <LaunchSummary category={category} cities={cities} config={config} onLaunch={handleLaunch} launching={launching} />}
          {step === 4 && <CampaignMonitor batchId={batchId} onReset={() => { setStep(0); setBatchId(null); setCategory(''); setCities([]); }} />}
        </div>

        {/* Navigation */}
        {step < 4 && (
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            {step < 3 && (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed()}
                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40"
              >
                Next <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}