import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, ShieldCheck, Workflow } from 'lucide-react';

export default function ServicesHero() {
  return <section className="relative overflow-hidden border-b border-border bg-muted pt-28 md:pt-20 lg:pt-24">
    <div className="agency-container grid items-center gap-10 md:min-h-[560px] md:grid-cols-[minmax(0,1.12fr)_minmax(0,.88fr)] md:gap-10">
      <div className="py-8 md:py-16">
        <p className="agency-eyebrow mb-5">ENTERPRISE AI. REAL BUSINESS IMPACT.</p>
        <h1 className="mb-6 max-w-xl font-heading text-4xl font-bold leading-[1.08] tracking-tight text-foreground md:text-4xl lg:text-6xl">AI solutions built for <span className="text-primary">what’s next.</span></h1>
        <p className="mb-8 max-w-lg text-base leading-relaxed text-muted-foreground">From strategy and data to intelligent automation, we turn your business challenges into practical solutions with measurable impact.</p>
        <div className="flex flex-wrap gap-3"><Link to="/contact" className="agency-button gap-3">Discuss your goals <ArrowRight size={16} /></Link><a href="#service-directory" className="inline-flex min-h-12 items-center justify-center rounded border border-primary px-5 py-3 text-xs font-semibold text-primary hover:bg-background">Explore our services</a></div>
        <div className="mt-10 grid gap-x-5 gap-y-3 border-t border-border pt-5 text-xs font-medium text-foreground sm:grid-cols-3"><span className="flex items-center gap-2"><BarChart3 size={18} className="shrink-0 text-primary" /> Outcome-led</span><span className="flex items-center gap-2"><ShieldCheck size={18} className="shrink-0 text-primary" /> Responsible by design</span><span className="flex items-center gap-2"><Workflow size={18} className="shrink-0 text-primary" /> End-to-end delivery</span></div>
      </div>
      <div className="relative -mx-6 h-72 overflow-hidden bg-quaternary md:-mr-10 md:ml-0 md:h-full xl:-mr-16" role="img" aria-label="Modern blue glass architecture viewed from below">
        <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1400&q=85" alt="" className="h-full w-full object-cover object-center" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-quaternary/30 to-transparent" />
      </div>
    </div>
  </section>;
}