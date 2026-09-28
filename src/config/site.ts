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
  {
    title: "Home",
    items: [
      { title: "Marketing", href: "/" },
      { title: "SEO Agency", href: "/seo-agency" },
      { title: "Consulting", href: "/consulting" },
    ],
  },
  { title: "Services", href: "/services" },
  { title: "Projects", href: "/projects" },
  { title: "Blog", href: "/blog" },
  { title: "Pricing", href: "/pricing" },
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
      { title: "Digital Marketing", href: "/services" },
      { title: "SEO and PPC", href: "/services" },
      { title: "Marketing Analytics", href: "/services" },
      { title: "Content Marketing", href: "/services" },
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
      { title: "Digital Marketing", href: "/services" },
      { title: "SEO and PPC", href: "/services" },
      { title: "Marketing Analytics", href: "/services" },
      { title: "Content Marketing", href: "/services" },
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