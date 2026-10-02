// Shared validation loop logic — used by both runValidationLoop (the HTTP
// endpoint) and processAutoBuildStep (which triggers validation after each
// step). Extracted here so both call the same code without HTTP round-trips.

import {
  realFixPhase, realHealPhase, realHardenPhase, realOptimizePhase,
  calculateWeightedScore, verifyDeploymentInLoop, recordIncident,
} from "./bulletproofValidation.ts";

const QUALITY_GATE_THRESHOLD = 75;
const MAX_RETRIES = 3;

export async function executeValidationLoop(base44: any, buildId: string, force = false): Promise<{
  ok: boolean;
  pipeline_id: string;
  build_id: string;
  score: number;
  passed: boolean;
  retries: number;
  max_retries: number;
  quality_gate_threshold: number;
  status: string;
  checks: number;
}> {
  const builds = await base44.asServiceRole.entities.AutoBuild.filter({ id: buildId }, "-created_date", 1);
  const build = builds?.[0] || builds?.items?.[0];
  if (!build) throw new Error("Build not found");

  let pipelines = await base44.asServiceRole.entities.ValidationPipeline.filter({ build_id: buildId }, "-created_date", 1);
  let pipeline = pipelines?.[0] || pipelines?.items?.[0];

  if (!pipeline) {
    pipeline = await base44.asServiceRole.entities.ValidationPipeline.create({
      build_id: buildId,
      build_name: build.business_name,
      status: "running",
      current_phase: "audit",
      score: 0,
      retry_count: 0,
      max_retries: MAX_RETRIES,
      quality_gate_threshold: QUALITY_GATE_THRESHOLD,
      started_at: new Date().toISOString(),
      checks: [],
      logs: [`[${new Date().toISOString()}] Validation pipeline created`],
    });
  } else if (pipeline.status === "running" && !force) {
    return {
      ok: false, pipeline_id: pipeline.id, build_id: buildId,
      score: pipeline.score || 0, passed: false,
      retries: pipeline.retry_count || 0, max_retries: MAX_RETRIES,
      quality_gate_threshold: QUALITY_GATE_THRESHOLD,
      status: "already_running", checks: (pipeline.checks || []).length,
    };
  } else {
    pipeline = await base44.asServiceRole.entities.ValidationPipeline.update(pipeline.id, {
      status: "running", current_phase: "audit", error: "",
      started_at: new Date().toISOString(),
    });
  }

  const pipelineId = pipeline.id;
  const checks: any[] = [];
  const logs: string[] = [...(pipeline.logs || [])];

  // ── Phase 1: AUDIT ───────────────────────────────────────────────────
  logs.push(`[${new Date().toISOString()}] Phase: AUDIT`);
  await base44.asServiceRole.entities.ValidationPipeline.update(pipelineId, { current_phase: "audit", logs });

  const auditScore = await runAuditPhase(base44, build);
  checks.push({ phase: "audit", check_name: "full_build_audit", passed: auditScore >= QUALITY_GATE_THRESHOLD, score: auditScore, timestamp: new Date().toISOString() });
  const phaseScores = [{ phase: "audit", score: auditScore, weight: 30 }];

  if (auditScore < QUALITY_GATE_THRESHOLD) {
    // ── Phase 2: FIX ────────────────────────────────────────────────
    logs.push(`[${new Date().toISOString()}] Phase: FIX`);
    await base44.asServiceRole.entities.ValidationPipeline.update(pipelineId, { current_phase: "fix", logs });
    const fixResult = await realFixPhase(base44, build);
    checks.push({ phase: "fix", check_name: "auto_fix", passed: fixResult.fixed > 0, score: fixResult.score, timestamp: new Date().toISOString() });
    phaseScores.push({ phase: "fix", score: fixResult.score, weight: 20 });

    // ── Phase 3: HEAL ──────────────────────────────────────────────
    logs.push(`[${new Date().toISOString()}] Phase: HEAL`);
    await base44.asServiceRole.entities.ValidationPipeline.update(pipelineId, { current_phase: "heal", logs });
    const healResult = await realHealPhase(base44, build);
    checks.push({ phase: "heal", check_name: "auto_heal", passed: healResult.healed, score: healResult.score, timestamp: new Date().toISOString() });
    phaseScores.push({ phase: "heal", score: healResult.score, weight: 20 });

    // ── Phase 4: HARDEN ─────────────────────────────────────────────
    logs.push(`[${new Date().toISOString()}] Phase: HARDEN`);
    await base44.asServiceRole.entities.ValidationPipeline.update(pipelineId, { current_phase: "harden", logs });
    const hardenResult = await realHardenPhase(base44, build);
    checks.push({ phase: "harden", check_name: "auto_harden", passed: hardenResult.hardened, score: hardenResult.score, timestamp: new Date().toISOString() });
    phaseScores.push({ phase: "harden", score: hardenResult.score, weight: 15 });

    // ── Phase 5: OPTIMIZE ──────────────────────────────────────────
    logs.push(`[${new Date().toISOString()}] Phase: OPTIMIZE`);
    await base44.asServiceRole.entities.ValidationPipeline.update(pipelineId, { current_phase: "optimize", logs });
    const optimizeResult = await realOptimizePhase(base44, build);
    checks.push({ phase: "optimize", check_name: "auto_optimize", passed: optimizeResult.optimized, score: optimizeResult.score, timestamp: new Date().toISOString() });
    phaseScores.push({ phase: "optimize", score: optimizeResult.score, weight: 15 });
  }

  let currentScore = calculateWeightedScore(phaseScores);

  // ── Post-deploy verification ──────────────────────────────────────────
  if (build.deployment?.live_url) {
    try {
      const deployResult = await verifyDeploymentInLoop(base44, build);
      checks.push({ phase: "post_deploy", check_name: "post_deploy_verification", passed: deployResult.verified, score: deployResult.score, timestamp: new Date().toISOString() });
      if (!deployResult.verified) currentScore = Math.min(currentScore, 60);
    } catch {}
  }

  const passed = currentScore >= QUALITY_GATE_THRESHOLD;
  const newRetryCount = (pipeline.retry_count || 0) + 1;
  const finalStatus = passed ? "passed" : (newRetryCount >= MAX_RETRIES ? "failed" : "retry");

  await base44.asServiceRole.entities.ValidationPipeline.update(pipelineId, {
    status: finalStatus,
    score: currentScore,
    current_phase: "complete",
    retry_count: newRetryCount,
    checks,
    logs: [...logs, `[${new Date().toISOString()}] Validation ${finalStatus}: score=${currentScore}`],
    completed_at: new Date().toISOString(),
  });

  return {
    ok: true, pipeline_id: pipelineId, build_id: buildId,
    score: currentScore, passed, retries: newRetryCount,
    max_retries: MAX_RETRIES, quality_gate_threshold: QUALITY_GATE_THRESHOLD,
    status: finalStatus, checks: checks.length,
  };
}

// ── Audit phase — scans the build for completeness ─────────────────────

async function runAuditPhase(base44: any, build: any): Promise<number> {
  const fields = [
    "vision", "strategy", "name_options", "content_templates", "logo_options",
    "brand_packs", "website_content", "social_media_pack", "video_pack",
    "architecture", "data_model", "ui_system", "code_manifest", "deployment",
  ];
  const productType = build.product_type || "marketing_site";
  const isSystem = ["web_app", "ecommerce", "platform"].includes(productType);
  const relevantFields = isSystem
    ? ["vision", "strategy", "architecture", "data_model", "ui_system", "code_manifest", "deployment"]
    : fields;

  let present = 0;
  let total = relevantFields.length;
  for (const f of relevantFields) {
    const v = build[f];
    if (v && !(Array.isArray(v) && v.length === 0) && !(typeof v === "object" && Object.keys(v).length === 0)) {
      present++;
    }
  }
  return Math.round((present / total) * 100);
}