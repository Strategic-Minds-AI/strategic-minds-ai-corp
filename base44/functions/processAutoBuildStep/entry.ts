// Auto Builder step processor — executes a single pipeline step for an
// AutoBuild record. Supports BOTH marketing and system-build pipelines.
//
// Marketing:  profile → vision → strategy → names → content → logo → brand → website → social → video → review
// System:     profile → vision → strategy → architecture → data_model → ui_system → codegen → deploy → system_review

import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import {
  generateNames, generateContent, generateLogos, generateBrandPacks,
  generateWebsite, generateSocial, generateVideo,
} from "../../shared/autoBuildGenerators.ts";
import {
  generateVisionDoc, generateStrategyDoc,
} from "../../shared/visionStrategyGenerators.ts";
import {
  generateArchitectureSpec, generateDataModelSpec, generateUiSystemSpec,
  generateCodeManifestSpec, generateDeploymentSpec, generateWithValidation,
} from "../../shared/systemBuildGenerators.ts";
import {
  strictValidateArchitecture, strictValidateDataModel,
  strictValidateUiSystem, strictValidateCodeManifest, strictValidateDeployment,
} from "../../shared/systemBuildSchemas.ts";

const MARKETING_STEPS = ["profile", "vision", "strategy", "names", "content", "logo", "brand", "website", "social", "video", "review", "complete"];
const SYSTEM_STEPS = ["profile", "vision", "strategy", "architecture", "data_model", "ui_system", "codegen", "deploy", "system_review", "complete"];
const SYSTEM_PRODUCT_TYPES = ["web_app", "ecommerce", "platform"];

const STEP_PATHS: Record<string, string> = {
  profile: "/business-profile", vision: "/vision", strategy: "/strategy",
  names: "/business-name-studio", content: "/content-generator",
  logo: "/logo-generator", brand: "/brand-generator", website: "/design-direction",
  social: "/social-media", video: "/video-generator", review: "/your-designs",
  architecture: "/system-architecture", data_model: "/data-model",
  ui_system: "/ui-system", codegen: "/codegen", deploy: "/deploy",
  system_review: "/system-review",
};

function getStepSequence(productType: string): string[] {
  return SYSTEM_PRODUCT_TYPES.includes(productType) ? SYSTEM_STEPS : MARKETING_STEPS;
}

function log(build: any, msg: string): string[] {
  return [...(build.logs || []), `[${new Date().toISOString()}] ${msg}`].slice(-100);
}

function nextStep(current: string, productType: string): string {
  const steps = getStepSequence(productType);
  const idx = steps.indexOf(current);
  if (idx < 0 || idx >= steps.length - 1) return "complete";
  return steps[idx + 1];
}

function buildParams(build: any): Record<string, any> {
  const p = build.profile || {};
  return {
    businessName: build.business_name, industry: build.industry,
    subIndustry: build.sub_industry, businessType: p.business_stage,
    primaryLocation: p.primary_location, serviceArea: p.radius,
    city: p.primary_location, state: "", services: p.services || [],
    differentiators: [], yearsInBusiness: p.years_in_business,
    phone: p.phone, email: p.email, website: p.website,
    logoUrl: build.chosen_logo_url || (build.logo_options?.[0]?.url),
    contentTone: build.chosen_content_template,
    vision: build.vision, strategy: build.strategy,
  };
}

// ── Step executors ──────────────────────────────────────────────────────

async function runVision(base44: any, build: any) {
  const vision = await generateVisionDoc(base44, buildParams(build));
  if (build.auto_advance) vision.approved = true;
  return { vision };
}

async function runStrategy(base44: any, build: any) {
  if (!build.vision) throw new Error("Vision document is required before generating strategy.");
  const strategy = await generateStrategyDoc(base44, { ...buildParams(build), vision: build.vision });
  if (build.auto_advance) strategy.approved = true;
  return { strategy };
}

async function runNames(base44: any, build: any) {
  return { name_options: await generateNames(base44, buildParams(build)) };
}

async function runContent(base44: any, build: any) {
  return { content_templates: await generateContent(base44, buildParams(build)) };
}

async function runLogo(base44: any, build: any) {
  return { logo_options: await generateLogos(base44, buildParams(build)) };
}

async function runBrand(base44: any, build: any) {
  return { brand_packs: await generateBrandPacks(base44, buildParams(build)) };
}

