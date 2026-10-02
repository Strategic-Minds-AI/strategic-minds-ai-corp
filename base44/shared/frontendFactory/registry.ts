// ============================================================
// UNIVERSAL FRONTEND FACTORY — Pattern Registry
// Version 2.0.0 — 740 pattern entries across 33 pattern files
// ============================================================

import domainPacks from './patterns/domain_packs.json' with { type: 'json' };
import experienceRecipes from './patterns/experience_recipes.json' with { type: 'json' };
import platformAdapters from './patterns/platform_adapters.json' with { type: 'json' };
import mobilePatterns from './patterns/mobile_patterns.json' with { type: 'json' };
import desktopPatterns from './patterns/desktop_patterns.json' with { type: 'json' };
import colorSystems from './patterns/color_systems.json' with { type: 'json' };
import logoPatterns from './patterns/logo_patterns.json' with { type: 'json' };
import componentPatterns from './patterns/component_patterns.json' with { type: 'json' };
import navigationPatterns from './patterns/navigation_patterns.json' with { type: 'json' };
import formPatterns from './patterns/form_patterns.json' with { type: 'json' };
import gridPatterns from './patterns/grid_patterns.json' with { type: 'json' };
import typographyPatterns from './patterns/typography_patterns.json' with { type: 'json' };
import typographyStrategies from './patterns/typography_strategies.json' with { type: 'json' };
import imagePatterns from './patterns/image_patterns.json' with { type: 'json' };
import motionPatterns from './patterns/motion_patterns.json' with { type: 'json' };
import statePatterns from './patterns/state_patterns.json' with { type: 'json' };
import conversionPatterns from './patterns/conversion_patterns.json' with { type: 'json' };
import dataVizPatterns from './patterns/data_visualization_patterns.json' with { type: 'json' };
import aiInteractionPatterns from './patterns/ai_interaction_patterns.json' with { type: 'json' };
import responsiveTransforms from './patterns/responsive_transformations.json' with { type: 'json' };
import accessibilityRules from './patterns/accessibility_rules.json' with { type: 'json' };
import semanticColorRoles from './patterns/semantic_color_roles.json' with { type: 'json' };
import themeModes from './patterns/theme_modes.json' with { type: 'json' };
import surfaceSystems from './patterns/surface_systems.json' with { type: 'json' };
import elevationSystems from './patterns/elevation_systems.json' with { type: 'json' };
import iconSystems from './patterns/icon_systems.json' with { type: 'json' };
import densityModes from './patterns/density_modes.json' with { type: 'json' };
import contentHierarchy from './patterns/content_hierarchy_patterns.json' with { type: 'json' };
import compositionGrammar from './patterns/composition_grammar.json' with { type: 'json' };
import flowPatterns from './patterns/flow_patterns.json' with { type: 'json' };
import qualityProfiles from './patterns/quality_profiles.json' with { type: 'json' };
import qualityRules from './patterns/quality_rules.json' with { type: 'json' };
import deviceProfiles from './patterns/device_profiles.json' with { type: 'json' };
import builderConfig from './builder_config.json' with { type: 'json' };

export const REGISTRY_VERSION = '2.0.0';

export const config = builderConfig;

export const registry = {
  domainPacks,
  experienceRecipes,
  platformAdapters,
  mobilePatterns,
  desktopPatterns,
  colorSystems,
  logoPatterns,
  componentPatterns,
  navigationPatterns,
  formPatterns,
  gridPatterns,
  typographyPatterns,
  typographyStrategies,
  imagePatterns,
  motionPatterns,
  statePatterns,
  conversionPatterns,
  dataVizPatterns,
  aiInteractionPatterns,
  responsiveTransforms,
  accessibilityRules,
  semanticColorRoles,
  themeModes,
  surfaceSystems,
  elevationSystems,
  iconSystems,
  densityModes,
  contentHierarchy,
  compositionGrammar,
  flowPatterns,
  qualityProfiles,
  qualityRules,
  deviceProfiles,
};

export type Pattern = {
  id: string;
  name: string;
  [key: string]: any;
};

export type IntentContract = {
  platform?: string;
  product_archetype?: string;
  primary_goal?: string;
  information_density?: 'low' | 'medium' | 'high';
  interaction_mode?: string;
  conversion_mode?: string;
  brand_tone?: string;
  accessibility_needs?: string;
  reference_lock?: boolean;
  seed: string;
};

export function getAllPatterns(): Record<string, Pattern[]> {
  return registry;
}

export function getPatternById(category: string, id: string): Pattern | undefined {
  const list = (registry as any)[category] as Pattern[] | undefined;
  if (!list) return undefined;
  return list.find((p) => p.id === id);
}

export function countPatterns(): number {
  return Object.values(registry).reduce((sum, arr) => sum + (arr as any[]).length, 0);
}