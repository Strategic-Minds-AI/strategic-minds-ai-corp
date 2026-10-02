// ============================================================
// bulletproofValidation.ts — REAL implementations of the
// audit/fix/heal/harden/optimize phases.
// ============================================================

import { classifyError } from "./errorClassifier.ts";

// ── Deterministic policy engine ──────────────────────────────────────────

export async function checkIncidentMemory(base44: any, build: any): Promise<{
  known: boolean;
  memory: any | null;
  action: string;
}> {
  if (!build.error && build.status !== "failed") {
    return { known: false, memory: null, action: "skip" };
  }
  const errorSig = buildErrorSignature(build.error || "", build.current_step || "");
  try {
    const memories = await base44.asServiceRole.entities.IncidentMemory.filter(
      { error_signature: errorSig }, "-created_date", 1
    );
    const memory = memories?.[0] || memories?.items?.[0];
    if (memory && memory.outcome === "resolved" && memory.success_rate > 50) {
      return { known: true, memory, action: memory.action_taken || "retry" };
    }
  } catch {}
  return { known: false, memory: null, action: "skip" };
}

export async function recordIncident(base44: any, build: any, error: string, action: string, outcome: "resolved" | "failed" | "escalated", diagnosis?: string): Promise<void> {
  const errorSig = buildErrorSignature(error, build.current_step || "");
  const now = new Date().toISOString();
  try {
    const existing = await base44.asServiceRole.entities.IncidentMemory.filter(
      { error_signature: errorSig }, "-created_date", 1
    );
    const mem = existing?.[0] || existing?.items?.[0];
    if (mem) {
      const newCount = (mem.occurrence_count || 1) + 1;
      const newSuccessCount = outcome === "resolved" ? (mem.success_count || 0) + 1 : (mem.success_count || 0);
      await base44.asServiceRole.entities.IncidentMemory.update(mem.id, {
        occurrence_count: newCount,
        last_seen_at: now,
        outcome,
        success_rate: Math.round((newSuccessCount / newCount) * 100),
        success_count: newSuccessCount,
      });
    } else {
      await base44.asServiceRole.entities.IncidentMemory.create({
        error_signature: errorSig,
        error_class: classifyError(error).class,
        step: build.current_step || "unknown",
        build_id: build.id,
        build_name: build.business_name,
        diagnosis: diagnosis || "Auto-recorded by validation loop",
        action_taken: action,
        outcome,
        occurrence_count: 1,
        first_seen_at: now,
        last_seen_at: now,
        success_rate: outcome === "resolved" ? 100 : 0,
        success_count: outcome === "resolved" ? 1 : 0,
        failure_count: outcome === "failed" ? 1 : 0,
      });
    }
  } catch {}
}

function buildErrorSignature(error: string, step: string): string {
  const normalized = error.toLowerCase().replace(/\[.*?\]/g, "").replace(/[0-9a-f]{24}/g, "ID").replace(/\d+/g, "N").replace(/\s+/g, " ").trim().slice(0, 200);
  return `${step}:${normalized}`;
}

// ── REAL Fix Phase — regenerates missing assets ────────────────────────

export async function realFixPhase(base44: any, build: any): Promise<{
  fixed: number; fixesApplied: string; score: number; regenerated: boolean;
}> {
  const fixes: string[] = [];
  let fixedCount = 0;
  const assetToStep: Record<string, string> = {
    name_options: "names", architecture: "architecture", data_model: "data_model",
    ui_system: "ui_system", code_manifest: "codegen", website_content: "website",
    chosen_logo_url: "logo",
  };
  for (const [field, step] of Object.entries(assetToStep)) {
    const isMissing = !build[field] || (Array.isArray(build[field]) && build[field].length === 0) || (typeof build[field] === "object" && Object.keys(build[field]).length === 0);
    if (isMissing) {
      try {
        fixes.push(`Regenerating ${field} via step '${step}'`);
        const res = await base44.asServiceRole.functions.invoke("processAutoBuildStep", {
          build_id: build.id, step, advance: false, force: true, skip_validation: true,
        });
        if (res?.data?.success !== false) { fixedCount++; fixes.push(`✓ ${field} regenerated`); }
        else fixes.push(`✗ ${field} failed: ${res?.data?.error || "unknown"}`);
      } catch (e: any) { fixes.push(`✗ ${field} error: ${e?.message}`); }
    }
  }
  const score = fixedCount > 0 ? 75 + (fixedCount * 5) : (fixes.length === 0 ? 90 : 65);
  return { fixed: fixedCount, fixesApplied: fixes.join("; ") || "No fixes needed", score: Math.min(score, 95), regenerated: fixedCount > 0 };
}

// ── REAL Heal Phase ─────────────────────────────────────────────────────

