// ============================================================
// systemBuildGenerators.ts — System-build spec generators
// Generates architecture, data model, UI system, code manifest,
// and deployment specs with validation + retry.
// ============================================================

import {
  strictValidateArchitecture, strictValidateDataModel,
  strictValidateUiSystem, strictValidateCodeManifest, strictValidateDeployment,
} from "./systemBuildSchemas.ts";
import {
  validateDataModelConsistency, validateUiSystemConsistency,
  validateCodeManifestConsistency, validateDeploymentConsistency,
} from "./systemBuildValidation.ts";

// ── Architecture Spec ───────────────────────────────────────────────────

export async function generateArchitectureSpec(base44: any, params: Record<string, any>): Promise<Record<string, any>> {
  const { productType, businessName, industry, profile } = params;
  const prompt = `You are a senior software architect. Generate a comprehensive system architecture spec for a ${productType} product.

BUSINESS: ${businessName || "N/A"}
INDUSTRY: ${industry || "N/A"}
PRODUCT TYPE: ${productType}

Generate a JSON object with:
- concept: one-sentence product concept (min 10 chars)
- summary: executive summary (min 20 chars)
- tech_stack: { frontend: string, backend: string, database: string, hosting: string }
- pages: array of { name, route (starts with /), purpose, components[] }
- data_models: array of { name, description, fields: [{ name, type }] }
- features: array of { name, description, priority: "must"|"should"|"could" }
- integrations: array of { name, type, purpose }
- user_flows: array of strings describing key user journeys
- tech_decisions: array of strings explaining key technology choices
- estimated_effort: string (e.g. "4-6 weeks")

Return ONLY a JSON object.`;

  const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        concept: { type: "string" },
        summary: { type: "string" },
        tech_stack: { type: "object", properties: { frontend: { type: "string" }, backend: { type: "string" }, database: { type: "string" }, hosting: { type: "string" } } },
        pages: { type: "array", items: { type: "object" } },
        data_models: { type: "array", items: { type: "object" } },
        features: { type: "array", items: { type: "object" } },
        integrations: { type: "array", items: { type: "object" } },
        user_flows: { type: "array", items: { type: "string" } },
        tech_decisions: { type: "array", items: { type: "string" } },
        estimated_effort: { type: "string" },
      },
      required: ["concept", "summary", "tech_stack", "pages"],
    },
  });
  return res;
}

// ── Data Model Spec ─────────────────────────────────────────────────────

export async function generateDataModelSpec(base44: any, params: Record<string, any>): Promise<Record<string, any>> {
  const { architecture, productType, businessName } = params;
  const prompt = `You are a senior data architect. Generate a detailed data model spec based on this architecture.

BUSINESS: ${businessName || "N/A"}
PRODUCT TYPE: ${productType}
ARCHITECTURE PAGES: ${JSON.stringify(architecture?.pages || [])}
ARCHITECTURE DATA MODELS: ${JSON.stringify(architecture?.data_models || [])}

Generate a JSON object with:
- entities: array of { name, description, fields: [{ name, type, required, unique, default, description }] }
  (valid types: string, number, boolean, date, date-time, text, integer, float, uuid, email, url, enum, reference, array, object)
- relationships: array of { from, to, type: "one-to-one"|"one-to-many"|"many-to-one"|"many-to-many", description }
- seed_data: object with sample data for each entity
- api_endpoints: array of { method: "GET"|"POST"|"PUT"|"PATCH"|"DELETE", path, description, entity, operation }

Return ONLY a JSON object.`;

  const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        entities: { type: "array", items: { type: "object" } },
        relationships: { type: "array", items: { type: "object" } },
        seed_data: { type: "object" },
        api_endpoints: { type: "array", items: { type: "object" } },
      },
      required: ["entities"],
    },
  });
  return res;
}

// ── UI System Spec ──────────────────────────────────────────────────────

