import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Plus, Loader2, Trash2, Zap, Pause, Play, CheckCircle, AlertCircle,
  Clock, ArrowRight, Hammer, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PRODUCT_TYPE_OPTIONS, STEP_LABELS, STATUS_COLORS, GOVERNANCE_LABELS } from "@/lib/buildProductTypes";

// Auto Builder — admin-side queue. The admin creates builds here, then
// manages them through the autonomous pipeline.

export default function AutoBuilder() {
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [error, setError] = useState("");
  const [productType, setProductType] = useState("marketing_site");
  const [runningCycle, setRunningCycle] = useState(false);
  const [cycleResult, setCycleResult] = useState(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const list = await base44.entities.AutoBuild.list("-created_date", 100);
      setBuilds(list?.items || list || []);
    } catch {
      setBuilds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Poll for updates when a build is running
  useEffect(() => {
    const anyRunning = builds.some((b) => b.status === "running");
    if (!anyRunning) return;
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [builds, load]);

  const createBuild = async () => {
    if (!businessName.trim()) { setError("Business name is required."); return; }
    setCreating(true);
    setError("");
    try {
      const created = await base44.entities.AutoBuild.create({
        business_name: businessName.trim(),
        industry: industry.trim(),
        product_type: productType,
        current_step: "profile",
        status: "queued",
        visited_steps: [],
        logs: [`[${new Date().toISOString()}] Build created`],
      });
      setBusinessName("");
      setIndustry("");
      load();
    } catch {
      setError("Couldn't create build. Try again.");
    } finally {
      setCreating(false);
    }
  };

  const runStep = async (buildId, step) => {
    try {
      await base44.functions.invoke("processAutoBuildStep", { build_id: buildId, step, advance: true });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const runCycle = async () => {
    setRunningCycle(true);
    setError("");
    setCycleResult(null);
    try {
      const res = await base44.functions.invoke("runAutonomousBuild", {});
      setCycleResult(res?.data || res);
      load();
    } catch (e) {
      setError(e.message);
    }
    setRunningCycle(false);
  };

  const toggleAutoAdvance = async (build) => {
    try {
      await base44.entities.AutoBuild.update(build.id, {
        auto_advance: !build.auto_advance,
        status: !build.auto_advance && build.status === "paused" ? "queued" : build.status,
      });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const setGovernance = async (build, tier) => {
    try {
      await base44.entities.AutoBuild.update(build.id, { governance_tier: tier });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const deleteBuild = async (buildId) => {
    try {
      await base44.entities.AutoBuild.delete(buildId);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Hammer className="h-6 w-6 text-blue-400" />
              Auto Builder
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Autonomous build pipeline — queue, generate, validate, deploy.
            </p>
          </div>
          <button
            onClick={runCycle}
            disabled={runningCycle}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {runningCycle ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {runningCycle ? "Running..." : "Run Cycle"}
          </button>
        </div>

        {/* Cycle result */}
        {cycleResult && (
          <div className="mb-6 rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-400">
              <CheckCircle className="h-4 w-4" />
              Cycle Complete
            </div>
            <div className="mt-2 grid grid-cols-4 gap-4 text-sm">
              <div><span className="text-slate-400">Processed:</span> {cycleResult.builds_processed}</div>
              <div><span className="text-slate-400">Eligible:</span> {cycleResult.builds_eligible}</div>
              <div><span className="text-slate-400">Blast halted:</span> {cycleResult.halted_by_blast_radius}</div>
              <div><span className="text-slate-400">Gov halted:</span> {cycleResult.halted_by_governance}</div>
            </div>
          </div>
        )}

        {/* Create form */}
        <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-300">Create New Build</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <input
              type="text"
              placeholder="Business name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Industry (e.g. hvac, roofing)"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
            />
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            >
              {PRODUCT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button
              onClick={createBuild}
              disabled={creating}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create Build
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        </div>

        {/* Build queue */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
          </div>
        ) : builds.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-12 text-center">
            <Hammer className="mx-auto h-8 w-8 text-slate-600" />
            <p className="mt-2 text-sm text-slate-400">No builds yet. Create one above to start.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {builds.map((build) => (
              <div key={build.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-white">{build.business_name || "Untitled"}</h3>
                      <span className={cn("rounded border px-2 py-0.5 text-xs font-medium", STATUS_COLORS[build.status] || STATUS_COLORS.queued)}>
                        {build.status}
                      </span>
                      <span className="rounded border border-slate-700 px-2 py-0.5 text-xs text-slate-400">
                        {PRODUCT_TYPE_OPTIONS.find((o) => o.value === build.product_type)?.label || build.product_type}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                      <span>Step:</span>
                      <span className="font-medium text-slate-300">{STEP_LABELS[build.current_step] || build.current_step}</span>
                      {build.industry && <span className="text-slate-500">· {build.industry}</span>}
                    </div>
                    {/* Progress bar */}
                    <div className="mt-3">
                      <BuildProgress build={build} />
                    </div>
                    {/* Logs */}
                    {build.logs && build.logs.length > 0 && (
                      <div className="mt-3 max-h-24 overflow-y-auto rounded-lg bg-slate-950 p-2 text-xs text-slate-500">
                        {build.logs.slice(-3).map((l, i) => <div key={i}>{l}</div>)}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => runStep(build.id, build.current_step)}
                        disabled={build.status === "running"}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-600/20 border border-blue-600/30 px-3 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-600/30 disabled:opacity-50"
                      >
                        {build.status === "running" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                        Run Step
                      </button>
                      <button
                        onClick={() => toggleAutoAdvance(build)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium",
                          build.auto_advance
                            ? "border-green-500/30 bg-green-500/10 text-green-400"
                            : "border-slate-700 bg-slate-800 text-slate-400"
                        )}
                      >
                        {build.auto_advance ? <Zap className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                        Auto
                      </button>
                      <button
                        onClick={() => deleteBuild(build.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1.5 text-xs text-red-400 hover:bg-red-500/20"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    {/* Governance selector */}
                    <div className="flex items-center gap-1">
                      <Settings className="h-3 w-3 text-slate-500" />
                      <select
                        value={build.governance_tier || "green"}
                        onChange={(e) => setGovernance(build, e.target.value)}
                        className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-300"
                      >
                        <option value="green">Green (Auto)</option>
                        <option value="yellow">Yellow (Pause Deploy)</option>
                        <option value="red">Red (Pause All)</option>
                      </select>
                    </div>
                    {build.error && (
                      <div className="flex items-center gap-1 text-xs text-red-400">
                        <AlertCircle className="h-3 w-3" />
                        <span className="max-w-xs truncate">{build.error}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Build progress bar ──────────────────────────────────────────────────

function BuildProgress({ build }) {
  const productType = build.product_type || "marketing_site";
  const option = PRODUCT_TYPE_OPTIONS.find((o) => o.value === productType);
  const steps = option?.steps || [];
  const currentIdx = steps.indexOf(build.current_step);
  const progress = currentIdx >= 0 ? Math.round((currentIdx / (steps.length - 1)) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{STEP_LABELS[build.current_step] || build.current_step}</span>
        <span>{progress}%</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            build.status === "complete" ? "bg-green-500" : build.status === "failed" ? "bg-red-500" : "bg-blue-500"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}