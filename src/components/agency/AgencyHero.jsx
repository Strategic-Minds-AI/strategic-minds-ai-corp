import { ArrowUpRight, ArrowDown } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AgencyHero() {
  return <section className="agency-container grid items-center gap-14 pb-16 pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:pb-24 lg:pt-24">
    <div>
      <p className="agency-eyebrow mb-7 flex items-center gap-3"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> STRATEGY FIRST. INTELLIGENCE APPLIED.</p>
      <h1 className="mb-7 font-display text-[clamp(3.4rem,6.5vw,6.5rem)] font-normal leading-[1.02] tracking-[-0.05em]">A sharper mind.<br />A stronger<br /><em className="font-normal text-primary">business.</em></h1>
      <p className="max-w-md text-base leading-relaxed text-muted-foreground">Turn the promise of AI into practical progress. We bring strategy, intelligent automation, and thoughtful digital experiences together to move your business forward.</p>
      <div className="mt-9 flex flex-wrap items-center gap-6"><Link to="/contact" className="agency-button">Start a conversation <ArrowUpRight size={18} /></Link><a href="#expertise" className="inline-flex items-center gap-2 text-xs font-medium text-foreground">Explore our expertise <ArrowDown size={15} /></a></div>
      <div className="mt-14 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-5 text-[10px] uppercase tracking-[0.15em] text-muted-foreground"><span>Human-led strategy</span><span>Purpose-built systems</span><span>Lasting capability</span></div>
    </div>
    <div className="relative min-w-0">
      <div className="relative aspect-[4/5] overflow-hidden rounded-t-full bg-muted">
        <img src="https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1200&q=85" alt="Sculptural modern architecture with precise geometric lines" className="h-full w-full object-cover grayscale" fetchPriority="high" />
        <div className="absolute bottom-0 inset-x-0 bg-foreground/90 p-7 text-background"><span className="mb-3 block text-[9px] uppercase tracking-[0.25em]">THE STRATEGIC MINDS APPROACH</span><p className="font-display text-2xl leading-tight">Clarity before complexity.<br /><em>Impact before everything.</em></p></div>
      </div>
      <div className="absolute right-4 top-8 flex h-20 w-20 items-center justify-center rounded-full border border-background/70 bg-background/90 font-display text-3xl text-foreground">S<span className="text-primary">/</span>M</div>
      <p className="mt-4 text-right text-[9px] uppercase tracking-[0.22em] text-muted-foreground">Built with intention. Designed to endure.</p>
    </div>
  </section>;
}