import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, ShieldCheck, Workflow } from 'lucide-react';

export default function ServicesHero() {
  return <section className="relative flex min-h-[680px] flex-col justify-center md:flex-row md:items-center overflow-hidden border-b border-border bg-background pb-16 pt-32 md:min-h-[640px] lg:min-h-[700px] lg:pt-36">
    <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[57%] overflow-hidden md:block" aria-hidden="true"><img src="https://media.base44.com/images/public/6abae414a929d6dc5a55b9cc/c56359855_image.png" alt="" className="absolute left-[-85%] top-[-8%] w-[210%] max-w-none" /></div>
    <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-background via-background/95 to-background/10 md:block" />
    <div className="agency-container relative z-10 w-full"><div className="max-w-[560px]">
      <p className="agency-eyebrow mb-5">ENTERPRISE AI. REAL BUSINESS IMPACT.</p>
      <h1 className="mb-6 font-heading text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">AI solutions built for <span className="text-primary">what’s next.</span></h1>
      <p className="mb-8 max-w-lg text-base leading-relaxed text-muted-foreground">From strategy and data to intelligent automation, we turn your business challenges into practical solutions with measurable impact.</p>
      <div className="flex flex-wrap gap-3"><Link to="/contact" className="agency-button gap-3">Book an Executive Consultation <ArrowRight size={16} /></Link><a href="#service-directory" className="inline-flex min-h-12 items-center justify-center rounded border border-primary px-5 py-3 text-xs font-semibold text-primary hover:bg-muted">Explore our services</a></div>
      <div className="mt-10 grid gap-4 border-t border-border pt-6 sm:grid-cols-3"><span className="flex items-center gap-2 text-xs font-medium text-foreground"><BarChart3 size={19} className="shrink-0 text-primary" /> Outcome-led</span><span className="flex items-center gap-2 text-xs font-medium text-foreground"><ShieldCheck size={19} className="shrink-0 text-primary" /> Responsible by design</span><span className="flex items-center gap-2 text-xs font-medium text-foreground"><Workflow size={19} className="shrink-0 text-primary" /> End-to-end delivery</span></div>
    </div></div>
    <div className="agency-container relative z-10 mt-8 md:hidden"><div className="relative h-64 overflow-hidden rounded border border-border bg-muted" role="img" aria-label="Blue architectural cityscape representing connected business intelligence"><img src="https://media.base44.com/images/public/6abae414a929d6dc5a55b9cc/c56359855_image.png" alt="" className="absolute left-[-85%] top-[-8%] w-[210%] max-w-none" /></div></div>
  </section>;
}