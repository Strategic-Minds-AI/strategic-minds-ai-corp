// Autonomous Build Orchestrator — drives the AutoBuilder pipeline.
// Finds builds with auto_advance=true and processes their next step.
// Called by the "Run Cycle" button and by the Autonomous Build Loop workflow.

import { createClientFromRequest } from "../../shared/ownedClient.ts";

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });

    // Find builds with auto_advance enabled that aren't complete/failed/running
    const allBuilds = await base44.asServiceRole.entities.AutoBuild.list("-created_date", 100);
    const buildList = allBuilds?.items || allBuilds || [];
    const eligible = buildList.filter((b: any) =>
      b.auto_advance === true &&
      b.status !== "complete" &&
      b.status !== "failed" &&
      b.status !== "running" &&
      b.current_step !== "complete"
    );

    // Concurrency limit: max 3 builds per cycle
    const toProcess = eligible.slice(0, 3);
    const results: any[] = [];
    let haltedByBlastRadius = 0;
    let haltedByGovernance = 0;

    for (const build of toProcess) {
      try {
        const step = build.current_step || "profile";

        // ── Blast radius cap ──────────────────────────────────────────
        const today = new Date().toISOString().slice(0, 10);
        const actionsToday = build.last_action_date === today ? (build.actions_today || 0) : 0;
        if (actionsToday >= 50) {
          haltedByBlastRadius++;
          results.push({ build_id: build.id, business_name: build.business_name, step, success: false, halted: true, reason: "Blast radius cap reached (50 actions/day)" });
          continue;
        }

        // ── Governance tier check ──────────────────────────────────────
        const tier = build.governance_tier || "green";
        if (tier === "red") {
          haltedByGovernance++;
          results.push({ build_id: build.id, business_name: build.business_name, step, success: false, halted: true, reason: "Build is red-tier — requires operator approval at every step" });
          continue;
        }
        if (tier === "yellow" && step === "deploy") {
          haltedByGovernance++;
          results.push({ build_id: build.id, business_name: build.business_name, step, success: false, halted: true, reason: "Build is yellow-tier — requires operator approval before deploy" });
          continue;
        }

        const res = await base44.asServiceRole.functions.invoke("processAutoBuildStep", {
          build_id: build.id, step, advance: true,
        });
        const data = res?.data || res;

        // Update blast radius counter
        await base44.asServiceRole.entities.AutoBuild.update(build.id, {
          actions_today: actionsToday + 1,
          last_action_date: today,
        });

        results.push({
          build_id: build.id, business_name: build.business_name, step,
          success: data?.success !== false, advanced_to: data?.advanced_to, error: data?.error,
        });
      } catch (e: any) {
        results.push({ build_id: build.id, business_name: build.business_name, error: e?.message || String(e), success: false });
      }
    }

    return Response.json({
      ok: true,
      builds_processed: results.length,
      builds_eligible: eligible.length,
      halted_by_blast_radius: haltedByBlastRadius,
      halted_by_governance: haltedByGovernance,
      results,
    });
  } catch (error: any) {
    return Response.json({ error: error?.message || "server error" }, { status: 500 });
  }
}