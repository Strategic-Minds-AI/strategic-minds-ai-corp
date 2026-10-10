import { Rocket, Globe, Zap, FileText, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';
import { getCategoryById } from '@/lib/universalCategories';

const PIPELINE_STEPS = [
  { icon: Globe, label: 'Intelligence', desc: 'Search + competitor research' },
  { icon: Zap, label: 'Brand & Domain', desc: 'Name gen + domain check' },
  { icon: FileText, label: 'Content Flood', desc: '500+ SEO pages generated' },
  { icon: TrendingUp, label: 'Technical SEO', desc: 'Schema, sitemaps, GSC' },
  { icon: Sparkles, label: 'AI Search', desc: 'AEO, llms.txt, knowledge panel' },
];

export default function LaunchSummary({ category, cities, config, onLaunch, launching }) {
  const cat = getCategoryById(category);
  const totalSites = cities.length;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5">
        <div className="flex items-center gap-3 mb-4">
          <Rocket className="h-6 w-6 text-primary" />
          <div>
            <h3 className="text-lg font-bold text-foreground">Mass Launch Summary</h3>
            <p className="text-sm text-muted-foreground">Review and launch your nationwide website empire</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-background p-3">
            <p className="text-2xl font-bold text-primary">{totalSites}</p>
            <p className="text-xs text-muted-foreground">Websites to launch</p>
          </div>
          <div className="rounded-lg bg-background p-3">
            <p className="text-sm font-bold text-foreground">{cat?.label || '—'}</p>
            <p className="text-xs text-muted-foreground">Category</p>
          </div>
          <div className="rounded-lg bg-background p-3">
            <p className="text-sm font-bold text-foreground">{config.tone || 'professional'}</p>
            <p className="text-xs text-muted-foreground">Content tone</p>
          </div>
          <div className="rounded-lg bg-background p-3">
            <p className="text-sm font-bold text-foreground">{config.autoDeployVercel ? 'Vercel + GitHub' : 'Manual'}</p>
            <p className="text-xs text-muted-foreground">Deployment</p>
          </div>
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-semibold text-foreground">Each website runs through this pipeline:</h4>
        <div className="flex flex-wrap items-center gap-2">
          {PIPELINE_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.label} className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs font-bold text-foreground">{i + 1}. {step.label}</p>
                    <p className="text-[10px] text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
                {i < PIPELINE_STEPS.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <h4 className="mb-2 text-sm font-semibold text-foreground">Cities ({cities.length})</h4>
        <div className="flex flex-wrap gap-1.5">
          {cities.slice(0, 30).map(c => (
            <span key={c} className="rounded-full bg-background px-2.5 py-1 text-[11px] text-foreground border border-border">{c}</span>
          ))}
          {cities.length > 30 && <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">+{cities.length - 30} more</span>}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h4 className="mb-2 text-sm font-semibold text-foreground">Google Standards Compliance</h4>
        <ul className="space-y-1 text-xs text-muted-foreground">
          <li>✓ Schema.org structured data (LocalBusiness, Service, FAQ)</li>
          <li>✓ XML sitemap + robots.txt auto-generated</li>
          <li>✓ Core Web Vitals optimized (LCP &lt; 2.5s, CLS &lt; 0.1)</li>
          <li>✓ Mobile-first responsive design</li>
          <li>✓ Google Search Console + IndexNow submission</li>
          <li>✓ AEO / llms.txt for AI search optimization</li>
        </ul>
      </div>

      <button
        onClick={onLaunch}
        disabled={launching || totalSites === 0}
        className="flex w-full items-center justify-center gap-3 rounded-xl bg-primary px-6 py-4 text-base font-bold text-primary-foreground hover:opacity-90 disabled:opacity-40"
      >
        {launching ? (
          <><div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> Launching {totalSites} websites...</>
        ) : (
          <><Rocket className="h-5 w-5" /> Launch {totalSites} Website{totalSites !== 1 ? 's' : ''} Nationwide</>
        )}
      </button>
    </div>
  );
}