export async function generateUiSystemSpec(base44: any, params: Record<string, any>): Promise<Record<string, any>> {
  const { architecture, productType, businessName } = params;
  const prompt = `You are a senior UI/UX designer. Generate a comprehensive UI design system spec.

BUSINESS: ${businessName || "N/A"}
PRODUCT TYPE: ${productType}
ARCHITECTURE PAGES: ${JSON.stringify(architecture?.pages || [])}

Generate a JSON object with:
- color_palette: { primary (hex), secondary (hex), accent (hex), background (hex), surface (hex), text (hex), text_muted (hex), success (hex), warning (hex), destructive (hex) }
- typography: { font_heading, font_body, font_display, scale: { h1, h2, h3, body, small } }
- spacing: { unit, scale: { xs, sm, md, lg, xl, 2xl } }
- components: array of { name, description, props, variants }
- layout_patterns: array of { name, description, use_case }
- responsive: { breakpoints: { sm, md, lg, xl }, strategy }
- theme: { mode: "light"|"dark"|"both", tokens: object }

Return ONLY a JSON object.`;

  const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        color_palette: { type: "object" },
        typography: { type: "object" },
        spacing: { type: "object" },
        components: { type: "array", items: { type: "object" } },
        layout_patterns: { type: "array", items: { type: "object" } },
        responsive: { type: "object" },
        theme: { type: "object" },
      },
      required: ["color_palette", "components"],
    },
  });
  return res;
}

// ── Code Manifest Spec ──────────────────────────────────────────────────

export async function generateCodeManifestSpec(base44: any, params: Record<string, any>): Promise<Record<string, any>> {
  const { architecture, dataModel, uiSystem, productType, businessName } = params;
  const prompt = `You are a senior full-stack engineer. Generate a code manifest — the file tree and build configuration for this system.

BUSINESS: ${businessName || "N/A"}
PRODUCT TYPE: ${productType}
TECH STACK: ${JSON.stringify(architecture?.tech_stack || {})}
PAGES: ${JSON.stringify(architecture?.pages || [])}
DATA MODELS: ${JSON.stringify(dataModel?.entities || [])}
UI SYSTEM: ${JSON.stringify(uiSystem?.color_palette || {})}

Generate a JSON object with:
- framework: string (e.g. "react-vite", "nextjs")
- repo_name: string (kebab-case)
- files: array of { path, category: "config"|"page"|"component"|"hook"|"entity"|"function"|"style"|"route"|"test"|"doc"|"util"|"api"|"lib", description }
- build_steps: array of strings (npm install, npm run build, etc.)
- env_vars: array of { name, description, required }

Return ONLY a JSON object.`;

  const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        framework: { type: "string" },
        repo_name: { type: "string" },
        files: { type: "array", items: { type: "object" } },
        build_steps: { type: "array", items: { type: "string" } },
        env_vars: { type: "array", items: { type: "object" } },
      },
      required: ["framework", "files"],
    },
  });
  return res;
}

// ── Deployment Spec ─────────────────────────────────────────────────────

export function generateDeploymentSpec(params: Record<string, any>): Record<string, any> {
  const { codeManifest, architecture, productType, businessName } = params;
  const repoName = codeManifest?.repo_name || (businessName || "app").toLowerCase().replace(/[^a-z0-9]/g, "-");
  return {
    live_url: `https://${repoName}.vercel.app`,
    platform: "vercel",
    build_config: {
      framework: codeManifest?.framework || "react-vite",
      build_command: "npm run build",
      output_dir: "dist",
      install_command: "npm install",
    },
    env_vars: codeManifest?.env_vars || [],
    routes: (architecture?.pages || []).map((p: any) => ({ path: p.route, page: p.name })),
  };
}

// ── Generate with validation + retry ────────────────────────────────────

export async function generateWithValidation(
  base44: any,
  generator: (base44: any, params: any) => Promise<any>,
  validator: (spec: any) => { valid: boolean; errors: string[]; warnings: string[]; score: number },
  params: Record<string, any>,
  label: string,
  options: { maxAttempts?: number; judgeThreshold?: number } = {}
): Promise<{ data: any; validation: any; attempts: number }> {
  const maxAttempts = options.maxAttempts || 3;
  let lastError = "";
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const data = await generator(base44, params);
      const validation = validator(data);
      if (validation.valid) {
        return { data, validation, attempts: attempt };
      }
      lastError = validation.errors.join("; ");
      // Retry with error context
      if (attempt < maxAttempts) {
        params = { ...params, _retryContext: `Previous attempt failed validation: ${lastError}. Fix these issues.` };
      }
    } catch (e) {
      lastError = String((e as any)?.message || e);
      if (attempt >= maxAttempts) throw new Error(`${label} generation failed after ${maxAttempts} attempts: ${lastError}`);
    }
  }
  throw new Error(`${label} generation failed after ${maxAttempts} attempts: ${lastError}`);
}