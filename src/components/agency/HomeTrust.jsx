import { ShieldCheck, LockKeyhole, FileCheck2, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
const practices = [
  { icon: LockKeyhole, title: 'Security-first design', text: 'Access, data and architecture considered from the start.' },
  { icon: ShieldCheck, title: 'Responsible AI', text: 'Human oversight and sensible safeguards for real use.' },
  { icon: FileCheck2, title: 'Privacy-minded delivery', text: 'Practical data handling tailored to your requirements.' },
  { icon: RefreshCw, title: 'Ongoing optimization', text: 'Monitor and refine the systems that run your business.' },
];
export default function HomeTrust() {
  return <section className="agency-container py-16 lg:py-24"><div className="overflow-hidden rounded-md border border-border bg-muted lg:grid lg:grid-cols-[0.9fr_1.1fr]"><div className="bg-quaternary p-8 text-primary-foreground md:p-12"><p className="mb-5 text-[10px] font-bold uppercase tracking-[0.2em] text-primary-foreground">TRUSTED. RESPONSIBLE. BUILT TO LAST.</p><h2 className="mb-5 text-3xl font-bold leading-tight text-primary-foreground md:text-4xl">Enterprise AI built for what matters.</h2><p className="mb-8 max-w-md text-sm leading-relaxed text-primary-foreground">We embed security, governance and ethical AI practices into every solution, so you can innovate with confidence.</p><Link to="/services#governance" className="inline-flex rounded bg-primary px-5 py-3 text-xs font-semibold text-primary-foreground">Explore our approach →</Link></div><div className="grid gap-6 p-8 sm:grid-cols-2 md:p-12">{practices.map(({ icon: Icon, title, text }) => <div key={title}><Icon className="mb-4 text-primary" size={25} /><h3 className="mb-2 text-base">{title}</h3><p className="text-sm leading-relaxed">{text}</p></div>)}</div></div></section>;
}