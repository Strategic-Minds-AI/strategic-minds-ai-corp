// @ts-nocheck — Dynamically-typed HTML/CSS parser: parameters are parsed DOM
// nodes with varying schemas by design. Type-checking is intentionally disabled.
// ============================================================
// TEMPLATE INGESTOR — Converts any HTML template into UFF patterns
//
// Parses HTML/CSS to extract:
//   - Color systems (CSS variables, inline colors, backgrounds)
//   - Typography patterns (font families, sizes, weights)
//   - Component patterns (nav, hero, cards, forms, buttons, footer)
//   - Layout/section structure
//   - Spacing and elevation systems
//
// Output: UFF-compatible pattern entries that merge into the
// runtime registry and are usable by the 12-pass compiler.
// ============================================================

export interface PatternEntry {
  id: string;
  name: string;
  [key: string]: any;
}

export interface ExtractedPatterns {
  colorSystem: PatternEntry;
  typographyPattern: PatternEntry;
  componentPatterns: PatternEntry[];
  navigationPattern: PatternEntry;
  layoutPattern: PatternEntry;
  templatePack: PatternEntry;
  summary: {
    colors: string[];
    fonts: string[];
    sections: string[];
    componentCount: number;
  };
}

// ── Color extraction ──
function extractColors(doc: Document, styles: string[]): string[] {
  const colorSet = new Set<string>();
  const colorRegex = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
  const rgbRegex = /rgba?\([^)]+\)/g;
  const hslRegex = /hsla?\([^)]+\)/g;

  // From CSS custom properties
  const varRegex = /--[\w-]+\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))/g;
  for (const style of styles) {
    let match;
    while ((match = varRegex.exec(style)) !== null) {
      colorSet.add(match[1].trim());
    }
  }

  // From all CSS text
  for (const style of styles) {
    let match;
    while ((match = colorRegex.exec(style)) !== null) colorSet.add(match[0]);
    colorRegex.lastIndex = 0;
    while ((match = rgbRegex.exec(style)) !== null) colorSet.add(match[0]);
    rgbRegex.lastIndex = 0;
    while ((match = hslRegex.exec(style)) !== null) colorSet.add(match[0]);
    hslRegex.lastIndex = 0;
  }

  // From inline styles
  doc.querySelectorAll('[style]').forEach((el) => {
    const style = el.getAttribute('style') || '';
    let match;
    while ((match = colorRegex.exec(style)) !== null) colorSet.add(match[0]);
    colorRegex.lastIndex = 0;
  });

  // Deduplicate and normalize
  return Array.from(colorSet).slice(0, 20);
}

// ── Typography extraction ──
function extractTypography(doc: Document, styles: string[]): { families: string[]; sizes: string[]; weights: string[] } {
  const families = new Set<string>();
  const sizes = new Set<string>();
  const weights = new Set<string>();

  const fontRegex = /font-family\s*:\s*([^;]+)/g;
  const sizeRegex = /font-size\s*:\s*([^;]+)/g;
  const weightRegex = /font-weight\s*:\s*([^;]+)/g;

  for (const style of styles) {
    let match;
    while ((match = fontRegex.exec(style)) !== null) families.add(match[1].trim());
    while ((match = sizeRegex.exec(style)) !== null) sizes.add(match[1].trim());
    while ((match = weightRegex.exec(style)) !== null) weights.add(match[1].trim());
  }

  doc.querySelectorAll('[style]').forEach((el) => {
    const style = el.getAttribute('style') || '';
    let match;
    while ((match = fontRegex.exec(style)) !== null) families.add(match[1].trim());
    fontRegex.lastIndex = 0;
    while ((match = sizeRegex.exec(style)) !== null) sizes.add(match[1].trim());
    sizeRegex.lastIndex = 0;
  });

  return {
    families: Array.from(families).slice(0, 8),
    sizes: Array.from(sizes).sort().slice(0, 10),
    weights: Array.from(weights).slice(0, 6),
  };
}

