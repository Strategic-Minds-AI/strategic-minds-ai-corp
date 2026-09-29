import { useState } from 'react';
import { categories } from './serviceCatalog';
import ServiceCard from './ServiceCard';
import { BrainCircuit, Bot, MessagesSquare, Database, Megaphone, Search, Handshake, Globe, Blocks, GraduationCap, ShieldCheck, RefreshCw } from 'lucide-react';

const icons = { strategy: BrainCircuit, automation: Bot, knowledge: MessagesSquare, data: Database, marketing: Megaphone, search: Search, crm: Handshake, websites: Globe, software: Blocks, training: GraduationCap, governance: ShieldCheck, managed: RefreshCw };

export default function ServiceDirectory() {
  const [activeId, setActiveId] = useState(() => categories.some(group => `#${group.id}` === window.location.hash) ? window.location.hash.slice(1) : null);
  return <section id="service-directory" className="agency-container scroll-mt-28 py-16 lg:py-24" aria-label="Full service directory">
    <div className="mb-10"><p className="agency-eyebrow mb-3">OUR SOLUTIONS</p><h2 className="mb-4 max-w-2xl font-heading text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl">Practical AI for real-world business challenges.</h2><p className="max-w-2xl text-sm leading-relaxed">From the first opportunity assessment to a fully managed AI environment. Explore indicative starting prices; each engagement is scoped with you.</p></div>
    <nav aria-label="Service categories" className="mb-9 flex flex-wrap gap-2">{categories.map(group => <a key={group.id} href={`#${group.id}`} onClick={() => setActiveId(group.id)} className="rounded border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">{group.title}</a>)}</nav>
    <div className="grid items-start gap-5 lg:grid-cols-2">{categories.map((group, index) => <ServiceCard key={group.id} group={group} index={index} Icon={icons[group.id]} expanded={activeId === group.id} onToggle={() => setActiveId(activeId === group.id ? null : group.id)} />)}</div>
    <p className="mt-8 text-xs text-muted-foreground">Prices are recommended starting points in USD, not a fixed quote. Scope, integrations, usage and ongoing support are confirmed in a proposal. Enterprise engagements are custom quoted.</p>
  </section>;
}