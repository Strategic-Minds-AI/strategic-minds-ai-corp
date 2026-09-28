import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import BrandMark from '@/components/agency/BrandMark';

export default function AgencyFooter() {
  return <footer className="border-t border-border"><div className="agency-container">
    <div className="flex flex-col justify-between gap-8 py-14 md:flex-row md:items-center"><div><p className="agency-eyebrow mb-4">YOUR NEXT CHAPTER</p><h2 className="mb-0 font-display text-3xl font-normal tracking-tight">Let's think bigger. <em>And build better.</em></h2></div><Link to="/contact" className="agency-button self-start md:self-auto">Start a conversation <ArrowUpRight size={18} /></Link></div>
    <div className="flex flex-col justify-between gap-6 border-t border-border py-8 md:flex-row md:items-center"><Link to="/" aria-label="Strategic Minds AI home"><BrandMark /></Link><p className="text-[10px] tracking-wide text-muted-foreground">© {new Date().getFullYear()} Strategic Minds AI. All rights reserved.</p><a href="/#resources" className="text-xs text-muted-foreground">Get the business checklist</a></div>
  </div></footer>;
}