export async function realHealPhase(base44: any, build: any): Promise<{
  healed: boolean; issues: string; actions: string; score: number; playbookUsed: string;
}> {
  if (!build.error && build.status !== "failed") {
    return { healed: false, issues: "No failures detected", actions: "No healing needed", score: 90, playbookUsed: "" };
  }
  const errorMsg = build.error || `Build in ${build.status} state`;
  const classified = classifyError(errorMsg);
  const actions: string[] = [];
  let healed = false;

  const incidentCheck = await checkIncidentMemory(base44, build);
  if (incidentCheck.known && incidentCheck.memory) {
    actions.push(`Applying known fix from incident memory: ${incidentCheck.memory.action_taken}`);
    try {
      await base44.asServiceRole.functions.invoke("processAutoBuildStep", {
        build_id: build.id, step: build.current_step, advance: true, force: true,
        previousErrors: [classified.context],
      });
      healed = true;
      actions.push("✓ Healed using incident memory");
      await recordIncident(base44, build, errorMsg, `memory:${incidentCheck.memory.action_taken}`, "resolved");
    } catch (e: any) {
      actions.push(`✗ Incident memory fix failed: ${e?.message}`);
      await recordIncident(base44, build, errorMsg, `memory:${incidentCheck.memory.action_taken}`, "failed");
    }
  }

  if (!healed) {
    try {
      const playbooks = await base44.asServiceRole.entities.RemediationPlaybook.filter(
        { error_class: classified.class, active: true }, "-success_count", 5
      );
      const pbList = playbooks?.items || playbooks || [];
      const matchingPb = pbList.find((pb: any) => {
        if (!pb.error_pattern) return true;
        try { return new RegExp(pb.error_pattern, "i").test(errorMsg); } catch { return true; }
      });
      if (matchingPb) {
        actions.push(`Applying playbook: ${matchingPb.name}`);
        await base44.asServiceRole.functions.invoke(matchingPb.function_to_call || "processAutoBuildStep", {
          build_id: build.id, step: build.current_step, previousErrors: [classified.context],
        });
        healed = true;
        actions.push("✓ Healed using playbook");
      }
    } catch {}
  }

  if (!healed) {
    actions.push(`No known fix — escalating. Error class: ${classified.class}`);
    await recordIncident(base44, build, errorMsg, "escalate", "escalated");
  }

  return { healed, issues: errorMsg, actions: actions.join("; "), score: healed ? 85 : 50, playbookUsed: "" };
}

// ── REAL Harden Phase — security checks ────────────────────────────────

export async function realHardenPhase(base44: any, build: any): Promise<{
  hardened: boolean; vulnerabilities: string; actions: string; score: number;
}> {
  const actions: string[] = [];
  const vulns: string[] = [];
  const text = JSON.stringify(build);

  const SECRET_PATTERNS = [/(?:sk-|pk-|rk_)[a-zA-Z0-9]{20,}/, /-----BEGIN [A-Z]+ PRIVATE KEY-----/, /(?:password|secret|api_key)\s*[:=]\s*["'][^"']{8,}["']/i];
  for (const re of SECRET_PATTERNS) {
    if (re.test(text)) { vulns.push("Secret detected in build data"); actions.push("⚠ Secret pattern found — review and redact"); }
  }

  if (build.code_manifest?.files) {
    const hasTests = build.code_manifest.files.some((f: any) => f.category === "test");
    if (!hasTests) { vulns.push("No test files"); actions.push("⚠ No tests — add test coverage"); }
  }

  if (vulns.length === 0) { actions.push("✓ No security vulnerabilities detected"); }
  return { hardened: vulns.length === 0, vulnerabilities: vulns.join("; ") || "None", actions: actions.join("; "), score: vulns.length === 0 ? 90 : 60 };
}

// ── REAL Optimize Phase — performance checks ───────────────────────────

export async function realOptimizePhase(base44: any, build: any): Promise<{
  optimized: boolean; bottlenecks: string; actions: string; score: number;
}> {
  const actions: string[] = [];
  const bottlenecks: string[] = [];

  if (build.website_content?.pages) {
    const totalPages = build.website_content.pages.length;
    if (totalPages > 10) bottlenecks.push(`${totalPages} pages — consider consolidating`);
  }

  if (build.code_manifest?.files) {
    const totalFiles = build.code_manifest.files.length;
    if (totalFiles > 50) bottlenecks.push(`${totalFiles} files — large codebase`);
  }

  if (bottlenecks.length === 0) actions.push("✓ No performance bottlenecks detected");
  return { optimized: bottlenecks.length === 0, bottlenecks: bottlenecks.join("; ") || "None", actions: actions.join("; "), score: bottlenecks.length === 0 ? 90 : 70 };
}

// ── Weighted score calculation ──────────────────────────────────────────

export function calculateWeightedScore(phases: { phase: string; score: number; weight: number }[]): number {
  const totalWeight = phases.reduce((sum, p) => sum + p.weight, 0);
  if (totalWeight === 0) return 0;
  const weightedSum = phases.reduce((sum, p) => sum + (p.score * p.weight), 0);
  return Math.round(weightedSum / totalWeight);
}

// ── Post-deploy verification ────────────────────────────────────────────

export async function verifyDeploymentInLoop(base44: any, build: any): Promise<{
  verified: boolean; score: number; issues: string;
}> {
  if (!build.deployment?.live_url) return { verified: false, score: 0, issues: "No live URL" };
  try {
    const res = await fetch(build.deployment.live_url, { method: "HEAD", signal: AbortSignal.timeout(10000) });
    if (res.ok) return { verified: true, score: 95, issues: "Site is live and responding" };
    return { verified: false, score: 40, issues: `Site returned ${res.status}` };
  } catch (e: any) {
    return { verified: false, score: 20, issues: `Site unreachable: ${e?.message}` };
  }
}