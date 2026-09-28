import { siteConfig } from "@/config/site";
import logo from "/logo.svg"
import logoDark from "/logo_dark.svg"

type SiteLogoProps = {
  width: number;
  height: number;
  lightClasses?: string;
  darkClasses?: string;
};

export default function SiteLogo({
  width,
  height,
  lightClasses,
  darkClasses,
}: SiteLogoProps) {
  return (
    <>
      <img
        src={logo}
        className={lightClasses}
        width={width}
        height={height}
        alt={siteConfig.name}
      />
      <img
        src={logoDark}
        className={darkClasses}
        width={width}
        height={height}
        alt={siteConfig.name}
      />
    </>
  );
}
