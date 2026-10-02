import React, { useState } from "react";
import { Sparkles, Wand2, Loader2, Download, ImagePlus } from "lucide-react";
import { base44 } from "@/api/base44Client";

const LOGO_STYLES = [
  "Modern minimalist geometric mark",
  "Bold gradient tech emblem",
  "Clean monogram lettermark",
  "Abstract organic shape",
  "Sharp angular fintech mark",
];

export default function StudioGenerators({ config, onChange }) {
  const [logoStyle, setLogoStyle] = useState(LOGO_STYLES[0]);
  const [logoUrl, setLogoUrl] = useState(config.logoImage || "");
  const [busyLogo, setBusyLogo] = useState(false);
  const [busyViral, setBusyViral] = useState(false);
  const [viral, setViral] = useState([]);
  const [err, setErr] = useState("");

  const genLogo = async () => {
    setErr("");
    setBusyLogo(true);
    try {
      const res = await base44.functions.invoke("generateLogo", {
        brandName: config.logoText || "Strategic Minds",
        primaryColor: config.primaryColor,
        secondaryColor: config.secondaryColor,
        style: logoStyle,
      });
      setLogoUrl(res.data.url);
    } catch (e) {
      setErr(e?.message || "Logo generation not configured");
    } finally {
      setBusyLogo(false);
    }
  };

  const genViral = async () => {
    setErr("");
    setBusyViral(true);
    try {
      const res = await base44.functions.invoke("generateViralPresets", { count: 6 });
      setViral(res.data.presets || []);
    } catch (e) {
      setErr(e?.message || "Preset generation not configured");
    } finally {
      setBusyViral(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 pt-4 mt-4 border-t border-border">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5" />AI Generators
      </div>

      <div>
        <div className="text-xs font-bold mb-1.5">Logo generator</div>
        <select value={logoStyle} onChange={(e) => setLogoStyle(e.target.value)} className="h-9 px-2 mb-2 w-full rounded-lg border border-input bg-background text-sm">
          {LOGO_STYLES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <button onClick={genLogo} disabled={busyLogo} className="xa-btn-primary text-xs" style={{ padding: "8px 12px" }}>
            {busyLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}Generate
          </button>
          {logoUrl && (
            <a href={logoUrl} download="logo.png" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-[#0d2f96]">
              <Download className="w-3.5 h-3.5" />Download
            </a>
          )}
        </div>
        {logoUrl && (
          <div className="mt-2 flex items-center gap-2">
            <img src={logoUrl} alt="Generated logo" className="h-12 w-12 rounded-lg border border-border bg-background p-1 object-contain" />
            <button onClick={() => onChange({ ...config, logoImage: logoUrl })} className="inline-flex items-center gap-1 text-xs font-semibold text-[#0d2f96]">
              <ImagePlus className="w-3.5 h-3.5" />{config.logoImage === logoUrl ? "In previews" : "Use in previews"}
            </button>
          </div>
        )}
      </div>

      <div>
        <div className="text-xs font-bold mb-1.5">Viral preset generator</div>
        <button onClick={genViral} disabled={busyViral} className="xa-btn-primary text-xs" style={{ padding: "8px 12px" }}>
          {busyViral ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}Generate trending colors
        </button>
        {viral.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {viral.map((p) => (
              <button key={p.name} onClick={() => onChange({ ...config, primaryColor: p.primary, secondaryColor: p.secondary })} className="inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1.5 rounded-lg border border-input hover:border-[#0059ff] text-xs font-semibold" title={p.name}>
                <span className="flex">
                  <span className="w-3.5 h-3.5 rounded-full" style={{ background: p.primary }} />
                  <span className="w-2.5 h-2.5 rounded-full -ml-1.5 mt-0.5" style={{ background: p.secondary }} />
                </span>
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {err && <div className="text-xs text-red-600">{err}</div>}
    </div>
  );
}