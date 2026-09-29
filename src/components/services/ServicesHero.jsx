import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, ShieldCheck, Workflow } from 'lucide-react';
import BuildingHeroBackdrop from '@/components/agency/BuildingHeroBackdrop';

export default function ServicesHero() {
  return <section className="site-hero relative isolate flex min-h-[650px] items-center overflow-hidden border-b border-border bg-muted pb-16 pt-28 md:min-h-[620px] md:pt-24">
    <BuildingHeroBackdrop />
    <div className="agency-container"><div className="max-w-2xl py-12">
      <p className="agency-eyebrow mb-5">ENTERPRISE AI. REAL BUSINESS IMPACT.</p>
      <h1 className="mb-6 max-w-xl font-heading text-4xl font-bold leading-[1.08] tracking-tight text-foreground md:text-5xl lg:text-6xl">AI solutions built for <span className="text-primary">what’s next.</span></h1>
      <p className="mb-8 max-w-lg text-base leading-relaxed text-muted-foreground">From strategy and data to intelligent automation, we turn your business challenges into practical solutions with measurable impact.</p>
      <div className="flex flex-wrap gap-3"><Link to="/contact" className="agency-button gap-3">Discuss your goals <ArrowRight size={16} /></Link><a href="#service-directory" className="inline-flex min-h-12 items-center justify-center rounded border border-primary bg-background/80 px-5 py-3 text-sm font-semibold text-primary hover:bg-background">Explore our services</a></div>
      <div className="mt-10 grid gap-x-5 gap-y-3 border-t border-border pt-5 text-sm font-medium text-foreground sm:grid-cols-3"><span className="flex items-center gap-2"><BarChart3 size={18} className="shrink-0 text-primary" /> Outcome-led</span><span className="flex items-center gap-2"><ShieldCheck size={18} className="shrink-0 text-primary" /> Responsible by design</span><span className="flex items-center gap-2"><Workflow size={18} className="shrink-0 text-primary" /> End-to-end delivery</span></div>
    </div></div>
  </section>;
}