async function runWebsite(base44: any, build: any) {
  const params = buildParams(build);
  const content = await generateWebsite(base44, params);
  const { photoStyleSuffix, compileBrief } = await import("../../shared/generatorBrief.ts");
  const photo = photoStyleSuffix(compileBrief(params));
  const ind = params.industry || "local service business";
  const imgResults = await Promise.allSettled([
    base44.asServiceRole.integrations.Core.GenerateImage({ prompt: `Professional ${ind} project photo, before and after, high quality, photorealistic. ${photo}` }),
    base44.asServiceRole.integrations.Core.GenerateImage({ prompt: `${ind} team working on a project, professional, photorealistic. ${photo}` }),
    base44.asServiceRole.integrations.Core.GenerateImage({ prompt: `Completed ${ind} project, clean professional result, photorealistic. ${photo}` }),
  ]);
  const website_images = imgResults.map((r: any, i: number) => ({
    id: `img-${i}`, label: ["Project Showcase", "Team at Work", "Completed Work"][i], url: r.value?.url,
  })).filter((img: any) => img.url);
  return { website_content: content, website_images };
}

async function runSocial(base44: any, build: any) {
  return { social_media_pack: await generateSocial(base44, buildParams(build)) };
}

async function runVideo(base44: any, build: any) {
  return { video_pack: { concepts: await generateVideo(base44, buildParams(build)) } };
}

async function runArchitecture(base44: any, build: any) {
  const result = await generateWithValidation(base44, generateArchitectureSpec, strictValidateArchitecture,
    { productType: build.product_type, businessName: build.business_name, industry: build.industry, profile: build.profile },
    "system architecture", { maxAttempts: 3 });
  if (!result.validation.valid) throw new Error(`Architecture validation failed: ${result.validation.errors.join("; ")}`);
  return { architecture: result.data };
}

async function runDataModel(base44: any, build: any) {
  if (!build.architecture) throw new Error("Architecture spec is required before generating the data model");
  const result = await generateWithValidation(base44, generateDataModelSpec, strictValidateDataModel,
    { architecture: build.architecture, productType: build.product_type, businessName: build.business_name },
    "data model", { maxAttempts: 3 });
  if (!result.validation.valid) throw new Error(`Data model validation failed: ${result.validation.errors.join("; ")}`);
  return { data_model: result.data };
}

async function runUiSystem(base44: any, build: any) {
  if (!build.architecture) throw new Error("Architecture spec is required before generating the UI system");
  const result = await generateWithValidation(base44, generateUiSystemSpec, strictValidateUiSystem,
    { architecture: build.architecture, productType: build.product_type, businessName: build.business_name },
    "UI design system", { maxAttempts: 3 });
  if (!result.validation.valid) throw new Error(`UI system validation failed: ${result.validation.errors.join("; ")}`);
  return { ui_system: result.data };
}

async function runCodegen(base44: any, build: any) {
  if (!build.architecture) throw new Error("Architecture spec is required before generating the code manifest");
  const result = await generateWithValidation(base44, generateCodeManifestSpec, strictValidateCodeManifest,
    { architecture: build.architecture, dataModel: build.data_model, uiSystem: build.ui_system, productType: build.product_type, businessName: build.business_name },
    "code manifest", { maxAttempts: 3 });
  if (!result.validation.valid) throw new Error(`Code manifest validation failed: ${result.validation.errors.join("; ")}`);
  return { code_manifest: result.data };
}

async function runDeploy(base44: any, build: any) {
  if (!build.code_manifest) throw new Error("Code manifest is required before configuring deployment");
  const spec = generateDeploymentSpec({ codeManifest: build.code_manifest, architecture: build.architecture, productType: build.product_type, businessName: build.business_name });
  const v = strictValidateDeployment(spec);
  if (!v.valid) throw new Error(`Deployment validation failed: ${v.errors.join("; ")}`);
  return { deployment: spec };
}

// ── Executor registry ───────────────────────────────────────────────────

const STEP_EXECUTORS: Record<string, (base44: any, build: any) => Promise<Record<string, any>>> = {
  profile: async () => ({}),
  vision: runVision, strategy: runStrategy,
  names: runNames, content: runContent, logo: runLogo, brand: runBrand,
  website: runWebsite, social: runSocial, video: runVideo,
  review: async () => ({}),
  architecture: runArchitecture, data_model: runDataModel,
  ui_system: runUiSystem, codegen: runCodegen, deploy: runDeploy,
  system_review: async (base44: any, build: any) => {
    // Provision the full deployment stack
    return { deployment: build.deployment || {} };
  },
};

// ── Main handler ────────────────────────────────────────────────────────

