import React from "react";
import { Palette, RotateCcw } from "lucide-react";
import StudioControls from "./StudioControls.jsx";

export default function StudioPanel({ config, onChange, onReset }) {
  return (
    <div className="xa-card p-4 mb-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="xa-icon-chip" style={{ width: 32, height: 32 }}><Palette className="w-4 h-4" /></div>
          <div>
            <div className="text-sm font-bold font-heading flex items-center gap-2">Template Studio <span className="xa-pill-badge" style={{ fontSize: 9 }}>Universal</span></div>
            <div className="text-[11px] text-muted-foreground">Recolor, rebrand, and recontent every template — live. Click any template for the full studio.</div>
          </div>
        </div>
        <button onClick={onReset} className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
          <RotateCcw className="w-3.5 h-3.5" />Reset to brand
        </button>
      </div>
      <StudioControls config={config} onChange={onChange} />
    </div>
  );
}