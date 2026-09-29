import { BarChart3, ShieldCheck, UsersRound } from 'lucide-react';
import NewsletterForm from '@/components/forms/newsletter-form';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import BuildingHeroBackdrop from '@/components/agency/BuildingHeroBackdrop';

export default function SectionHero() {
  return <section className="site-hero relative isolate overflow-hidden bg-muted pb-12 pt-28 lg:pt-36">
    <BuildingHeroBackdrop />
    <div className="agency-container">
      <div className="mb-9 flex min-h-[480px] items-center">
        <div className="relative z-10 max-w-2xl py-6">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">AI transformation for what's next</p>
          <h1 className="mb-5 max-w-xl font-heading text-4xl font-bold leading-[1.05] tracking-tight lg:text-5xl">Strategy. Intelligence. <span className="text-primary">Automation. Growth.</span></h1>
          <p className="mb-4 max-w-md text-base leading-relaxed">We design and deploy AI systems that help businesses operate smarter, make better decisions and accelerate measurable growth.</p>
          <p className="mb-7 text-xs font-medium text-foreground">Engagements starting at $2,500 · Managed AI from $2,500/month · Enterprise solutions available</p>
          <div className="flex flex-wrap gap-3"><Link to="/contact" className="agency-button gap-3">Book an Executive Consultation <ArrowRight size={15} /></Link><Link to="/services" className="inline-flex items-center rounded border border-primary px-5 py-3 text-xs font-medium text-primary">Explore Our Services</Link></div>
          <div className="mt-10 grid gap-4 border-t border-border pt-6 sm:grid-cols-3"><span className="flex items-center gap-2 text-xs text-foreground"><BarChart3 size={20} className="shrink-0 text-primary" /> Measurable outcomes</span><span className="flex items-center gap-2 text-xs text-foreground"><ShieldCheck size={20} className="shrink-0 text-primary" /> Responsible AI</span><span className="flex items-center gap-2 text-xs text-foreground"><UsersRound size={20} className="shrink-0 text-primary" /> End-to-end partnership</span></div>
        </div>
      </div>
      <div id="resources" className="scroll-mt-28 rounded-md border border-border bg-card p-6 shadow-sm md:px-10 md:py-8"><h2 className="mb-6 text-lg">Get the free checklist, 7 ways to improve your business</h2><NewsletterForm /></div>
    </div>
  </section>;
}