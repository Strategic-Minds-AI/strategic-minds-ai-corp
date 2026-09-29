import PageHero from '@/components/agency/PageHero';

type SectionPageTitleProps = {
  children: React.ReactNode;
  subtitle?: string;
  titleClasses?: string;
  subtitleClasses?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

const SectionPageTitle = ({
  children,
  subtitle,
  titleClasses,
  subtitleClasses,
  ctaLabel,
  ctaHref,
}: SectionPageTitleProps) => <PageHero eyebrow="STRATEGIC MINDS AI / REAL BUSINESS IMPACT" title={children} description={subtitle} titleClasses={titleClasses} subtitleClasses={subtitleClasses} ctaLabel={ctaLabel} ctaHref={ctaHref} />;

export default SectionPageTitle;