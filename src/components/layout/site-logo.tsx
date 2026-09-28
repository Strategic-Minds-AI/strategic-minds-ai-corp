import BrandMark from '@/components/agency/BrandMark';

type SiteLogoProps = { width: number; height: number; lightClasses?: string; darkClasses?: string; };

export default function SiteLogo(_props: SiteLogoProps) {
  return <BrandMark />;
}