import React, { useState, useMemo, useEffect } from "react";
import { LayoutTemplate, Search, Smartphone, Monitor, Workflow } from "lucide-react";
import { PREVIEW_STYLES } from "@/lib/gallery/previewStyles.js";
import { GALLERY_FAMILIES, familyFor } from "@/lib/gallery/previewRenderer.js";
import { loadConfig, saveConfig, themeToCssVars, DEFAULT_CONFIG, loadFont } from "@/lib/gallery/studioConfig.js";
import TemplatePreview from "@/components/gallery/TemplatePreview.jsx";
import TemplateDetailModal from "@/components/gallery/TemplateDetailModal.jsx";
import StudioPanel from "@/components/gallery/StudioPanel.jsx";

const TABS = [
  { key: "all", label: "All", icon: LayoutTemplate },
  { key: "desktop", label: "Desktop", icon: Monitor },
  { key: "mobile", label: "Mobile", icon: Smartphone },
  { key: "recipes", label: "Recipes", icon: Workflow },
];

export default function VisualGallery() {
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [config, setConfig] = useState(() => loadConfig());

  useEffect(() => { saveConfig(config); }, [config]);
  useEffect(() => { loadFont(config.fontFamily); }, [config.fontFamily]);

  const themeVars = useMemo(() => themeToCssVars(config), [config]);

  const items = useMemo(() => {
    const all = GALLERY_FAMILIES.flatMap((f) => f.items.map((it) => ({ ...it, _platform: familyFor(it) })));
    return all.filter((it) => {
      if (tab !== "all" && it._platform !== tab) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        String(it.name).toLowerCase().includes(q) ||
        String(it.id).toLowerCase().includes(q) ||
        (it.best_for || []).some((b) => b.toLowerCase().includes(q)) ||
        (it.domain || "").toLowerCase().includes(q)
      );
    });
  }, [tab, query]);

  const counts = useMemo(() => {
    const c = { all: 0, desktop: 0, mobile: 0, recipes: 0 };
    GALLERY_FAMILIES.forEach((f) => f.items.forEach((it) => { c.all++; c[familyFor(it)]++; }));
    return c;
  }, []);

  const previewW = 232;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <style>{PREVIEW_STYLES}</style>

      <div className="flex items-center gap-3 mb-1">
        <div className="xa-icon-chip"><LayoutTemplate className="w-5 h-5" /></div>
        <div>
          <h1 className="text-xl font-black font-heading">Visual Template Gallery</h1>
          <p className="text-sm text-muted-foreground">Live rendered previews of every desktop, mobile, and recipe template — fully rethemable.</p>
        </div>
      </div>

      <div className="mt-5">
        <StudioPanel config={config} onChange={setConfig} onReset={() => setConfig({ ...DEFAULT_CONFIG })} />
      </div>

      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {TABS.map((t) => {
            const Icon = t.icon;
            const on = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${on ? "bg-[#0059ff] text-white" : "border border-input text-muted-foreground hover:text-foreground hover:bg-muted"}`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${on ? "bg-white/25" : "bg-muted"}`}>{counts[t.key]}</span>
              </button>
            );
          })}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates…"
            className="pl-8 pr-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring w-56"
          />
        </div>
      </div>

      <div style={themeVars}>
        {items.length === 0 ? (
          <div className="xa-card xa-card-subtle p-12 text-center">
            <div className="text-sm font-semibold">No templates match</div>
            <div className="text-xs text-muted-foreground mt-1">Try a different tab or search term.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((it) => (
              <button
                key={it._platform + "-" + it.id}
                onClick={() => setSelected(it)}
                className="xa-card overflow-hidden text-left group transition-shadow hover:shadow-lg flex flex-col"
              >
                <div className="flex items-center justify-center bg-muted/40 py-5 overflow-hidden">
                  <div className="origin-top transition-transform group-hover:scale-[1.02]">
                    <TemplatePreview template={it} platform={it._platform} displayW={previewW} config={config} />
                  </div>
                </div>
                <div className="p-4 border-t border-border">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold font-heading truncate">{it.name}</h3>
                    <span className="xa-pill-badge shrink-0" style={{ fontSize: 9 }}>{it._platform}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                    {it.layout_rule || it.canonical_flow || (it.best_for || []).join(" · ")}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2.5 text-[11px] font-semibold text-[#0d2f96]">
                    View live preview
                    <span className="transition-transform group-hover:translate-x-0.5">→</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <TemplateDetailModal template={selected} config={config} themeVars={themeVars} onChange={setConfig} onClose={() => setSelected(null)} />
    </div>
  );
}