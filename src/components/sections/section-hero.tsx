import HeroTriangle from '@/components/hero-triangle';
import NewsletterForm from '@/components/forms/newsletter-form';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function SectionHero() {
  return <section className="relative overflow-hidden bg-background pb-12 pt-28 lg:pt-36">
    <div className="container max-w-6xl">
      <div className="mb-9 grid items-center gap-7 md:grid-cols-2 md:gap-2">
        <div className="relative z-10 py-6">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">AI transformation for what's next</p>
          <h1 className="mb-5 max-w-xl font-heading text-4xl font-bold leading-[1.05] tracking-tight lg:text-5xl">Marketing that generates <span className="text-primary">real results.</span></h1>
          <p className="mb-7 max-w-md text-base leading-relaxed">Focus on engaging, reusable content that reduces your cost per lead and helps you grow your business.</p>
          <div className="flex flex-wrap gap-3"><Link to="/contact" className="agency-button gap-3">Book a Consultation <ArrowRight size={15} /></Link><Link to="/services" className="inline-flex items-center rounded border border-primary px-5 py-3 text-xs font-medium text-primary">Explore Our Services</Link></div>
        </div>
        <HeroTriangle />
      </div>
      <div id="resources" className="scroll-mt-28 rounded-md border border-border bg-card p-6 shadow-sm md:px-10 md:py-8"><h2 className="mb-6 text-lg">Get the free checklist, 7 ways to improve your business</h2><NewsletterForm /></div>
    </div>
  </section>;
}