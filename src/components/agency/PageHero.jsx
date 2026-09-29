import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import BuildingHeroBackdrop from '@/components/agency/BuildingHeroBackdrop';
import ChecklistBridge from '@/components/agency/ChecklistBridge';
import { cn } from '@/lib/utils';

export default function PageHero({ eyebrow, title, description, ctaLabel = 'Discuss your goals', ctaHref = '/contact', secondaryLabel, secondaryHref, note, details, titleClasses, subtitleClasses }) {
  return <>
    <section className="site-hero relative isolate flex min-h-[620px] items-center overflow-hidden border-b border-border bg-muted pb-36 pt-28 md:pt-28">
      <BuildingHeroBackdrop />
      <div className="agency-container"><div className="max-w-3xl py-10">
        <p className="agency-eyebrow mb-5 agency-hero-eyebrow">{eyebrow}</p>
        <h1 className={cn('agency-hero-title mb-6 max-w-3xl font-heading text-[2.9rem] font-black leading-[1.06] tracking-tight text-foreground sm:text-[3.25rem] md:text-[3.7rem] lg:text-[4.5rem] xl:text-[5rem]', titleClasses)}>{title}</h1>
        {description && <p className={cn('agency-hero-description mb-7 max-w-xl text-base font-semibold leading-relaxed text-foreground', subtitleClasses)}>{description}</p>}
        {note && <p className="mb-6 text-sm font-semibold text-foreground">{note}</p>}
        <div className="flex flex-wrap gap-3">
          <Link to={ctaHref} className="agency-button gap-3">{ctaLabel} <ArrowRight size={16} /></Link>
          {secondaryHref && <Link to={secondaryHref} className="inline-flex min-h-12 items-center rounded border border-primary bg-background/80 px-5 py-3 text-sm font-semibold text-primary hover:bg-background">{secondaryLabel}</Link>}
        </div>
        {details && <div className="mt-10 border-t border-border pt-5 text-sm font-semibold text-foreground">{details}</div>}
      </div></div>
    </section>
    <ChecklistBridge />
  </>;
}