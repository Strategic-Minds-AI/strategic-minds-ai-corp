// recoverStuckAutoBuilds — Auto-heal for the Auto Builder queue.
// Runs on a schedule (every 15 min via workflow). Scans for:
//   1. AutoBuild records stuck in "running" status (updated > 10 min ago)
//   2. AutoBuild records in "failed" status (retry up to 3 times)
// Recovers them by re-running the current step via processAutoBuildStep.

import { createClientFromRequest } from "../../shared/ownedClient.ts";

const STUCK_THRESHOLD_MINUTES = 10;
const MAX_FAILURE_RETRIES = 2;

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });
    const svc = base44.asServiceRole;

    const now = Date.now();

    const runningBuilds = await svc.entities.AutoBuild.filter({ status: "running" }, "-updated_date", 50).catch(() => []);
    const runningList = runningBuilds?.items || runningBuilds || [];

    const failedBuilds = await svc.entities.AutoBuild.filter({ status: "failed" }, "-updated_date", 20).catch(() => []);
    const failedList = failedBuilds?.items || failedBuilds || [];

    if (runningList.length === 0 && failedList.length === 0) {
      return Response.json({ ok: true, scanned: 0, recovered: 0, skipped: 0, marked_failed: 0, details: [] });
    }

    const results = { scanned: runningList.length + failedList.length, recovered: 0, marked_failed: 0, skipped: 0, details: [] as any[] };

    // Process stuck (running) builds
    for (const build of runningList) {
      const startedAt = build.step_started_at || build.updated_date || build.created_date || now;
      const ageMinutes = (now - new Date(startedAt).getTime()) / 60000;

      if (ageMinutes < STUCK_THRESHOLD_MINUTES) { results.skipped++; continue; }
      const step = build.current_step;
      if (!step || step === "complete") { results.skipped++; continue; }

      try {
        const res = await base44.functions.invoke("processAutoBuildStep", {
          build_id: build.id, step, advance: build.auto_advance !== false, force: true,
        });
        if (res?.data?.success) {
          results.recovered++;
          results.details.push({ build_id: build.id, business_name: build.business_name, action: "recovered-stuck", step, age_minutes: Math.round(ageMinutes) });
        } else { results.skipped++; }
      } catch (err: any) {
        results.marked_failed++;
        results.details.push({ build_id: build.id, business_name: build.business_name, action: "recovery-failed", error: err?.message || String(err) });
      }
    }

    // Retry failed builds
    for (const build of failedList) {
      const failureCount = (build.logs || []).filter((l: string) => l.includes("FAILED")).length;
      if (failureCount >= MAX_FAILURE_RETRIES * 3) { results.skipped++; continue; }
      const step = build.current_step;
      if (!step || step === "complete") { results.skipped++; continue; }

      try {
        const res = await base44.functions.invoke("processAutoBuildStep", {
          build_id: build.id, step, advance: build.auto_advance !== false, force: true,
        });
        if (res?.data?.success) {
          results.recovered++;
          results.details.push({ build_id: build.id, business_name: build.business_name, action: "retry-failed", step });
        } else { results.skipped++; }
      } catch (err: any) {
        results.marked_failed++;
        results.details.push({ build_id: build.id, business_name: build.business_name, action: "retry-failed-error", error: err?.message || String(err) });
      }
    }

    return Response.json({ ok: true, ...results });
  } catch (error: any) {
    console.error("[recoverStuckAutoBuilds]", error);
    return Response.json({ error: error?.message || "Recovery failed" }, { status: 500 });
  }
}