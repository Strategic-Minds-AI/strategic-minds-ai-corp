import { BarChart3, ShieldCheck, UsersRound } from 'lucide-react';
import PageHero from '@/components/agency/PageHero';

export default function SectionHero() {
  return <PageHero
    eyebrow="AI TRANSFORMATION FOR WHAT'S NEXT"
    title={<>Strategy. Intelligence. <span className="text-primary">Automation. Growth.</span></>}
    description="We design and deploy AI systems that help businesses operate smarter, make better decisions and accelerate measurable growth."
    note="Engagements starting at $2,500 · Managed AI from $2,500/month · Enterprise solutions available"
    ctaLabel="Book an Executive Consultation"
    secondaryLabel="Explore Our Services"
    secondaryHref="/services"
    details={<div className="grid gap-4 sm:grid-cols-3"><span className="flex items-center gap-2"><BarChart3 size={20} className="shrink-0 text-primary" /> Measurable outcomes</span><span className="flex items-center gap-2"><ShieldCheck size={20} className="shrink-0 text-primary" /> Responsible AI</span><span className="flex items-center gap-2"><UsersRound size={20} className="shrink-0 text-primary" /> End-to-end partnership</span></div>}
  />;
}