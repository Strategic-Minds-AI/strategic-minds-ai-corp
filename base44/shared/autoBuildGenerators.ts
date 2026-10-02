// ============================================================
// autoBuildGenerators.ts — Marketing build generators
// Uses the same generation logic as the client portal.
// ============================================================

import { compileBrief, briefText, photoStyleSuffix } from "./generatorBrief.ts";

// ── Names ───────────────────────────────────────────────────────────────

export async function generateNames(base44: any, params: Record<string, any>) {
  const brief = compileBrief(params);
  const prompt = `You are an expert brand strategist. Generate 10 business name suggestions for a ${brief.industry} business${brief.location ? ` in ${brief.location}` : ""}.

BUSINESS CONTEXT:
${briefText(brief)}

For each name, provide:
- name: the business name (1-3 words, memorable, easy to spell)
- domain: the .com domain (no hyphens)
- tagline: short catchy tagline
- viral_score: 0-100 (memorability, brandability, uniqueness)
- local_seo_score: 0-100 (how well it supports local SEO)
- searchability_score: 0-100 (how easily customers find it)
- rationale: why this name could be viral and successful
- target_audience: who this name appeals to

Return JSON: { suggestions: [{ name, domain, tagline, viral_score, local_seo_score, searchability_score, rationale, target_audience }] }`;

  const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        suggestions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              domain: { type: "string" },
              tagline: { type: "string" },
              viral_score: { type: "number" },
              local_seo_score: { type: "number" },
              searchability_score: { type: "number" },
              rationale: { type: "string" },
              target_audience: { type: "string" },
            },
          },
        },
      },
    },
  });
  return res?.suggestions || [];
}

// ── Content ─────────────────────────────────────────────────────────────

const cleanText = (v: any): any => {
  if (typeof v === "string") return v.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/https?:\/\/[^\s)]+/g, "").replace(/\s{2,}/g, " ").trim();
  if (Array.isArray(v)) return v.map(cleanText);
  if (v && typeof v === "object") { const o: any = {}; for (const k of Object.keys(v)) o[k] = cleanText(v[k]); return o; }
  return v;
};

export async function generateContent(base44: any, params: Record<string, any>) {
  const brief = compileBrief(params);
  const prompt = `You are a senior brand strategist and viral-marketing copywriter. Generate website messaging for a ${brief.industry} business.

CLIENT BRIEF:
${briefText(brief)}

Generate a JSON object with:
- hero_headline: powerful main headline (max 8 words)
- hero_subheadline: supporting subheadline (1-2 sentences)
- value_propositions: array of { title, description } (3-5 items)
- about_text: 2-3 paragraph company story
- services: array of { name, description, benefits[] } (3-6 items)
- testimonials_template: array of { quote, author, role } (2-3 template testimonials)
- cta_primary: primary call-to-action text
- cta_secondary: secondary call-to-action text
- faq: array of { question, answer } (5-8 items)
- meta_description: SEO meta description (max 160 chars)

Return ONLY a JSON object.`;

  const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        hero_headline: { type: "string" },
        hero_subheadline: { type: "string" },
        value_propositions: { type: "array", items: { type: "object" } },
        about_text: { type: "string" },
        services: { type: "array", items: { type: "object" } },
        testimonials_template: { type: "array", items: { type: "object" } },
        cta_primary: { type: "string" },
        cta_secondary: { type: "string" },
        faq: { type: "array", items: { type: "object" } },
        meta_description: { type: "string" },
      },
    },
  });
  return cleanText(res);
}

// ── Logos ───────────────────────────────────────────────────────────────

