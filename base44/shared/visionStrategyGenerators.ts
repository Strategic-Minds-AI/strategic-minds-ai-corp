// ============================================================
// visionStrategyGenerators.ts — Vision & Strategy generation
// The foundation of the entire build pipeline. Vision defines
// WHAT we're building and WHY. Strategy defines HOW we get there.
// ============================================================

export async function generateVisionDoc(base44: any, params: Record<string, any>): Promise<Record<string, any>> {
  const { businessName, industry, subIndustry, primaryLocation, services, productDescription, targetAudience, businessType } = params;

  const prompt = `You are a world-class vision strategist — think Simon Sinek meets YC partner. Create a comprehensive VISION document for this business/product.

BUSINESS/PRODUCT CONTEXT:
- Name: ${businessName || "(to be determined)"}
- Industry: ${industry || "general"}${subIndustry ? ` / ${subIndustry}` : ""}
- Location: ${primaryLocation || "N/A"}
- Services/Offerings: ${(services || []).join(", ") || "N/A"}
- Product Description: ${productDescription || "N/A"}
- Target Audience: ${targetAudience || "N/A"}
- Business Type: ${businessType || "local service business"}

Generate a VISION document with these exact fields. Be specific, inspiring, and actionable — not generic. This vision will guide every downstream decision (name, brand, website, content, SEO, deployment).

1. MISSION: One powerful sentence — what this business exists to do. Start with "To..."
2. PROBLEM: The specific, painful problem this solves. Be concrete.
3. TARGET_AUDIENCE: Who exactly is this for? Be specific — not "everyone" but a clear persona.
4. LONG_TERM_VISION: A vivid 3-5 year picture. What does this become?
5. SUCCESS_METRICS: 5-8 measurable indicators of success.
6. CORE_VALUES: 4-6 guiding principles. Short phrases.
7. VALUE_PROPOSITION: The single most compelling reason someone chooses this.
8. MARKET_OPPORTUNITY: The market reality — size, growth, trends, gaps. Why now?
9. MONETIZATION_POTENTIAL: How the WEBSITE ITSELF generates recurring revenue.
10. LEAD_GENERATION_APPROACH: How the site captures, qualifies, and manages leads.
11. SEO_AEO_OPPORTUNITY: The search and AI-visibility opportunity for this niche.
12. AUTONOMOUS_VALUE_PLAN: What a dedicated AI team should continuously enhance.

Return ONLY a JSON object with these exact keys: mission, problem, target_audience, long_term_vision, success_metrics (array of strings), core_values (array of strings), value_proposition, market_opportunity, monetization_potential, lead_generation_approach, seo_aeo_opportunity, autonomous_value_plan.`;

  const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        mission: { type: "string" },
        problem: { type: "string" },
        target_audience: { type: "string" },
        long_term_vision: { type: "string" },
        success_metrics: { type: "array", items: { type: "string" } },
        core_values: { type: "array", items: { type: "string" } },
        value_proposition: { type: "string" },
        market_opportunity: { type: "string" },
        monetization_potential: { type: "string" },
        lead_generation_approach: { type: "string" },
        seo_aeo_opportunity: { type: "string" },
        autonomous_value_plan: { type: "string" },
      },
      required: ["mission", "problem", "target_audience", "long_term_vision", "success_metrics", "core_values", "value_proposition", "market_opportunity"],
    },
  });

  return {
    ...res,
    approved: false,
    generated_at: new Date().toISOString(),
  };
}

export async function generateStrategyDoc(base44: any, params: Record<string, any>): Promise<Record<string, any>> {
  const { businessName, industry, subIndustry, primaryLocation, services, vision, productDescription, targetAudience, businessType } = params;

  if (!vision) throw new Error("Vision document is required before generating strategy. Generate and approve the vision first.");

  const prompt = `You are a world-class strategy consultant — think McKinsey meets YC startup school. Create a comprehensive STRATEGY document for this business/product, building directly on the approved vision.

BUSINESS/PRODUCT CONTEXT:
- Name: ${businessName || "(to be determined)"}
- Industry: ${industry || "general"}${subIndustry ? ` / ${subIndustry}` : ""}
- Location: ${primaryLocation || "N/A"}
- Services/Offerings: ${(services || []).join(", ") || "N/A"}
- Product Description: ${productDescription || "N/A"}
- Target Audience: ${targetAudience || "N/A"}
- Business Type: ${businessType || "local service business"}

APPROVED VISION:
- Mission: ${vision.mission || "N/A"}
- Problem: ${vision.problem || "N/A"}
- Target Audience: ${vision.target_audience || "N/A"}
- Value Proposition: ${vision.value_proposition || "N/A"}
- Success Metrics: ${(vision.success_metrics || []).join("; ") || "N/A"}
- Market Opportunity: ${vision.market_opportunity || "N/A"}

Generate a STRATEGY document with these exact fields. Be specific, practical, and actionable.

1. COMPETITIVE_POSITIONING: How this positions against existing alternatives.
2. GO_TO_MARKET: The concrete GTM plan — how to get the first 100 customers/users.
3. REVENUE_MODEL: How money is made. Be specific.
4. PRICING_STRATEGY: Specific pricing approach — tiers, anchor pricing, value-based.
5. ACQUISITION_CHANNELS: 5-8 specific channels for reaching the target audience.
6. ROADMAP: 3 phases (Phase 1: Foundation 0-3 months, Phase 2: Growth 3-9 months, Phase 3: Scale 9-18 months).
7. RISKS: 4-6 key risks with severity and mitigation.
8. RESOURCES: What's needed to execute — team, tools, budget, technology.
9. DIFFERENTIATION: The durable competitive moat.
10. PARTNERSHIPS: Key partnerships or integrations.
11. MONETIZATION_MODEL: Detailed monthly recurring revenue model with 3 pricing tiers.
12. LEAD_GENERATION_ARCHITECTURE: The full lead system — funnel stages, capture mechanisms, qualification criteria.

Return ONLY a JSON object with these exact keys: competitive_positioning, go_to_market, revenue_model, pricing_strategy, acquisition_channels (array of strings), roadmap (array of objects with phase, timeline, goals, initiatives), risks (array of objects with risk, severity, mitigation), resources, differentiation, partnerships, monetization_model, lead_generation_architecture.`;

  const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        competitive_positioning: { type: "string" },
        go_to_market: { type: "string" },
        revenue_model: { type: "string" },
        pricing_strategy: { type: "string" },
        acquisition_channels: { type: "array", items: { type: "string" } },
        roadmap: { type: "array", items: { type: "object" } },
        risks: { type: "array", items: { type: "object" } },
        resources: { type: "string" },
        differentiation: { type: "string" },
        partnerships: { type: "string" },
        monetization_model: { type: "string" },
        lead_generation_architecture: { type: "string" },
      },
      required: ["competitive_positioning", "go_to_market", "revenue_model", "pricing_strategy", "acquisition_channels"],
    },
  });

  return {
    ...res,
    approved: false,
    generated_at: new Date().toISOString(),
  };
}