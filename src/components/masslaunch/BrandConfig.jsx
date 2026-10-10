import { Phone, Palette, Type } from 'lucide-react';
import { getCategoryById } from '@/lib/universalCategories';

export default function BrandConfig({ config, onChange, category }) {
  const cat = getCategoryById(category);
  const update = (patch) => onChange({ ...config, ...patch });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase text-muted-foreground">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="tel"
              value={config.phone}
              onChange={e => update({ phone: e.target.value })}
              placeholder="772-209-0266"
              className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase text-muted-foreground">Email</label>
          <input
            type="email"
            value={config.email}
            onChange={e => update({ email: e.target.value })}
            placeholder="hello@example.com"
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase text-muted-foreground">Primary Color</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={config.primaryColor}
              onChange={e => update({ primaryColor: e.target.value })}
              className="h-10 w-16 cursor-pointer rounded-lg border border-border"
            />
            <input
              type="text"
              value={config.primaryColor}
              onChange={e => update({ primaryColor: e.target.value })}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase text-muted-foreground">Accent Color</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={config.accentColor}
              onChange={e => update({ accentColor: e.target.value })}
              className="h-10 w-16 cursor-pointer rounded-lg border border-border"
            />
            <input
              type="text"
              value={config.accentColor}
              onChange={e => update({ accentColor: e.target.value })}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase text-muted-foreground">Content Tone</label>
        <div className="flex flex-wrap gap-2">
          {['Professional', 'Friendly', 'Luxury', 'Bold', 'Minimal', 'Trustworthy'].map(tone => (
            <button
              key={tone}
              onClick={() => update({ tone: tone.toLowerCase() })}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${config.tone === tone.toLowerCase() ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-secondary'}`}
            >
              {tone}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          <input type="checkbox" checked={config.autoDeployVercel} onChange={e => update({ autoDeployVercel: e.target.checked })} className="h-4 w-4 rounded border-border" />
          <div>
            <p className="text-sm font-semibold text-foreground">Auto-deploy to Vercel</p>
            <p className="text-xs text-muted-foreground">Provision + deploy each site automatically</p>
          </div>
        </label>
        <label className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          <input type="checkbox" checked={config.autoPurchaseDomain} onChange={e => update({ autoPurchaseDomain: e.target.checked })} className="h-4 w-4 rounded border-border" />
          <div>
            <p className="text-sm font-semibold text-foreground">Auto-purchase domains</p>
            <p className="text-xs text-muted-foreground">Buy domains via GoDaddy API</p>
          </div>
        </label>
        <label className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          <input type="checkbox" checked={config.syncToGpt} onChange={e => update({ syncToGpt: e.target.checked })} className="h-4 w-4 rounded border-border" />
          <div>
            <p className="text-sm font-semibold text-foreground">Sync to ChatGPT</p>
            <p className="text-xs text-muted-foreground">Bidirectional GPT sync for webpack uploads</p>
          </div>
        </label>
        <label className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          <input type="checkbox" checked={config.runFullPipeline} onChange={e => update({ runFullPipeline: e.target.checked })} className="h-4 w-4 rounded border-border" />
          <div>
            <p className="text-sm font-semibold text-foreground">Run full 8-phase pipeline</p>
            <p className="text-xs text-muted-foreground">Intelligence → Content → SEO → Fame → Continuous</p>
          </div>
        </label>
      </div>

      {cat && (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Category Preview: {cat.label}</p>
          <div className="flex flex-wrap gap-1.5">
            {cat.services.map(s => (
              <span key={s} className="rounded-full bg-background px-2.5 py-1 text-[11px] text-foreground border border-border">{s}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}