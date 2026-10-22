import React, { useMemo } from "react";
import { Brain, Layers3, ShieldCheck, Workflow, Zap } from "lucide-react";

const STAGES = [
  ["1", "Source Truth", "Apex resolves verified client/project inputs"],
  ["2", "Research", "Public-business + competitor intelligence"],
  ["3", "Creative", "Logo, brand and website directions"],
  ["4", "Mockup Lock", "Approved design becomes authoritative"],
  ["5", "Build", "Branch-safe implementation in parallel waves"],
  ["6", "Validate", "Independent visual, functional, SEO and security QA"],
  ["7", "Repair", "Smallest-delta repair, bounded retries"],
  ["8", "Grow", "SEO / AEO / GEO + search presence"],
  ["9", "Receipt", "SHA, deployment, validation and rollback pointer"],
];

const ROLES = [
  "Apex / Agent Zero",
  "Research Scout",
  "Brand Guardian",
  "Visual Systems Lead",
  "Site Factory Manager",
  "Frontend Principal",
  "Backend Principal",
  "Growth Operator",
  "Xtreme Fault Line",
  "Repair Agent",
];

function triage(count) {
  const n = Number(count || 1);
  if (n <= 1) return ["SINGLE", 1, 1];
  if (n <= 25) return ["SMALL", 3, 10];
  if (n <= 250) return ["FLEET", 5, 25];
  if (n <= 2500) return ["MASS", 8, 50];
  return ["MEGA", 12, 100];
}

export default function SwarmNexusFactory({ form, setForm }) {
  const [band, recommendedConcurrency, recommendedWave] = useMemo(() => triage(form.batch_size), [form.batch_size]);
  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const applyRecommended = () => {
    setForm(f => ({
      ...f,
      swarm_enabled: true,
      swarm_concurrency: recommendedConcurrency,
      wave_size: recommendedWave,
      execution_mode: f.execution_mode || "shadow",
      source_truth_version: f.source_truth_version || "Strategic_Minds_Universal_Client_Packet_v1.0",
    }));
  };

  return (
    <section className="xa-card p-5 border-[#004CE6]/30 bg-[#F8FBFF]">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-[#0B0B0B] flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-heading font-black text-lg text-black">Swarm Nexus Factory Engine</h2>
              <span className="text-[10px] font-black px-2 py-1 rounded-full bg-[#E6F0FF] text-[#0046FF]">{band}</span>
            </div>
            <p className="text-xs text-black/60 mt-0.5">Apex-governed parallel execution for high-volume website production.</p>
          </div>
        </div>
        <button onClick={applyRecommended} className="xa-btn-outline text-xs px-3 py-2 shrink-0">
          Auto size
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-3">
          <div className="text-[10px] font-bold text-black/45 uppercase tracking-wide">Sites</div>
          <div className="text-xl font-black text-black mt-1">{form.batch_size || 0}</div>
        </div>
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-3">
          <div className="text-[10px] font-bold text-black/45 uppercase tracking-wide">Concurrency</div>
          <div className="text-xl font-black text-black mt-1">{form.swarm_concurrency || recommendedConcurrency}</div>
        </div>
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-3">
          <div className="text-[10px] font-bold text-black/45 uppercase tracking-wide">Wave</div>
          <div className="text-xl font-black text-black mt-1">{form.wave_size || recommendedWave}</div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs font-bold text-black/65 block mb-1.5">Execution mode</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              ["shadow", "Shadow", "Compile + validate. No production publish."],
              ["execute", "Execute", "Promote approved work through protected gates."],
            ].map(([id, label, desc]) => (
              <button key={id} onClick={() => set("execution_mode", id)}
                className={`rounded-xl border p-3 text-left ${(form.execution_mode || "shadow") === id ? "border-[#004CE6] bg-[#E6F0FF]/60" : "border-[#E5E7EB] bg-white"}`}>
                <div className="text-sm font-black text-black">{label}</div>
                <div className="text-[10px] leading-4 text-black/55 mt-1">{desc}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-bold text-black/65 block mb-1.5">Concurrency</label>
            <input type="number" min="1" max="20" value={form.swarm_concurrency || recommendedConcurrency}
              onChange={e => set("swarm_concurrency", Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
              className="xa-input" />
          </div>
          <div>
            <label className="text-xs font-bold text-black/65 block mb-1.5">Wave size</label>
            <input type="number" min="1" max="250" value={form.wave_size || recommendedWave}
              onChange={e => set("wave_size", Math.max(1, Math.min(250, Number(e.target.value) || 1)))}
              className="xa-input" />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-bold text-black/65 block mb-1.5">Source-truth version</label>
            <input value={form.source_truth_version || "Strategic_Minds_Universal_Client_Packet_v1.0"}
              onChange={e => set("source_truth_version", e.target.value)}
              className="xa-input text-xs" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#E5E7EB] bg-white p-3 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Workflow className="w-4 h-4 text-[#0046FF]" />
          <div className="text-xs font-black text-black">Canonical factory flow</div>
        </div>
        <div className="grid sm:grid-cols-3 gap-1.5">
          {STAGES.map(([n, name, desc]) => (
            <div key={name} className="rounded-lg bg-[#FAFAFA] border border-[#EEEEEE] p-2.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-black text-white text-[10px] font-black grid place-items-center">{n}</span>
                <span className="text-[11px] font-black text-black">{name}</span>
              </div>
              <div className="text-[9px] leading-4 text-black/50 mt-1.5">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[#E5E7EB] bg-white p-3">
        <div className="flex items-center gap-2 mb-2">
          <Layers3 className="w-4 h-4 text-[#0046FF]" />
          <div className="text-xs font-black text-black">Persistent specialist fleet</div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ROLES.map(role => (
            <span key={role} className="px-2 py-1 rounded-full bg-[#F3F4F6] text-[10px] font-bold text-black">{role}</span>
          ))}
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-[#F8FAFC] p-2.5">
          <ShieldCheck className="w-4 h-4 text-[#16A34A] mt-0.5 shrink-0" />
          <p className="text-[10px] leading-4 text-black/60">
            One commander, one queue, one receipt model. Swarm Nexus does not create a competing state machine. It adds triage, parallel wave execution, checkpointing and synthesis to the existing BatchOperation + AgentTask factory.
          </p>
        </div>
      </div>
    </section>
  );
}
