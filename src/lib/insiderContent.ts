import { base44 } from '@/api/base44Client';

export type InsiderCategory = 'tip' | 'trick' | 'wealth' | 'secret';

export interface InsiderContent {
  id: string;
  title: string;
  slug: string;
  category: InsiderCategory;
  excerpt: string;
  content_markdown: string;
  image_url?: string;
  display_order: number;
  publish_date: string;
  featured: boolean;
  read_time_minutes: number;
}

export async function fetchInsiderContent(opts?: { category?: InsiderCategory; featured?: boolean; limit?: number }): Promise<InsiderContent[]> {
  const query: Record<string, unknown> = {};
  if (opts?.category) query.category = opts.category;
  if (opts?.featured) query.featured = true;
  const { items } = await base44.entities.InsiderContent.filter(query, {
    sort: '-publish_date',
    limit: opts?.limit || 50,
  });
  return items as InsiderContent[];
}

export async function fetchInsiderBySlug(slug: string): Promise<InsiderContent | null> {
  const { items } = await base44.entities.InsiderContent.filter({ slug }, { limit: 1 });
  return (items[0] as InsiderContent) || null;
}

export const CATEGORY_META: Record<InsiderCategory, { label: string; color: string; bg: string; text: string; icon: string }> = {
  tip: { label: 'Quick Tip', color: 'blue', bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300', icon: 'Lightbulb' },
  trick: { label: 'Insider Trick', color: 'violet', bg: 'bg-violet-50 dark:bg-violet-950/40', text: 'text-violet-700 dark:text-violet-300', icon: 'Wand2' },
  wealth: { label: 'Wealth Builder', color: 'emerald', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', icon: 'TrendingUp' },
  secret: { label: 'Insider Secret', color: 'amber', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', icon: 'Key' },
};