export default async function(req: Request): Promise<Response> {
  try {
    if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });
    const base44 = createClientFromRequest(req);

    let user: any = null;
    try { user = await base44.auth.me(); } catch { user = null; }
    if (!user || (user.role !== "admin" && user.role !== "employee")) {
      return Response.json({ error: "Admin or employee access required" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const buildId = String(body.build_id || "");
    const step = String(body.step || "");
    const advance = body.advance !== false;
    const skipValidation = body.skip_validation === true;

    if (!buildId || !step) return Response.json({ error: "build_id and step are required" }, { status: 400 });
    if (!STEP_EXECUTORS[step]) return Response.json({ error: `Unknown step: ${step}` }, { status: 400 });

    let builds = await base44.asServiceRole.entities.AutoBuild.filter({ id: buildId }, "-created_date", 1);
    let build = builds?.[0] || builds?.items?.[0];
    if (!build) return Response.json({ error: "Build not found" }, { status: 404 });

    if (build.status === "running" && !body.force) {
      return Response.json({ error: "Build is already running a step. Pass force=true to override.", build_id: buildId, current_step: build.current_step }, { status: 409 });
    }

    let logs = log(build, `Starting step: ${step}`);
    await base44.asServiceRole.entities.AutoBuild.update(buildId, {
      status: "running", error: "", step_started_at: new Date().toISOString(), logs,
    });

    const maxRetries = 3;
    let lastError = "";
    let stepResult: Record<string, any> | null = null;

    for (let attemptNum = 1; attemptNum <= maxRetries; attemptNum++) {
      try {
        stepResult = await STEP_EXECUTORS[step](base44, build);
        break;
      } catch (e) {
        lastError = String((e as any)?.message || e);
        logs = log({ logs } as any, `Step ${step} attempt ${attemptNum}/${maxRetries} failed: ${lastError}`);
        await base44.asServiceRole.entities.AutoBuild.update(buildId, { logs });
        if (attemptNum < maxRetries) {
          await new Promise((r) => setTimeout(r, 2000 * attemptNum));
          const freshBuilds = await base44.asServiceRole.entities.AutoBuild.filter({ id: buildId }, "-created_date", 1);
          if (freshBuilds?.[0]) build = freshBuilds[0];
        }
      }
    }

    if (!stepResult) {
      logs = log({ logs } as any, `Step ${step} FAILED after ${maxRetries} attempts: ${lastError}`);
      await base44.asServiceRole.entities.AutoBuild.update(buildId, { status: "failed", error: lastError, logs });
      return Response.json({ success: false, error: lastError, step, attempts: maxRetries }, { status: 500 });
    }

    const stepPath = STEP_PATHS[step] || `/${step}`;
    const visited = [...new Set([...(build.visited_steps || []), stepPath])];
    logs = log({ logs } as any, `Step ${step} completed successfully`);
    const updateData: Record<string, unknown> = { ...stepResult, visited_steps: visited, logs, status: "paused" };

    if (advance && step !== "review") {
      const ns = nextStep(step, build.product_type);
      updateData.current_step = ns;
      logs = log({ logs } as any, `Advanced to step: ${ns}`);
      updateData.logs = logs;
      if (ns === "complete") updateData.status = "complete";
    }

    const updated = await base44.asServiceRole.entities.AutoBuild.update(buildId, updateData);

    // Trigger validation loop after meaningful steps
    const VALIDATABLE_STEPS = ["vision", "strategy", "names", "content", "logo", "brand", "website", "social", "video", "architecture", "data_model", "ui_system", "codegen", "deploy"];
    let validationResult: Record<string, any> | null = null;
    if (!skipValidation && VALIDATABLE_STEPS.includes(step)) {
      try {
        logs = log({ logs } as any, `Triggering validation loop for step: ${step}`);
        await base44.asServiceRole.entities.AutoBuild.update(buildId, { logs });
        const { executeValidationLoop } = await import("../../shared/validationLoop.ts");
        validationResult = await executeValidationLoop(base44, buildId, false);
        logs = log({ logs } as any, `Validation complete: score=${validationResult?.score}, passed=${validationResult?.passed}`);
        await base44.asServiceRole.entities.AutoBuild.update(buildId, { logs });
      } catch (valErr) {
        logs = log({ logs } as any, `Validation skipped (error): ${String((valErr as any)?.message || valErr)}`);
        await base44.asServiceRole.entities.AutoBuild.update(buildId, { logs });
      }
    }

    return Response.json({ success: true, step, build: updated, advanced_to: updateData.current_step || build.current_step, validation: validationResult }, { status: 200 });
  } catch (e) {
    console.error("processAutoBuildStep error:", e);
    return Response.json({ error: String((e as any)?.message || e) }, { status: 500 });
  }
}