import { ArrowUpRight, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import ServiceVisual from './ServiceVisual';

export default function ServiceCard({ group, index, Icon, expanded, onToggle }) {
  return <article id={group.id} className="scroll-mt-28 overflow-hidden rounded border border-border bg-card shadow-sm transition-shadow hover:border-primary/50 hover:shadow-md">
    <button type="button" aria-expanded={expanded} aria-controls={`service-details-${group.id}`} onClick={onToggle} className="group block w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary">
      <ServiceVisual index={index} />
      <div className="p-6 md:p-7">
        <div className="mb-5 flex items-center justify-between"><span className="flex h-11 w-11 items-center justify-center rounded bg-muted text-primary"><Icon size={23} strokeWidth={1.8} /></span><ChevronDown size={20} className={`text-primary transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" /></div>
        <h3 className="mb-2 text-xl font-bold group-hover:text-primary">{group.title}</h3>
        <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{group.description}</p>
        <span className="text-sm font-semibold text-primary">{expanded ? 'Hide solutions' : 'Explore solutions'}</span>
      </div>
    </button>
    <div id={`service-details-${group.id}`} hidden={!expanded} className="border-t border-border px-6 pb-7 pt-3 md:px-7"><ul className="divide-y divide-border">{group.offers.map(([name, price]) => <li key={name} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3 text-sm"><span className="text-foreground">{name}</span><span className="font-semibold text-primary">{price}</span></li>)}</ul><Link to="/contact" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary underline underline-offset-4">Discuss this service <ArrowUpRight size={16} /></Link></div>
  </article>;
}