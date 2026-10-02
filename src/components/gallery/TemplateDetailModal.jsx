import React, { useState } from "react";
import { X, SlidersHorizontal, FileText } from "lucide-react";
import TemplatePreview from "./TemplatePreview.jsx";
import StudioControls from "./StudioControls.jsx";
import StudioGenerators from "./StudioGenerators.jsx";
import { familyFor } from "@/lib/gallery/previewRenderer.js";

function Meta({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm text-foreground mt-0.5">{value}</div>
    </div>
  );
}

function List({ label, items }) {
  if (!items || !items.length) return null;
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-1.5 mt-1.5">
        {items.map((it) => (
          <span key={it} className="xa-pill-badge" style={{ fontSize: 10, letterSpacing: ".04em" }}>{it}</span>
        ))}
      </div>
    </div>
  );
}

export default function TemplateDetailModal({ template, config, themeVars, onChange, onClose }) {
  const [tab, setTab] = useState("customize");
  if (!template) return null;
  const platform = familyFor(template);
  const displayW = platform === "mobile" ? 280 : 620;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative xa-card w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col md:flex-row">
        <button onClick={onClose} className="absolute top-3 right-3 z-10 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground" aria-label="Close">
          <X className="w-5 h-5" />
        </button>
        <div className="flex-1 flex items-center justify-center p-6 bg-muted/40 overflow-auto" style={themeVars}>
          <TemplatePreview template={template} platform={platform} displayW={displayW} config={config} />
        </div>
        <div className="md:w-80 lg:w-96 flex flex-col border-t md:border-t-0 md:border-l border-border max-h-[92vh]">
          <div className="flex items-center gap-1 p-3 border-b border-border">
            <div className="flex-1 min-w-0 px-1">
              <div className="xa-pill-badge mb-1" style={{ fontSize: 9 }}>{platform === "recipe" ? "Experience Recipe" : platform === "mobile" ? "Mobile Archetype" : "Desktop Archetype"}</div>
              <h2 className="text-sm font-black font-heading truncate">{template.name}</h2>
            </div>
          </div>
          <div className="flex items-center gap-1 px-3 pt-2">
            <button onClick={() => setTab("customize")} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${tab === "customize" ? "bg-[#0059ff] text-white" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}><SlidersHorizontal className="w-3.5 h-3.5" />Customize</button>
            <button onClick={() => setTab("spec")} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${tab === "spec" ? "bg-[#0059ff] text-white" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}><FileText className="w-3.5 h-3.5" />Spec</button>
          </div>
          <div className="flex-1 overflow-y-auto xa-scroll p-4">
            {tab === "customize" ? (
              <div className="flex flex-col gap-4">
                <StudioControls config={config} onChange={onChange} />
                <StudioGenerators config={config} onChange={onChange} />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="text-xs text-muted-foreground font-mono">{template.id}</div>
                <Meta label="Layout rule" value={template.layout_rule} />
                {platform === "mobile" && <Meta label="Navigation" value={template.navigation_rule} />}
                {platform === "recipe" && <Meta label="Canonical flow" value={template.canonical_flow} />}
                {platform === "recipe" && <Meta label="Domain" value={template.domain} />}
                <List label="Best for" items={template.best_for} />
                <List label="Required states" items={template.required_states || template.states_required} />
                {platform === "mobile" && <List label="Required components" items={template.required_components} />}
                {template.guardrail && <Meta label="Guardrail" value={template.guardrail} />}
                {template.mobile_transform && <Meta label="Mobile transform" value={template.mobile_transform} />}
                {template.responsive_behavior && <Meta label="Responsive behavior" value={template.responsive_behavior} />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}