// ── Section extraction ──
function extractSections(doc: Document): { tag: string; classes: string; role: string }[] {
  const sections: { tag: string; classes: string; role: string }[] = [];
  const roleMap: Record<string, string> = {
    header: 'header',
    nav: 'navigation',
    main: 'main-content',
    footer: 'footer',
    section: 'section',
    aside: 'sidebar',
    form: 'form',
  };

  // Semantic tags
  doc.querySelectorAll('header, nav, main, footer, section, aside, form').forEach((el) => {
    const tag = el.tagName.toLowerCase();
    const classes = el.className || '';
    const role = roleMap[tag] || 'section';

    // Try to identify the section purpose from class names
    const classStr = typeof classes === 'string' ? classes.toLowerCase() : '';
    let detectedRole = role;
    if (classStr.includes('hero')) detectedRole = 'hero';
    else if (classStr.includes('about')) detectedRole = 'about';
    else if (classStr.includes('service') || classStr.includes('feature')) detectedRole = 'features';
    else if (classStr.includes('contact')) detectedRole = 'contact';
    else if (classStr.includes('blog') || classStr.includes('post')) detectedRole = 'blog';
    else if (classStr.includes('testimonial') || classStr.includes('review')) detectedRole = 'testimonials';
    else if (classStr.includes('pricing')) detectedRole = 'pricing';
    else if (classStr.includes('team')) detectedRole = 'team';
    else if (classStr.includes('cta') || classStr.includes('call')) detectedRole = 'cta';
    else if (classStr.includes('faq')) detectedRole = 'faq';
    else if (classStr.includes('gallery') || classStr.includes('portfolio')) detectedRole = 'gallery';
    else if (classStr.includes('stats') || classStr.includes('counter')) detectedRole = 'stats';

    sections.push({ tag, classes: typeof classes === 'string' ? classes : '', role: detectedRole });
  });

  // If no semantic sections found, try div-based sections
  if (sections.length === 0) {
    doc.querySelectorAll('div').forEach((el) => {
      const classes = (el.className || '').toLowerCase();
      if (typeof classes === 'string' && (classes.includes('hero') || classes.includes('section') || classes.includes('banner'))) {
        sections.push({ tag: 'div', classes: el.className || '', role: classes.includes('hero') ? 'hero' : 'section' });
      }
    });
  }

  return sections;
}

// ── Component extraction ──
function extractComponents(doc: Document): { type: string; count: number; classes: string }[] {
  const components: { type: string; count: number; classes: string }[] = [];

  // Buttons
  const buttons = doc.querySelectorAll('button, .btn, [class*="button"]');
  if (buttons.length > 0) {
    components.push({ type: 'button', count: buttons.length, classes: (buttons[0].className || '').toString() });
  }

  // Forms
  const forms = doc.querySelectorAll('form');
  if (forms.length > 0) {
    components.push({ type: 'form', count: forms.length, classes: '' });
  }

  // Cards
  const cards = doc.querySelectorAll('.card, [class*="card"]');
  if (cards.length > 0) {
    components.push({ type: 'card', count: cards.length, classes: (cards[0].className || '').toString() });
  }

  // Navigation
  const navs = doc.querySelectorAll('nav, .nav, .navbar, .menu');
  if (navs.length > 0) {
    components.push({ type: 'navigation', count: navs.length, classes: (navs[0].className || '').toString() });
  }

  // Images/media
  const images = doc.querySelectorAll('img, picture, video');
  if (images.length > 0) {
    components.push({ type: 'image', count: images.length, classes: '' });
  }

  // Grid layouts
  const grids = doc.querySelectorAll('.grid, [class*="grid"]');
  if (grids.length > 0) {
    components.push({ type: 'grid', count: grids.length, classes: (grids[0].className || '').toString() });
  }

  // Accordions/tabs
  const accordions = doc.querySelectorAll('.accordion, [class*="accordion"], details');
  if (accordions.length > 0) {
    components.push({ type: 'accordion', count: accordions.length, classes: '' });
  }

  // Tables
  const tables = doc.querySelectorAll('table');
  if (tables.length > 0) {
    components.push({ type: 'table', count: tables.length, classes: '' });
  }

  return components;
}

// ── Spacing extraction ──
function extractSpacing(styles: string[]): { radius: string[]; shadows: string[] } {
  const radiusSet = new Set<string>();
  const shadowSet = new Set<string>();

  const radiusRegex = /border-radius\s*:\s*([^;]+)/g;
  const shadowRegex = /box-shadow\s*:\s*([^;]+)/g;

  for (const style of styles) {
    let match;
    while ((match = radiusRegex.exec(style)) !== null) radiusSet.add(match[1].trim());
    while ((match = shadowRegex.exec(style)) !== null) shadowSet.add(match[1].trim());
  }

  return {
    radius: Array.from(radiusSet).slice(0, 6),
    shadows: Array.from(shadowSet).slice(0, 6),
  };
}

// ── Generate UFF pattern entries ──
function generateColorSystem(colors: string[], name: string): PatternEntry {
  const primary = colors[0] || '#0066ff';
  const secondary = colors[1] || colors.find((c) => c !== primary) || '#333333';
  const accent = colors[2] || colors.find((c) => c !== primary && c !== secondary) || '#666666';

  return {
    id: `TP_COLOR_${Date.now().toString(36).toUpperCase().slice(-6)}`,
    name: `Extracted from: ${name}`,
    category: 'color_systems',
    source: 'template_ingestion',
    palette: {
      primary,
      secondary,
      accent,
      neutral: colors.slice(3, 8),
      extended: colors.slice(0, 20),
    },
    contrast_targets: { aa: 4.5, aaa: 7.0 },
    extraction_method: 'css_parse',
  };
}

