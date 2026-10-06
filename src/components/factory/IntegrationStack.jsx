import React from "react";
import { AlertCircle, Brain, CheckCircle2, Cloud, Database, GitBranch, Github, HardDrive, Layers3, ShieldCheck, Train } from "lucide-react";

const STACK = [
  { name: "Apex / Agent Zero", role: "Permanent commander", icon: Brain, status: "locked", color: "#000000" },
  { name: "Swarm Nexus", role: "Parallel specialist layer", icon: Layers3, status: "branch", color: "#004CE6" },
  { name: "GitHub", role: "Canonical code + immutable SHA", icon: Github, status: "runtime_check", color: "#000000" },
  { name: "Vercel", role: "Preview + approval-gated production", icon: Cloud, status: "runtime_check", color: "#000000" },
  { name: "Supabase", role: "Durable queue/state/receipts", icon: Database, status: "protected", color: "#16A34A" },
  { name: "Google Drive", role: "Approved assets + evidence", icon: HardDrive, status: "runtime_check", color: "#2563EB" },
  { name: "Railway", role: "Long-running workers only when required", icon: Train, status: "optional", color: "#7C3AED" },
  { name: "Xtreme Fault Line", role: "Independent validation", icon: ShieldCheck, status: "required", color: "#EA580C" }
];

const STATUS_META = {
  locked: { icon: CheckCircle2, label: "Architecture lock", color: "#16A34A", bg: "#DCFCE7" },
  branch: { icon: GitBranch, label: "Branch integration", color: "#2563EB", bg: "#DBEAFE" },
  required: { icon: ShieldCheck, label: "Required gate", color: "#B45309", bg: "#FEF3C7" },
  protected: { icon: AlertCircle, label: "Protected change", color: "#B45309", bg: "#FEF3C7" },
  optional: { icon: AlertCircle, label: "When required", color: "#475569", bg: "#F1F5F9" },
  runtime_check: { icon: AlertCircle, label: "Verify per run", color: "#475569", bg: "#F1F5F9" }
};

export default function IntegrationStack() {
  return (
    <section className="xa-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-lg bg-[#E6F0FF] flex items-center justify-center"><Layers3 className="w-5 h-5 text-[#0046FF]" /></div>
        <div>
          <h2 className="font-heading font-bold text-lg text-black">Factory Control Stack</h2>
          <p className="text-xs text-black/50">Architecture roles, not unverified connection claims</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {STACK.map(s => {
          const Icon = s.icon;
          const meta = STATUS_META[s.status];
          const StatusIcon = meta.icon;
          return (
            <div key={s.name} className="p-3 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB]">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15` }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5" style={{ background: meta.bg, color: meta.color }}>
                  <StatusIcon className="w-2.5 h-2.5" /> {meta.label}
                </span>
              </div>
              <div className="font-bold text-black text-xs truncate">{s.name}</div>
              <div className="text-[10px] text-black/45">{s.role}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-2.5 text-[10px] leading-4 text-black/55">
        Runtime health must come from the current GitHub SHA, deployment identity, durable queue state, worker leases, validator receipts and protected approvals. This panel does not infer connectivity from configuration alone.
      </div>
    </section>
  );
}
