import { cn } from "@/lib/utils";
import BuildingHeroBackdrop from '@/components/agency/BuildingHeroBackdrop';

type SectionPageTitleProps = {
  children: React.ReactNode;
  subtitle?: string;
  titleClasses?: string;
  subtitleClasses?: string;
};

const SectionPageTitle = ({
  children,
  subtitle,
  titleClasses,
  subtitleClasses,
}: SectionPageTitleProps) => {
  return (
    <section className="site-hero relative isolate flex min-h-[620px] items-center overflow-hidden border-b border-border bg-muted pb-16 pt-28 md:pt-24">
      <BuildingHeroBackdrop />
      <div className="agency-container">
        <div className="max-w-3xl">
          <p className="agency-eyebrow mb-5">STRATEGIC MINDS AI / REAL BUSINESS IMPACT</p>
          <h1 className={cn("mb-5 font-heading text-4xl font-bold leading-tight tracking-tight md:text-5xl", titleClasses)}>{children}</h1>
          {subtitle && <p className={cn("max-w-2xl text-base leading-relaxed", subtitleClasses)}>{subtitle}</p>}
        </div>
      </div>
    </section>
  );
};

export default SectionPageTitle;