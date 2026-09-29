import { Link } from 'react-router-dom';
import { categories } from './serviceCatalog';

export default function ServiceDirectory() {
  return <section className="agency-container py-16 lg:py-24" aria-label="Full service directory">
    <div className="mb-10"><p className="agency-eyebrow mb-3">OUR SERVICES</p><h2 className="agency-heading mb-3">Designed for the whole business.</h2><p className="max-w-2xl text-sm leading-relaxed">From the first opportunity assessment to a fully managed AI environment. Explore indicative starting prices; each engagement is scoped with you.</p></div>
    <nav aria-label="Service categories" className="mb-12 flex flex-wrap gap-2">{categories.map(group => <a key={group.id} href={`#${group.id}`} className="rounded border border-border bg-card px-3 py-2 text-xs text-foreground hover:border-primary">{group.title}</a>)}</nav>
    <div className="grid gap-5 lg:grid-cols-2">{categories.map(group => <article id={group.id} key={group.id} className="scroll-mt-28 rounded border border-border bg-card p-6 md:p-8"><h3 className="mb-2 text-xl">{group.title}</h3><p className="mb-5 text-sm leading-relaxed">{group.description}</p><ul className="divide-y divide-border">{group.offers.map(([name, price]) => <li key={name} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3 text-sm"><span className="text-foreground">{name}</span><span className="font-medium text-primary">{price}</span></li>)}</ul><Link to="/contact" className="mt-6 inline-block text-sm font-medium text-primary underline">Discuss this service →</Link></article>)}</div>
    <p className="mt-8 text-xs text-muted-foreground">Prices are recommended starting points in USD, not a fixed quote. Scope, integrations, usage and ongoing support are confirmed in a proposal. Enterprise engagements are custom quoted.</p>
  </section>;
}