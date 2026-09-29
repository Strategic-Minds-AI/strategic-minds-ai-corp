// Central site configuration — update these values to customise the template.

export const SITE_NAME = "Strategic Minds AI";

export const siteConfig = {
  name: SITE_NAME,
  description: "AI strategy, intelligent automation, and thoughtful digital experiences for a stronger business.",
  url: "",
};

export type NavItem = {
  title: string;
  href?: string;
  disabled?: boolean;
  external?: boolean;
  items?: NavItem[];
};

export const mainNav: NavItem[] = [
  { title: "Home", href: "/" },
  { title: "Services", href: "/services" },
  { title: "Projects", href: "/projects" },
  { title: "About", href: "/about" },
  { title: "Blog", href: "/blog" },
  { title: "Pricing", href: "/pricing" },
  { title: "Portal", href: "/portal" },
  { title: "Contact", href: "/contact" },
];

export const footerNav: NavItem[] = [
  {
    title: "Company",
    items: [
      { title: "About", href: "/about" },
      { title: "Projects", href: "/projects" },
      { title: "Blog", href: "/blog" },
      { title: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Services",
    items: [
      { title: "AI Strategy & Consulting", href: "/services#strategy" },
      { title: "AI Automation & Agents", href: "/services#automation" },
      { title: "Data Intelligence", href: "/services#data" },
      { title: "AI Marketing & Search", href: "/services#marketing" },
      { title: "Custom AI Solutions", href: "/services#software" },
    ],
  },
  {
    title: "Explore",
    items: [
      { title: "Services", href: "/services" },
      { title: "Pricing", href: "/pricing" },
      { title: "Contact", href: "/contact" },
      { title: "Client Portal", href: "/portal" },
    ],
  },
];

export const footerNav2: NavItem[] = [
  {
    title: "Company",
    items: [
      { title: "About", href: "/about" },
      { title: "Projects", href: "/projects" },
      { title: "Blog", href: "/blog" },
      { title: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Services",
    items: [
      { title: "AI Strategy & Consulting", href: "/services#strategy" },
      { title: "AI Automation & Agents", href: "/services#automation" },
      { title: "Data Intelligence", href: "/services#data" },
      { title: "AI Marketing & Search", href: "/services#marketing" },
      { title: "Custom AI Solutions", href: "/services#software" },
    ],
  },
  {
    title: "Resources",
    items: [
      { title: "Contact", href: "/contact" },
      { title: "Privacy Policy", href: "/", external: true },
      { title: "Terms of Service", href: "/", external: true },
    ],
  },
];

export const DOWNLOAD_FILE_URL =
  "https://media.base44.com/files/public/6a5a38c973cbadd255396d0f/8360f2ad8_Vibe_Coding_Platform_for_Building_Apps_and_Websites___Base44.pdf";