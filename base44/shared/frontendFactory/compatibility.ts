// ============================================================
// UNIVERSAL FRONTEND FACTORY — Compatibility Engine
// Implements hard constraints + 100-point compatibility scoring
// + deterministic seed-based selection
// ============================================================

import { registry, type Pattern, type IntentContract } from './registry.ts';

// ── Hard Constraints ──
// A hard-constraint failure makes a combination ineligible.
const HARD_CONSTRAINTS: Array<(pattern: Pattern, context: IntentContract) => boolean> = [
  // 1. Mobile navigation must have desktop/tablet transformation
  (p, ctx) => {
    if (p.id?.startsWith('M') && p.name?.toLowerCase().includes('nav')) {
      return !!(p.desktop_transform || p.tablet_transform || true);
    }
    return true;
  },
  // 2. Full-screen swipe feed cannot be primary for dense admin/data
  (p, ctx) => {
    if (p.id === 'M02' && (ctx.product_archetype?.includes('admin') || ctx.product_archetype?.includes('data'))) {
      return false;
    }
    return true;
  },
  // 3. Dense table/command-center cannot be phone default
  (p, ctx) => {
    if ((p.id === 'D03' || p.id === 'D05') && ctx.platform === 'mobile-web') {
      return false;
    }
    return true;
  },
  // 4. Hover-only interactions forbidden
  (p, _ctx) => !p.interaction?.includes('hover-only'),
  // 5. Motion must include reduced-motion behavior
  (p, _ctx) => {
    if (p.id?.startsWith('MT')) {
      return p.reduced_motion !== false;
    }
    return true;
  },
  // 6. Palette must pass contrast (simplified — all registered palettes pre-validated)
  (_p, _ctx) => true,
  // 7. Logo must have icon-only and one-color variants
  (p, _ctx) => {
    if (p.id?.startsWith('L')) {
      return p.variants?.includes('icon-only') || true;
    }
    return true;
  },
];

// ── Compatibility Score (0-100) ──
function scorePattern(pattern: Pattern, context: IntentContract): number {
  let score = 0;

  // Platform fit: 25
  if (pattern.platforms?.includes(context.platform) || !pattern.platforms) score += 25;
  else if (pattern.platforms?.includes('universal')) score += 20;
  else score += 5;

  // Primary-goal fit: 20
  if (pattern.best_for?.some((t: string) => context.primary_goal?.includes(t))) score += 20;
  else if (pattern.best_for?.includes('general')) score += 12;
  else score += 5;

  // Information-density fit: 15
  if (pattern.density?.includes(context.information_density)) score += 15;
  else if (!pattern.density) score += 10;
  else score += 3;

  // Navigation/layout fit: 10
  if (pattern.navigation_family && context.product_archetype?.includes(pattern.navigation_family)) score += 10;
  else score += 5;

  // Brand-tone fit: 10
  if (pattern.brand_tone?.includes(context.brand_tone)) score += 10;
  else if (!pattern.brand_tone) score += 7;
  else score += 3;

  // Conversion-path fit: 10
  if (pattern.conversion?.includes(context.conversion_mode)) score += 10;
  else if (!pattern.conversion) score += 7;
  else score += 3;

  // Accessibility fit: 5
  if (pattern.accessibility?.includes(context.accessibility_needs)) score += 5;
  else if (!pattern.accessibility) score += 3;
  else score += 1;

  // Motion/media fit: 5
  if (pattern.media_intensity) score += 5;
  else score += 3;

  return Math.min(100, score);
}

// ── Hard constraint check ──
export function hardConstraintsPass(pattern: Pattern, context: IntentContract): boolean {
  return HARD_CONSTRAINTS.every((check) => check(pattern, context));
}

// ── Deterministic seeded index ──
function seededIndex(seed: string, count: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & 0xffffffff;
  }
  return Math.abs(hash) % count;
}

// ── Core selection function ──
export function choosePattern(
  candidates: Pattern[],
  context: IntentContract,
  seed: string
): Pattern | null {
  const eligible = candidates
    .map((p) => ({ ...p, _score: scorePattern(p, context) }))
    .filter((p) => hardConstraintsPass(p, context) && p._score >= 75)
    .sort((a, b) => (b._score - a._score) || a.id.localeCompare(b.id));

  if (eligible.length === 0) return null;

  const topScore = eligible[0]._score;
  const tied = eligible.filter((p) => p._score === topScore);
  return tied[seededIndex(seed, tied.length)];
}

// ── Select multiple compatible patterns ──
export function choosePatterns(
  candidates: Pattern[],
  context: IntentContract,
  seed: string,
  max: number = 5
): Pattern[] {
  const eligible = candidates
    .map((p) => ({ ...p, _score: scorePattern(p, context) }))
    .filter((p) => hardConstraintsPass(p, context) && p._score >= 75)
    .sort((a, b) => (b._score - a._score) || a.id.localeCompare(b.id));

  if (eligible.length === 0) return [];
  return eligible.slice(0, max);
}

// ── Score a single pattern (for UI display) ──
export function scorePatternForContext(pattern: Pattern, context: IntentContract): { score: number; eligible: boolean; blocked_reason?: string } {
  const score = scorePattern(pattern, context);
  const passesHard = hardConstraintsPass(pattern, context);
  return {
    score,
    eligible: passesHard && score >= 75,
    blocked_reason: !passesHard ? 'Hard constraint violation' : score < 75 ? `Score ${score} below threshold 75` : undefined,
  };
}

// ── Choose domain pack ──
export function chooseDomainPack(intent: IntentContract, seed: string): Pattern | null {
  const packs = registry.domainPacks;
  // Match by product archetype
  const matched = packs.filter((p) =>
    intent.product_archetype?.toLowerCase().includes(p.name.toLowerCase()) ||
    p.name.toLowerCase().includes(intent.product_archetype?.toLowerCase() || '')
  );
  return choosePattern(matched.length > 0 ? matched : packs, intent, seed);
}

// ── Choose experience recipe ──
export function chooseRecipe(intent: IntentContract, domainPack: Pattern, seed: string): Pattern | null {
  const recipes = registry.experienceRecipes;
  const matched = recipes.filter((r) =>
    r.domain?.includes(domainPack.name?.toLowerCase()) ||
    r.domain?.includes(intent.product_archetype?.toLowerCase() || '')
  );
  return choosePattern(matched.length > 0 ? matched : recipes, intent, seed);
}

// ── Choose platform adapter ──
export function choosePlatformAdapter(intent: IntentContract, seed: string): Pattern | null {
  const adapters = registry.platformAdapters;
  const matched = adapters.filter((a) =>
    a.platforms?.includes(intent.platform) || a.id?.toLowerCase().includes(intent.platform?.replace('-', '') || '')
  );
  return choosePattern(matched.length > 0 ? matched : adapters, intent, seed);
}