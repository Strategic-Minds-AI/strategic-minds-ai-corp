// 20 Template Galleries — each represents a distinct design language
// that GPT can upload generated websites into. Galleries are organized
// by visual style, not industry, so any category can use any gallery.

export const TEMPLATE_GALLERIES = [
  {
    id: 'aurora',
    name: 'Aurora',
    style: 'Modern gradient mesh with glassmorphism',
    palette: ['#0066FF', '#004CE6', '#3B82F6', '#E6F0FF'],
    tone: 'premium',
    description: 'Glassmorphic cards over animated gradient mesh backgrounds. Ideal for tech, SaaS, and premium services.',
  },
  {
    id: 'fortress',
    name: 'Fortress',
    style: 'Bold industrial with sharp angles',
    palette: ['#1A1A1A', '#CC4444', '#FF6600', '#F5F5F5'],
    tone: 'authoritative',
    description: 'Heavy slab typography, angular blocks, high contrast. Built for construction, roofing, industrial.',
  },
  {
    id: 'serenity',
    name: 'Serenity',
    style: 'Calm minimalist with generous whitespace',
    palette: ['#FAFAFA', '#2D8659', '#0A2818', '#E8F5EE'],
    tone: 'peaceful',
    description: 'Soft shadows, rounded corners, breathing room. Perfect for wellness, spa, dental, medical.',
  },
  {
    id: 'momentum',
    name: 'Momentum',
    style: 'Dynamic diagonal layouts with motion',
    palette: ['#0A0A1A', '#0066FF', '#FFB800', '#FFFFFF'],
    tone: 'energetic',
    description: 'Diagonal sections, animated counters, kinetic typography. For fitness, sports, automotive.',
  },
  {
    id: 'heritage',
    name: 'Heritage',
    style: 'Classic serif elegance with gold accents',
    palette: ['#0A0A1A', '#B8901E', '#F5F0E0', '#1A1A2E'],
    tone: 'trustworthy',
    description: 'Serif headlines, gold rules, parchment textures. Law firms, accounting, estate planning.',
  },
  {
    id: 'pulse',
    name: 'Pulse',
    style: 'Vibrant neon on dark with glow effects',
    palette: ['#0D0D1A', '#FF00AA', '#00FFCC', '#FFB800'],
    tone: 'bold',
    description: 'Neon accents, glow shadows, dark mode native. Nightlife, entertainment, creative agencies.',
  },
  {
    id: 'summit',
    name: 'Summit',
    style: 'Clean corporate with data visualization',
    palette: ['#0A1A3F', '#0066FF', '#00AAFF', '#F8FAFC'],
    tone: 'professional',
    description: 'Chart-forward layouts, KPI cards, crisp data tables. Consulting, finance, B2B SaaS.',
  },
  {
    id: 'bloom',
    name: 'Bloom',
    style: 'Organic shapes with soft pastels',
    palette: ['#FFF5F7', '#CC6699', '#FFB6C1', '#E8E0F0'],
    tone: 'warm',
    description: 'Blob shapes, pastel gradients, rounded everything. Med spa, beauty, florist, boutique.',
  },
  {
    id: 'forge',
    name: 'Forge',
    style: 'Dark workshop with metal textures',
    palette: ['#1A1A0A', '#FF8800', '#8B6914', '#2A2A1A'],
    tone: 'rugged',
    description: 'Metallic gradients, riveted borders, industrial icons. Auto repair, welding, machining.',
  },
  {
    id: 'lumin',
    name: 'Lumin',
    style: 'Bright airy with light photography',
    palette: ['#FFFFFF', '#00AACC', '#F0F8FF', '#0066FF'],
    tone: 'clean',
    description: 'Full-bleed photography, overlay text, minimal UI. Real estate, architecture, interior design.',
  },
  {
    id: 'terra',
    name: 'Terra',
    style: 'Earth tones with natural textures',
    palette: ['#1A140A', '#8B6914', '#D4A92E', '#F5EEDC'],
    tone: 'natural',
    description: 'Wood textures, earthy palette, organic borders. Landscaping, farming, outdoor living.',
  },
  {
    id: 'velocity',
    name: 'Velocity',
    style: 'Racing stripes with speed lines',
    palette: ['#0A0A1A', '#FF0000', '#FF6600', '#FFFFFF'],
    tone: 'fast',
    description: 'Speed lines, italic slants, countdown timers. Moving, delivery, emergency services.',
  },
  {
    id: 'haven',
    name: 'Haven',
    style: 'Cozy warm with home imagery',
    palette: ['#1A0A0A', '#CC6633', '#F5E6D3', '#8B4513'],
    tone: 'comforting',
    description: 'Warm overlays, soft focus, home photography. Cleaning, home repair, senior care.',
  },
  {
    id: 'crystal',
    name: 'Crystal',
    style: 'Frosted glass with ice-blue tones',
    palette: ['#0A1A2E', '#00AAFF', '#E0F4FF', '#FFFFFF'],
    tone: 'cool',
    description: 'Frosted panels, ice gradients, crystalline borders. Pool service, water damage, HVAC.',
  },
  {
    id: 'sage',
    name: 'Sage',
    style: 'Natural wellness with botanical accents',
    palette: ['#0A1A1A', '#00AA88', '#E0F5EE', '#2D8659'],
    tone: 'healing',
    description: 'Botanical illustrations, sage greens, soft serif. Chiropractor, physical therapy, veterinary.',
  },
  {
    id: 'apex',
    name: 'Apex',
    style: 'Peak performance with mountain motifs',
    palette: ['#0A1A2E', '#FFB800', '#0066FF', '#F8FAFC'],
    tone: 'ambitious',
    description: 'Mountain imagery, summit charts, growth arrows. Solar, energy, financial planning.',
  },
  {
    id: 'beacon',
    name: 'Beacon',
    style: 'Lighthouse trust with navigation cues',
    palette: ['#0A0A1A', '#0066CC', '#FFCC00', '#F0F4FA'],
    tone: 'guiding',
    description: 'Lighthouse motifs, beacon animations, trust badges. Insurance, real estate, legal.',
  },
  {
    id: 'prism',
    name: 'Prism',
    style: 'Refracted light with spectrum accents',
    palette: ['#1A0A1A', '#9333EA', '#0066FF', '#F0E0FF'],
    tone: 'creative',
    description: 'Prism light effects, spectrum gradients, creative layouts. Marketing, design, media.',
  },
  {
    id: 'grid',
    name: 'Grid',
    style: 'Architectural blueprint with technical lines',
    palette: ['#0A0A1A', '#0066FF', '#F8FAFC', '#E2E8F0'],
    tone: 'precise',
    description: 'Blueprint grids, technical drawings, precise measurements. Engineering, architecture, fencing.',
  },
  {
    id: 'wave',
    name: 'Wave',
    style: 'Fluid motion with ocean curves',
    palette: ['#0A1A2E', '#00AAFF', '#0066CC', '#E0F4FF'],
    tone: 'flowing',
    description: 'Wave SVG dividers, fluid animations, ocean imagery. Plumbing, water damage, cleaning.',
  },
];

export function getGalleryById(id) {
  return TEMPLATE_GALLERIES.find(g => g.id === id);
}

export function getGalleriesByTone(tone) {
  return TEMPLATE_GALLERIES.filter(g => g.tone === tone);
}