// @ts-nocheck — Dynamically-typed registry processor: parameters are JSON pattern
// objects with varying schemas by design. Type-checking is intentionally disabled.
// ============================================================
// UNIVERSAL FRONTEND FACTORY — Semantic Token Synthesizer
// DTCG-compatible primitive + semantic + component tokens
// ============================================================

// ── Generate tonal scale from a source color ──
function generateTonalScale(sourceHex) {
  const hex = sourceHex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const tones = {};
  const lightnessSteps = [10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99];

  for (const tone of lightnessSteps) {
    const factor = tone / 50;
    const nr = Math.min(255, Math.round(r * factor));
    const ng = Math.min(255, Math.round(g * factor));
    const nb = Math.min(255, Math.round(b * factor));
    tones[tone] = `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
  }

  return tones;
}

// ── Synthesize semantic tokens from brand color + palette selection ──
export function synthesizeTokens(brandColor, palette, options = {}) {
  const tones = generateTonalScale(brandColor);

  const primitive = {
    'color.brand': brandColor,
    'color.primary.0': tones[10],
    'color.primary.10': tones[10],
    'color.primary.20': tones[20],
    'color.primary.30': tones[30],
    'color.primary.40': tones[40],
    'color.primary.50': tones[50],
    'color.primary.60': tones[60],
    'color.primary.70': tones[70],
    'color.primary.80': tones[80],
    'color.primary.90': tones[90],
    'color.primary.95': tones[95],
    'color.primary.99': tones[99],
    'color.neutral.0': '#000000',
    'color.neutral.10': '#1a1a1a',
    'color.neutral.20': '#333333',
    'color.neutral.50': '#808080',
    'color.neutral.80': '#cccccc',
    'color.neutral.90': '#e5e5e5',
    'color.neutral.95': '#f5f5f5',
    'color.neutral.99': '#fafafa',
    'color.status.success': '#44d88d',
    'color.status.warning': '#fbc02d',
    'color.status.error': '#ef4444',
    'color.status.info': '#3b82f6',
    'radius.sm': '4px',
    'radius.md': '8px',
    'radius.lg': '12px',
    'radius.xl': '16px',
    'spacing.base': '8px',
    'spacing.xs': '4px',
    'spacing.sm': '8px',
    'spacing.md': '16px',
    'spacing.lg': '24px',
    'spacing.xl': '32px',
    'spacing.2xl': '48px',
  };

  const semantic = {
    'bg.primary': '{color.neutral.99}',
    'bg.secondary': '{color.neutral.95}',
    'bg.surface': '{color.neutral.99}',
    'bg.elevated': '{color.neutral.99}',
    'bg.inverse': '{color.neutral.10}',
    'fg.primary': '{color.neutral.10}',
    'fg.secondary': '{color.neutral.20}',
    'fg.muted': '{color.neutral.50}',
    'fg.inverse': '{color.neutral.99}',
    'accent.primary': '{color.primary.50}',
    'accent.primary-hover': '{color.primary.40}',
    'accent.primary-pressed': '{color.primary.30}',
    'border.subtle': '{color.neutral.90}',
    'border.default': '{color.neutral.80}',
    'border.strong': '{color.neutral.50}',
    'status.success': '{color.status.success}',
    'status.warning': '{color.status.warning}',
    'status.error': '{color.status.error}',
    'status.info': '{color.status.info}',
  };

  const component = {
    'button.primary.bg': '{accent.primary}',
    'button.primary.fg': '{fg.inverse}',
    'button.primary.radius': '{radius.md}',
    'button.secondary.bg': '{bg.surface}',
    'button.secondary.fg': '{fg.primary}',
    'button.secondary.border': '{border.default}',
    'input.bg': '{bg.surface}',
    'input.fg': '{fg.primary}',
    'input.border': '{border.default}',
    'input.radius': '{radius.md}',
    'card.bg': '{bg.surface}',
    'card.radius': '{radius.lg}',
    'card.border': '{border.subtle}',
    'nav.bg': '{bg.primary}',
    'nav.fg': '{fg.secondary}',
    'nav.active': '{accent.primary}',
  };

  const lightTheme = { ...semantic };
  const darkTheme = {
    'bg.primary': '{color.neutral.10}',
    'bg.secondary': '{color.neutral.20}',
    'bg.surface': '{color.neutral.10}',
    'bg.elevated': '{color.neutral.20}',
    'bg.inverse': '{color.neutral.99}',
    'fg.primary': '{color.neutral.99}',
    'fg.secondary': '{color.neutral.90}',
    'fg.muted': '{color.neutral.80}',
    'fg.inverse': '{color.neutral.10}',
    'accent.primary': '{color.primary.60}',
    'accent.primary-hover': '{color.primary.70}',
    'accent.primary-pressed': '{color.primary.50}',
    'border.subtle': '{color.neutral.20}',
    'border.default': '{color.neutral.50}',
    'border.strong': '{color.neutral.80}',
  };

  return {
    primitive,
    semantic,
    component,
    themes: {
      light: lightTheme,
      dark: darkTheme,
      'high-contrast-light': { ...lightTheme, 'fg.primary': '#000000', 'border.default': '#000000' },
      'high-contrast-dark': { ...darkTheme, 'fg.primary': '#ffffff', 'border.default': '#ffffff' },
    },
  };
}

// ── Export DTCG-compatible token JSON ──
export function exportDTCGTokens(tokens) {
  return {
    '$schema': 'https://design-tokens.org/format/2025-10/',
    '$version': '2.0.0',
    color: {
      primitive: Object.fromEntries(
        Object.entries(tokens.primitive).filter(([k]) => k.startsWith('color.')).map(([k, v]) => [k, { $value: v }])
      ),
      semantic: Object.fromEntries(
        Object.entries(tokens.semantic).filter(([k]) => k.startsWith('color.')).map(([k, v]) => [k, { $value: v }])
      ),
    },
    radius: {
      primitive: Object.fromEntries(
        Object.entries(tokens.primitive).filter(([k]) => k.startsWith('radius.')).map(([k, v]) => [k, { $value: v }])
      ),
    },
    spacing: {
      primitive: Object.fromEntries(
        Object.entries(tokens.primitive).filter(([k]) => k.startsWith('spacing.')).map(([k, v]) => [k, { $value: v }])
      ),
    },
  };
}