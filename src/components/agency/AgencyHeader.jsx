import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import BrandMark from '@/components/agency/BrandMark';

export default function AgencyHeader() {
  const [open, setOpen] = useState(false);
  const links = [['Expertise', '/#expertise'], ['Approach', '/#approach'], ['Resources', '/#resources']];
  return <header className="sticky top-0 z-30 border-b border-border bg-background">
    <div className="agency-container flex h-24 items-center justify-between gap-6">
      <Link to="/" aria-label="Strategic Minds AI home" onClick={() => setOpen(false)}><BrandMark /></Link>
      <nav aria-label="Main navigation" className="hidden items-center gap-9 lg:flex">{links.map(([label, href]) => <a key={label} href={href} className="text-xs text-muted-foreground hover:text-primary">{label}</a>)}</nav>
      <Link to="/contact" className="hidden items-center gap-4 border-b border-foreground pb-2 text-xs font-medium text-foreground lg:inline-flex">Start a conversation <ArrowUpRight size={16} /></Link>
      <button onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="agency-mobile-nav" aria-label={open ? 'Close navigation' : 'Open navigation'} className="flex h-11 w-11 items-center justify-center text-foreground lg:hidden">{open ? <X size={23} /> : <Menu size={23} />}</button>
    </div>
    {open && <nav id="agency-mobile-nav" aria-label="Mobile navigation" className="agency-container flex flex-col gap-1 border-t border-border py-4 lg:hidden">{links.map(([label, href]) => <a key={label} href={href} onClick={() => setOpen(false)} className="py-3 text-sm text-foreground">{label}</a>)}<Link to="/contact" onClick={() => setOpen(false)} className="py-3 text-sm text-primary">Start a conversation</Link></nav>}
  </header>;
}