import { SearchCheck, Map, Wrench, ChartNoAxesCombined } from 'lucide-react';
const steps = [
  { icon: SearchCheck, title: 'Align', detail: 'Understand goals, challenges and opportunities.' },
  { icon: Map, title: 'Plan', detail: 'Create a tailored strategy and roadmap with clear milestones.' },
  { icon: Wrench, title: 'Build', detail: 'Design and deploy AI solutions with quality and accountability.' },
  { icon: ChartNoAxesCombined, title: 'Scale', detail: 'Measure impact, optimize performance and expand what works.' },
];
export default function HomeProcess() {
  return <section className="bg-muted py-16 lg:py-24"><div className="agency-container"><p className="agency-eyebrow mb-3">OUR PROCESS</p><h2 className="agency-heading mb-2">A proven path to AI success.</h2><p className="mb-10 max-w-xl text-sm">We combine strategic insight with hands-on execution to deliver solutions that create lasting value.</p><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{steps.map((step, index) => <article key={step.title} className="border border-border bg-card p-6"><div className="mb-8 flex items-center justify-between"><span className="flex h-11 w-11 items-center justify-center rounded bg-muted text-primary"><step.icon size={22} strokeWidth={1.8} /></span><span className="text-xs font-semibold text-primary">0{index + 1}</span></div><h3 className="mb-2 text-lg">{step.title}</h3><p className="text-sm leading-relaxed">{step.detail}</p></article>)}</div></div></section>;
}