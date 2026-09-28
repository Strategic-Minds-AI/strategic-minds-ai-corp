interface NavItem {
  title: string;
  href?: string;
  disabled?: boolean;
  external?: boolean;
  label?: string;
  description?: string;
}

interface NavItemWithChildren extends NavItem {
  items: NavItemWithChildren[];
}

interface NavItemWithOptionalChildren extends NavItem {
  items?: NavItemWithChildren[];
}

type MainNavItem = NavItemWithOptionalChildren;

interface FooterItem {
  title: string;
  items: {
    title: string;
    href: string;
    external?: boolean;
  }[];
}

type Testimonial = {
  id?: string;
  display_order?: number;
  image_url?: string;
  name?: string;
  company?: string;
  comment?: string;
  rating?: number | 0;
  variant?: "default" | "featured" | "layout_2";
};

type IconBox = {
  title?: string;
  description?: string;
  icon?: string | RemixiconReactIconComponentType;
  iconBase?: string;
  shadow?: string;
};

type Project = {
  id: string;
  display_order?: number;
  publish_date: string;
  slug: string;
  title: string;
  content_markdown: string;
  excerpt: string;
  categories?: string;
  image_url?: string;
  image_alt?: string;
  metric_1_value?: string;
  metric_1_label?: string;
  metric_2_value?: string;
  metric_2_label?: string;
  metric_3_value?: string;
  metric_3_label?: string;
};

type Post = Project & {
  author_name?: string;
  author_image_url?: string;
};
