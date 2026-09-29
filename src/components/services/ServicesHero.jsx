import { BarChart3, ShieldCheck, Workflow } from 'lucide-react';
import PageHero from '@/components/agency/PageHero';

export default function ServicesHero() {
  return <PageHero
    eyebrow="ENTERPRISE AI. REAL BUSINESS IMPACT."
    title={<>AI solutions built for <span className="text-primary">what’s next.</span></>}
    description="From strategy and data to intelligent automation, we turn your business challenges into practical solutions with measurable impact."
    ctaLabel="Discuss your goals"
    secondaryLabel="Explore our services"
    secondaryHref="#service-directory"
    details={<div className="grid gap-x-5 gap-y-3 sm:grid-cols-3"><span className="flex items-center gap-2"><BarChart3 size={18} className="shrink-0 text-primary" /> Outcome-led</span><span className="flex items-center gap-2"><ShieldCheck size={18} className="shrink-0 text-primary" /> Responsible by design</span><span className="flex items-center gap-2"><Workflow size={18} className="shrink-0 text-primary" /> End-to-end delivery</span></div>}
  />;
}