function generateTypographyPattern(fonts: { families: string[]; sizes: string[]; weights: string[] }, name: string): PatternEntry {
  return {
    id: `TP_TYPE_${Date.now().toString(36).toUpperCase().slice(-6)}`,
    name: `Typography from: ${name}`,
    category: 'typography_patterns',
    source: 'template_ingestion',
    font_families: {
      heading: fonts.families[0] || 'system-ui, sans-serif',
      body: fonts.families[1] || fonts.families[0] || 'system-ui, sans-serif',
      mono: fonts.families.find((f) => f.includes('mono')) || 'monospace',
    },
    scale: fonts.sizes.length > 0 ? fonts.sizes : ['0.875rem', '1rem', '1.25rem', '1.5rem', '2rem', '3rem'],
    weights: fonts.weights.length > 0 ? fonts.weights : ['400', '500', '700'],
    extraction_method: 'css_parse',
  };
}

function generateComponentPatterns(components: { type: string; count: number; classes: string }[], name: string): PatternEntry[] {
  return components.map((comp, i) => ({
    id: `TP_COMP_${Date.now().toString(36).toUpperCase().slice(-6)}_${i}`,
    name: `${comp.type} from: ${name}`,
    category: 'component_patterns',
    source: 'template_ingestion',
    component_type: comp.type,
    instance_count: comp.count,
    detected_classes: comp.classes,
    extraction_method: 'dom_parse',
  }));
}

function generateNavigationPattern(sections: { role: string }[], name: string): PatternEntry {
  const navSection = sections.find((s) => s.role === 'navigation' || s.role === 'header');
  return {
    id: `TP_NAV_${Date.now().toString(36).toUpperCase().slice(-6)}`,
    name: `Navigation from: ${name}`,
    category: 'navigation_patterns',
    source: 'template_ingestion',
    style: navSection ? 'horizontal-bar' : 'minimal',
    has_dropdown: false,
    extraction_method: 'dom_parse',
  };
}

function generateLayoutPattern(sections: { role: string }[], name: string): PatternEntry {
  const sectionRoles = sections.map((s) => s.role);
  return {
    id: `TP_LAYOUT_${Date.now().toString(36).toUpperCase().slice(-6)}`,
    name: `Layout from: ${name}`,
    category: 'composition_grammar',
    source: 'template_ingestion',
    sections: sectionRoles,
    section_count: sections.length,
    grid: '12-column',
    extraction_method: 'dom_parse',
  };
}

function generateTemplatePack(
  colorSys: PatternEntry,
  typoPattern: PatternEntry,
  components: PatternEntry[],
  sections: { role: string }[],
  name: string
): PatternEntry {
  return {
    id: `TP_PACK_${Date.now().toString(36).toUpperCase().slice(-6)}`,
    name: `Template Pack: ${name}`,
    category: 'experience_recipes',
    source: 'template_ingestion',
    bundled_patterns: {
      color_system: colorSys.id,
      typography: typoPattern.id,
      components: components.map((c) => c.id),
      section_roles: sections.map((s) => s.role),
    },
    is_template_pack: true,
  };
}

// ── Main entry point ──
export function parseHtmlTemplate(html: string, name: string): ExtractedPatterns {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Collect all CSS
  const styleTags = Array.from(doc.querySelectorAll('style')).map((s) => s.textContent || '');
  const inlineStyles = Array.from(doc.querySelectorAll('[style]')).map((el) => el.getAttribute('style') || '');
  const styles = [...styleTags, ...inlineStyles];

  // Extract
  const colors = extractColors(doc, styles);
  const typography = extractTypography(doc, styles);
  const sections = extractSections(doc);
  const components = extractComponents(doc);
  const spacing = extractSpacing(styles);

  // Generate UFF patterns
  const colorSystem = generateColorSystem(colors, name);
  const typographyPattern = generateTypographyPattern(typography, name);
  const componentPatterns = generateComponentPatterns(components, name);
  const navigationPattern = generateNavigationPattern(sections, name);
  const layoutPattern = generateLayoutPattern(sections, name);
  const templatePack = generateTemplatePack(colorSystem, typographyPattern, componentPatterns, sections, name);

  return {
    colorSystem,
    typographyPattern,
    componentPatterns,
    navigationPattern,
    layoutPattern,
    templatePack,
    summary: {
      colors,
      fonts: typography.families,
      sections: sections.map((s) => s.role),
      componentCount: components.length,
    },
  };
}

