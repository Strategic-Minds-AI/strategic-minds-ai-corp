import { Compass, Workflow, Layers, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const services = [
  { number: '01', icon: Compass, title: 'AI strategy & advisory', copy: 'Know where to start. Identify the opportunities that matter, align your team, and build a practical roadmap for AI adoption.', detail: 'Opportunity mapping / Roadmaps / Advisory' },
  { number: '02', icon: Workflow, title: 'Intelligent automation', copy: 'Give your team room to do their best work. Connect your tools and turn repetitive processes into dependable workflows.', detail: 'Workflow design / Integrations / AI assistants' },
  { number: '03', icon: Layers, title: 'Digital experiences', copy: 'Make every interaction count. Create websites and business applications that are as useful as they are considered.', detail: 'Web experiences / Applications / Client portals' },
];
export default function AgencyExpertise() {
  return <section id="expertise" className="scroll-mt-24 border-y border-border bg-muted/50 py-20 lg:py-24"><div className="agency-container">
    <div className="mb-12 grid gap-5 md:grid-cols-2"><div><p className="agency-eyebrow mb-4">01 / OUR EXPERTISE</p><h2 className="agency-heading mb-0">Intelligence, with<br /><em>real-world purpose.</em></h2></div><p className="max-w-sm self-end text-sm leading-relaxed text-muted-foreground md:ml-auto">Not technology for its own sake. The right thinking, tools, and execution for what your business needs next.</p></div>
    <div className="grid divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">{services.map(({ number, icon: Icon, title, copy, detail }) => <article key={number} className="py-8 md:px-7 first:md:pl-0 last:md:pr-0"><div className="mb-10 flex items-center justify-between"><Icon className="h-7 w-7 text-primary" strokeWidth={1.3} /><span className="font-display text-sm text-muted-foreground">{number}</span></div><h3 className="mb-4 text-lg font-medium">{title}</h3><p className="mb-7 text-sm leading-relaxed">{copy}</p><p className="border-t border-border pt-5 text-[10px] leading-relaxed tracking-wide text-muted-foreground">{detail}</p><Link to="/contact" className="mt-6 inline-flex items-center gap-2 text-xs font-medium text-foreground" aria-label={`Discuss ${title}`}>Let's talk <ArrowUpRight size={14} /></Link></article>)}</div>
  </div></section>;
}