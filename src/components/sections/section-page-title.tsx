import { cn } from "@/lib/utils";

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
    <section className="border-b border-border bg-gradient-to-br from-background via-muted to-background pb-16 pt-36 lg:pb-20 lg:pt-44">
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