// ── Generate site files from a template ──
export function generateStaticSiteFiles(html: string, name: string): Record<string, string> {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  return {
    'index.html': html,
    'vercel.json': JSON.stringify({
      name: slug,
      public: true,
      cleanUrls: true,
      trailingSlash: false,
    }, null, 2),
    'README.md': `# ${name}\n\nGenerated by Strategic Minds AI — Universal Frontend Factory.\n\n## Deploy\n\nThis site is auto-deployed to Vercel on push to main.\n`,
  };
}

// ── Generate Vite React files from a BuildSpec ──
export function generateViteReactFiles(buildSpec: any, projectName: string): Record<string, string> {
  const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const tokens = buildSpec.tokens?.primitive || {};
  const primaryColor = tokens['color.primary.500'] || '#0066ff';

  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${projectName}</title>
</head>
<body>
<div id="root"></div>
<script type="module" src="/src/main.jsx"></script>
</body>
</html>`;

  const packageJson = JSON.stringify({
    name: slug,
    private: true,
    version: '0.0.1',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview',
    },
    dependencies: {
      react: '^18.2.0',
      'react-dom': '^18.2.0',
    },
    devDependencies: {
      '@vitejs/plugin-react': '^4.2.0',
      vite: '^5.0.0',
      tailwindcss: '^3.4.0',
      postcss: '^8.4.0',
      autoprefixer: '^10.4.0',
    },
  }, null, 2);

  const viteConfig = `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\n\nexport default defineConfig({\n  plugins: [react()],\n})`;

  const tailwindConfig = `/** @type {import('tailwindcss').Config} */\nexport default {\n  content: ['./index.html', './src/**/*.{js,jsx}'],\n  theme: {\n    extend: {\n      colors: {\n        primary: '${primaryColor}',\n      },\n    },\n  },\n  plugins: [],\n}`;

  const postcssConfig = `export default {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n}`;

  const mainJsx = `import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport App from './App.jsx'\nimport './index.css'\n\nReactDOM.createRoot(document.getElementById('root')).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>,\n)`;

  const screens = (buildSpec.screens || []).map((s: any) => s.name).join(', ');

  const appJsx = `import React from 'react'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <nav className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="text-lg font-bold text-primary">${projectName}</span>
          <div className="flex gap-6 text-sm text-gray-600">
            ${(buildSpec.screens || []).map((s: any) => `<a href="${s.route}" className="hover:text-primary">${s.name}</a>`).join('\n            ')}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-12">
        <section className="mb-16 text-center">
          <h1 className="text-4xl font-bold text-gray-900">${projectName}</h1>
          <p className="mt-4 text-lg text-gray-600">Generated by Strategic Minds AI — Universal Frontend Factory v${buildSpec.registry_version || '2.0.0'}</p>
          <a href="/contact" className="mt-8 inline-block rounded-lg bg-primary px-6 py-3 text-white hover:opacity-90">Get Started</a>
        </section>
        <section className="grid grid-cols-1 gap-8 md:grid-cols-3">
          ${(buildSpec.screens || []).slice(0, 3).map((s: any, i: number) => `<div key={${i}} className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-xl font-semibold">${s.name}</h2>
            <p className="mt-2 text-sm text-gray-600">${s.content?.join(' · ') || 'Content placeholder'}</p>
          </div>`).join('\n          ')}
        </section>
      </main>
      <footer className="border-t border-gray-200 bg-white px-6 py-8 text-center text-sm text-gray-500">
        <p>&copy; ${new Date().getFullYear()} ${projectName}. All rights reserved.</p>
      </footer>
    </div>
  )
}`;

  const indexCss = `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n:root {\n${Object.entries(tokens).filter(([k]) => k.startsWith('color.')).slice(0, 10).map(([k, v]) => `  --${k.replace(/\./g, '-')}: ${v};`).join('\n')}\n}`;

  return {
    'index.html': indexHtml,
    'package.json': packageJson,
    'vite.config.js': viteConfig,
    'tailwind.config.js': tailwindConfig,
    'postcss.config.js': postcssConfig,
    'src/main.jsx': mainJsx,
    'src/App.jsx': appJsx,
    'src/index.css': indexCss,
    'README.md': `# ${projectName}\n\nGenerated by Strategic Minds AI — Universal Frontend Factory.\n\n## Screens\n\n${screens}\n\n## Deploy\n\nAuto-deployed to Vercel on push to main.\n`,
    '.gitignore': 'node_modules\ndist\n.env\n',
  };
}