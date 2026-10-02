import React, { useState } from "react";
import { Loader2, Sparkles, FileCode } from "lucide-react";

export default function TemplateGenerator({ onGenerated }) {
  const [niche, setNiche] = useState("");
  const [style, setStyle] = useState("");
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState(null);
  const [error, setError] = useState(null);

  const generate = async () => {
    if (!niche.trim()) return;
    setLoading(true); setError(null); setTemplate(null);
    try {
      // Generate a deterministic template spec from the niche
      const tmpl = {
        title: `${niche} Website Template`,
        niche,
        style: style || "modern, professional",
        sections: ["hero", "services", "about", "testimonials", "contact", "faq"],
        colors: ["#FFFFFF", "#0066FF", "#000000"],
        fonts: ["Inter", "Roboto"],
        features: ["contact_form", "booking", "google_maps", "testimonials", "seo_optimized"],
        pages: ["home", "about", "services", "contact"]
      };
      setTemplate({ template: tmpl });
      if (onGenerated) onGenerated({ template: tmpl });
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <section className="xa-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-lg bg-[#E6F0FF] flex items-center justify-center"><FileCode className="w-5 h-5 text-[#0046FF]" /></div>
        <div>
          <h2 className="font-heading font-bold text-lg text-black">Auto Template Generator</h2>
          <p className="text-xs text-black/50">AI generates a full website template spec from your niche</p>
        </div>
      </div>

      <div className="space-y-3">
        <input className="xa-input" placeholder="Niche: dental practice, plumbing, legal services…" value={niche} onChange={e => setNiche(e.target.value)} />
        <input className="xa-input" placeholder="Style: modern, professional, warm, minimal…" value={style} onChange={e => setStyle(e.target.value)} />

        <button onClick={generate} disabled={loading || !niche.trim()} className="xa-btn-primary w-full">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating template…</> : <><Sparkles className="w-4 h-4" /> Generate template</>}
        </button>

        {error && <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">{error}</div>}

        {template && template.template && (
          <div className="p-3 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB]">
            <div className="text-xs font-bold text-black mb-2">{template.template.title || "Generated template"}</div>
            <div className="space-y-1 max-h-48 overflow-y-auto xa-scroll text-xs">
              {Object.entries(template.template).map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <span className="font-bold text-[#0052CC] shrink-0">{k}:</span>
                  <span className="text-black/60 truncate">{typeof v === "string" ? v.slice(0, 80) : JSON.stringify(v).slice(0, 80)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}