export async function generateLogos(base44: any, params: Record<string, any>) {
  const brief = compileBrief(params);
  const styleSuffix = photoStyleSuffix(brief);
  const ind = brief.industry || "local service business";
  const name = brief.businessName || brief.chosenName || "your business";

  const prompts = [
    `Modern minimalist logo for "${name}", ${ind}. Clean geometric mark, professional, on white background. ${styleSuffix}`,
    `Bold emblem logo for "${name}", ${ind}. Strong typography, shield or badge style, on white background. ${styleSuffix}`,
    `Abstract tech logo for "${name}", ${ind}. Gradient, modern, scalable, on white background. ${styleSuffix}`,
  ];

  const results = await Promise.allSettled(
    prompts.map((p) => base44.asServiceRole.integrations.Core.GenerateImage({ prompt: p }))
  );

  return results.map((r: any, i: number) => ({
    id: `logo-${i}`,
    style: ["Modern Minimalist", "Bold Emblem", "Abstract Tech"][i],
    url: r.value?.url,
  })).filter((logo: any) => logo.url);
}

// ── Brand Packs ─────────────────────────────────────────────────────────

export async function generateBrandPacks(base44: any, params: Record<string, any>) {
  const brief = compileBrief(params);
  const prompt = `You are a senior brand designer. Generate 3 brand pack options for a ${brief.industry} business.

BUSINESS: ${brief.businessName}
INDUSTRY: ${brief.industry}

For each brand pack, provide:
- name: the pack name (e.g. "Bold & Modern", "Clean & Professional", "Warm & Trustworthy")
- colors: { primary (hex), secondary (hex), accent (hex), background (hex), text (hex) }
- typography: { heading_font, body_font, heading_weight, body_weight }
- personality: 3-4 adjective description
- rationale: why this pack fits the business

Return JSON: { packs: [{ name, colors, typography, personality, rationale }] }`;

  const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        packs: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              colors: { type: "object" },
              typography: { type: "object" },
              personality: { type: "string" },
              rationale: { type: "string" },
            },
          },
        },
      },
    },
  });
  return res?.packs || [];
}

// ── Website ─────────────────────────────────────────────────────────────

export async function generateWebsite(base44: any, params: Record<string, any>) {
  const brief = compileBrief(params);
  const prompt = `You are a senior web designer. Generate a complete website content structure for a ${brief.industry} business.

CLIENT BRIEF:
${briefText(brief)}

Generate a JSON object with:
- pages: array of { name, slug, sections: [{ type, heading, content }] }
  (types: hero, services, about, testimonials, cta, contact, faq, gallery)
- navigation: array of { label, slug }
- footer: { company_name, tagline, links[], contact }
- seo: { title, description, keywords[], og_image_description }

Return ONLY a JSON object.`;

  const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        pages: { type: "array", items: { type: "object" } },
        navigation: { type: "array", items: { type: "object" } },
        footer: { type: "object" },
        seo: { type: "object" },
      },
    },
  });
  return cleanText(res);
}

// ── Social Media ────────────────────────────────────────────────────────

export async function generateSocial(base44: any, params: Record<string, any>) {
  const brief = compileBrief(params);
  const prompt = `You are a social media strategist. Generate a social media content pack for a ${brief.industry} business.

BUSINESS: ${brief.businessName}
INDUSTRY: ${brief.industry}

Generate a JSON object with:
- posts: array of { platform: "instagram"|"facebook"|"linkedin"|"twitter", caption, hashtags[], image_prompt, post_type: "educational"|"promotional"|"engagement"|"behind_scenes" }
- stories: array of { concept, text_overlay, image_prompt }
- reels: array of { concept, script, duration_sec, music_suggestion }

Return ONLY a JSON object.`;

  const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        posts: { type: "array", items: { type: "object" } },
        stories: { type: "array", items: { type: "object" } },
        reels: { type: "array", items: { type: "object" } },
      },
    },
  });
  return cleanText(res);
}

// ── Video ───────────────────────────────────────────────────────────────

export async function generateVideo(base44: any, params: Record<string, any>) {
  const brief = compileBrief(params);
  const prompt = `You are a video producer. Generate video concepts for a ${brief.industry} business.

BUSINESS: ${brief.businessName}
INDUSTRY: ${brief.industry}

Generate a JSON object with:
- concepts: array of {
    title, type: "explainer"|"testimonial"|"demo"|"brand_story",
    duration_sec, script, visual_direction, music_mood, thumbnail_description
  }

Return ONLY a JSON object.`;

  const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        concepts: { type: "array", items: { type: "object" } },
      },
    },
  });
  return cleanText(res);
}