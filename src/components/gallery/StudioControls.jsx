import React from "react";
import { Sun, Moon } from "lucide-react";
import { PRESETS, FONT_OPTIONS } from "@/lib/gallery/studioConfig.js";

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1 min-w-0">
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

const inputCls = "h-9 px-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring w-full";

export default function StudioControls({ config, onChange }) {
  const set = (patch) => onChange({ ...config, ...patch });
  const textColor = config.fontColor || (config.themeMode === "dark" ? "#f8fafc" : "#14213d");

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <Field label="Primary">
          <input type="color" value={config.primaryColor} onChange={(e) => set({ primaryColor: e.target.value })} className="w-full h-9 rounded-lg border border-input cursor-pointer bg-background" />
        </Field>
        <Field label="Accent">
          <input type="color" value={config.secondaryColor} onChange={(e) => set({ secondaryColor: e.target.value })} className="w-full h-9 rounded-lg border border-input cursor-pointer bg-background" />
        </Field>
        <Field label={<span className="flex items-center justify-between gap-1"><span>Font color</span>{config.fontColor ? <button type="button" onClick={() => set({ fontColor: "" })} className="text-[9px] font-bold text-[#0d2f96] hover:underline">Auto</button> : null}</span>}>
          <input type="color" value={textColor} onChange={(e) => set({ fontColor: e.target.value })} className="w-full h-9 rounded-lg border border-input cursor-pointer bg-background" />
        </Field>
      </div>

      <Field label="Font family (top 30)">
        <select value={config.fontFamily} onChange={(e) => set({ fontFamily: e.target.value })} className={inputCls} style={{ fontFamily: `'${config.fontFamily}', sans-serif` }}>
          {FONT_OPTIONS.map((f) => (
            <option key={f} value={f} style={{ fontFamily: `'${f}', sans-serif` }}>{f}</option>
          ))}
        </select>
      </Field>

      <Field label={`Text size · ${Math.round((config.fontScale || 1) * 100)}%`}>
        <input type="range" min={0.8} max={1.4} step={0.05} value={config.fontScale || 1} onChange={(e) => set({ fontScale: parseFloat(e.target.value) })} className="w-full accent-[#0059ff]" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Logo text"><input value={config.logoText} onChange={(e) => set({ logoText: e.target.value })} className={inputCls} /></Field>
        <Field label="Sample brand"><input value={config.brandName} onChange={(e) => set({ brandName: e.target.value })} className={inputCls} /></Field>
        <Field label="Heading"><input value={config.heading} onChange={(e) => set({ heading: e.target.value })} className={inputCls} /></Field>
        <Field label="Subtitle"><input value={config.subtitle} onChange={(e) => set({ subtitle: e.target.value })} className={inputCls} /></Field>
      </div>

      <div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Presets</div>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button key={p.name} onClick={() => set({ primaryColor: p.primary, secondaryColor: p.secondary })} className="inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1.5 rounded-lg border border-input hover:border-[#0059ff] text-xs font-semibold transition-colors" title={p.name}>
              <span className="flex">
                <span className="w-3.5 h-3.5 rounded-full" style={{ background: p.primary }} />
                <span className="w-2.5 h-2.5 rounded-full -ml-1.5 mt-0.5" style={{ background: p.secondary }} />
              </span>
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1">Mode</span>
        <button onClick={() => set({ themeMode: "light" })} className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold ${config.themeMode === "light" ? "bg-[#0059ff] text-white" : "border border-input text-muted-foreground hover:text-foreground"}`}><Sun className="w-3.5 h-3.5" />Light</button>
        <button onClick={() => set({ themeMode: "dark" })} className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold ${config.themeMode === "dark" ? "bg-[#0059ff] text-white" : "border border-input text-muted-foreground hover:text-foreground"}`}><Moon className="w-3.5 h-3.5" />Dark</button>
      </div>
    </div>
  );
}