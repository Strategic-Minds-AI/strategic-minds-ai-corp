// @ts-nocheck — Dynamically-typed registry processor: parameters are JSON pattern
// objects with varying schemas by design. Type-checking is intentionally disabled.
// ============================================================
// UNIVERSAL FRONTEND FACTORY — Pattern Registry (Frontend)
// Version 2.0.0 — 740 pattern entries across 33 pattern files
// Vite imports JSON natively — no backend bundling needed.
// ============================================================

import domainPacks from './patterns/domain_packs.json';
import experienceRecipes from './patterns/experience_recipes.json';
import platformAdapters from './patterns/platform_adapters.json';
import mobilePatterns from './patterns/mobile_patterns.json';
import desktopPatterns from './patterns/desktop_patterns.json';
import colorSystems from './patterns/color_systems.json';
import logoPatterns from './patterns/logo_patterns.json';
import componentPatterns from './patterns/component_patterns.json';
import navigationPatterns from './patterns/navigation_patterns.json';
import formPatterns from './patterns/form_patterns.json';
import gridPatterns from './patterns/grid_patterns.json';
import typographyPatterns from './patterns/typography_patterns.json';
import typographyStrategies from './patterns/typography_strategies.json';
import imagePatterns from './patterns/image_patterns.json';
import motionPatterns from './patterns/motion_patterns.json';
import statePatterns from './patterns/state_patterns.json';
import conversionPatterns from './patterns/conversion_patterns.json';
import dataVizPatterns from './patterns/data_visualization_patterns.json';
import aiInteractionPatterns from './patterns/ai_interaction_patterns.json';
import responsiveTransforms from './patterns/responsive_transformations.json';
import accessibilityRules from './patterns/accessibility_rules.json';
import semanticColorRoles from './patterns/semantic_color_roles.json';
import themeModes from './patterns/theme_modes.json';
import surfaceSystems from './patterns/surface_systems.json';
import elevationSystems from './patterns/elevation_systems.json';
import iconSystems from './patterns/icon_systems.json';
import densityModes from './patterns/density_modes.json';
import contentHierarchy from './patterns/content_hierarchy_patterns.json';
import compositionGrammar from './patterns/composition_grammar.json';
import flowPatterns from './patterns/flow_patterns.json';
import qualityProfiles from './patterns/quality_profiles.json';
import qualityRules from './patterns/quality_rules.json';
import deviceProfiles from './patterns/device_profiles.json';
import builderConfig from './builder_config.json';

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

export const PATTERN_COUNTS = Object.fromEntries(
  Object.entries(registry).map(([k, v]) => [k, v.length])
);

export function countPatterns() {
  return Object.values(registry).reduce((sum, arr) => sum + arr.length, 0);
}

export function getAllPatterns() {
  return registry;
}

export function getPatternById(category, id) {
  const list = registry[category];
  return list ? list.find((p) => p.id === id) : undefined;
}

export function getCategoryNames() {
  return Object.keys(registry);
}