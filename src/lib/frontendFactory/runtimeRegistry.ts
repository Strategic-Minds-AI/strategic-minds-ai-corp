// ============================================================
// RUNTIME REGISTRY — Merges base UFF patterns with ingested
// template patterns so the compiler and agents can use both.
//
// Template patterns are loaded from the TemplateAsset entity
// and merged into the base 740-pattern registry at runtime.
// ============================================================

import { registry as baseRegistry, REGISTRY_VERSION } from './registry';

export interface TemplatePatternBundle {
  colorSystems: any[];
  typographyPatterns: any[];
  componentPatterns: any[];
  navigationPatterns: any[];
  layoutPatterns: any[];
  templatePacks: any[];
}

let templateBundle: TemplatePatternBundle = {
  colorSystems: [],
  typographyPatterns: [],
  componentPatterns: [],
  navigationPatterns: [],
  layoutPatterns: [],
  templatePacks: [],
};

let mergedRegistry: Record<string, any[]> = { ...baseRegistry };

function rebuildMerged() {
  mergedRegistry = {
    ...baseRegistry,
    colorSystems: [...baseRegistry.colorSystems, ...templateBundle.colorSystems],
    typographyPatterns: [...baseRegistry.typographyPatterns, ...templateBundle.typographyPatterns],
    componentPatterns: [...baseRegistry.componentPatterns, ...templateBundle.componentPatterns],
    navigationPatterns: [...baseRegistry.navigationPatterns, ...templateBundle.navigationPatterns],
    compositionGrammar: [...baseRegistry.compositionGrammar, ...templateBundle.layoutPatterns],
    experienceRecipes: [...baseRegistry.experienceRecipes, ...templateBundle.templatePacks],
  };
}

// ── Load template patterns from backend ──
export async function loadTemplatePatterns(fetchFn: (action: string, payload?: any) => Promise<any>): Promise<number> {
  try {
    const res = await fetchFn('ingestTemplate', { action: 'list', status: 'active' });
    const templates = res.data?.templates || [];

    const colorSystems: any[] = [];
    const typographyPatterns: any[] = [];
    const componentPatterns: any[] = [];
    const navigationPatterns: any[] = [];
    const layoutPatterns: any[] = [];
    const templatePacks: any[] = [];

    for (const template of templates) {
      if (!template.extracted_patterns) continue;
      try {
        const patterns = JSON.parse(template.extracted_patterns);
        if (patterns.colorSystem) colorSystems.push(patterns.colorSystem);
        if (patterns.typographyPattern) typographyPatterns.push(patterns.typographyPattern);
        if (patterns.componentPatterns) componentPatterns.push(...patterns.componentPatterns);
        if (patterns.navigationPattern) navigationPatterns.push(patterns.navigationPattern);
        if (patterns.layoutPattern) layoutPatterns.push(patterns.layoutPattern);
        if (patterns.templatePack) templatePacks.push(patterns.templatePack);
      } catch { /* skip malformed */ }
    }

    templateBundle = { colorSystems, typographyPatterns, componentPatterns, navigationPatterns, layoutPatterns, templatePacks };
    rebuildMerged();
    return templates.length;
  } catch {
    return 0;
  }
}

// ── Add a single template's patterns at runtime (after ingestion) ──
export function addTemplatePatterns(patterns: any) {
  if (patterns.colorSystem) templateBundle.colorSystems.push(patterns.colorSystem);
  if (patterns.typographyPattern) templateBundle.typographyPatterns.push(patterns.typographyPattern);
  if (patterns.componentPatterns) templateBundle.componentPatterns.push(...patterns.componentPatterns);
  if (patterns.navigationPattern) templateBundle.navigationPatterns.push(patterns.navigationPattern);
  if (patterns.layoutPattern) templateBundle.layoutPatterns.push(patterns.layoutPattern);
  if (patterns.templatePack) templateBundle.templatePacks.push(patterns.templatePack);
  rebuildMerged();
}

// ── Remove a template's patterns by IDs ──
export function removeTemplatePatterns(patternIds: string[]) {
  const idSet = new Set(patternIds);
  templateBundle = {
    colorSystems: templateBundle.colorSystems.filter((p) => !idSet.has(p.id)),
    typographyPatterns: templateBundle.typographyPatterns.filter((p) => !idSet.has(p.id)),
    componentPatterns: templateBundle.componentPatterns.filter((p) => !idSet.has(p.id)),
    navigationPatterns: templateBundle.navigationPatterns.filter((p) => !idSet.has(p.id)),
    layoutPatterns: templateBundle.layoutPatterns.filter((p) => !idSet.has(p.id)),
    templatePacks: templateBundle.templatePacks.filter((p) => !idSet.has(p.id)),
  };
  rebuildMerged();
}

// ── Get the merged registry (base + templates) ──
export function getMergedRegistry() {
  return mergedRegistry;
}

// ── Count total patterns including templates ──
export function getMergedPatternCount() {
  return Object.values(mergedRegistry).reduce((sum, arr) => sum + arr.length, 0);
}

// ── Get template pattern count ──
export function getTemplatePatternCount() {
  return Object.values(templateBundle).reduce((sum, arr) => sum + arr.length, 0);
}

// ── Check if a pattern ID is from a template ──
export function isTemplatePattern(patternId: string): boolean {
  return patternId.startsWith('TP_');
}

// ── Collect all template pattern IDs for a given set ──
export function getTemplatePatternIds(): string[] {
  return [
    ...templateBundle.colorSystems.map((p) => p.id),
    ...templateBundle.typographyPatterns.map((p) => p.id),
    ...templateBundle.componentPatterns.map((p) => p.id),
    ...templateBundle.navigationPatterns.map((p) => p.id),
    ...templateBundle.layoutPatterns.map((p) => p.id),
    ...templateBundle.templatePacks.map((p) => p.id),
  ];
}

export { REGISTRY_VERSION };