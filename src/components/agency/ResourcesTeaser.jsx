import { Link } from 'react-router-dom';
import { Smartphone, ArrowRight, Lightbulb, TrendingUp, Key, Wand2 } from 'lucide-react';

export default function ResourcesTeaser() {
  return (
    <section className="agency-container py-12 lg:py-20">
      <div className="overflow-hidden rounded-md border border-border bg-card shadow-lg">
        <div className="grid gap-0 lg:grid-cols-2">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 text-primary-foreground md:p-12">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-blue-100">FREE INSIDER APP</p>
            <h2 className="mb-4 text-2xl font-bold leading-tight text-primary-foreground md:text-3xl">Put insider business intelligence in your pocket.</h2>
            <p className="mb-6 max-w-md text-sm leading-relaxed text-blue-100">Install the Strategic Minds Insider app on your phone. Get ongoing tips, tricks, and wealth-building strategies — free, no signup wall, works offline.</p>
            <Link to="/resources" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-xs font-bold text-blue-700 hover:bg-blue-50">
              <Smartphone size={16} /> Get the app <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 p-8 md:p-12">
            <Feature icon={Lightbulb} label="Quick Tips" />
            <Feature icon={Wand2} label="Insider Tricks" />
            <Feature icon={TrendingUp} label="Wealth Builders" />
            <Feature icon={Key} label="Insider Secrets" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Feature({ icon: Icon, label }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-muted/50 p-4 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40">
        <Icon size={20} />
      </div>
      <p className="text-xs font-semibold text-foreground">{label}</p>
    </div>
  );
}