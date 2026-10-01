import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, Loader2, Globe, ShieldCheck, AlertTriangle, ExternalLink } from "lucide-react";

const STATUS_STYLE = {
  onboarding: "bg-[#FFF7B3] text-[#8A7300]",
  verifying: "bg-blue-50 text-blue-600",
  verified: "bg-emerald-50 text-emerald-600",
  active: "bg-emerald-50 text-emerald-600",
  issues: "bg-red-50 text-red-600",
  paused: "bg-gray-100 text-gray-500"
};

export default function DomainRegistry() {
  const navigate = useNavigate();
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newDomain, setNewDomain] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.entities.Domain.filter({}, { sort: "-created_date", limit: 50 });
      setDomains(res.items || []);
    } catch (e) { setDomains([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addDomain = async () => {
    const d = newDomain.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!d || adding) return;
    setAdding(true);
    try {
      await base44.entities.Domain.create({ domain: d, canonical_url: `https://${d}`, status: "onboarding" });
      setNewDomain("");
      await load();
      navigate(`/agents/growth_operator`);
    } catch (e) {}
    setAdding(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-[#E5E7EB]">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <span className="xa-pill-badge">GROWTH OPERATOR</span>
            <h1 className="font-heading font-black text-3xl text-black mt-2">Domain Registry</h1>
            <p className="text-black/55 mt-1">Every URL the Growth Operator manages end to end.</p>
          </div>
          <button onClick={() => navigate("/agents")} className="xa-btn-outline">← Command Center</button>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-8">
        <div className="xa-card p-6 mb-8">
          <h2 className="font-heading font-bold text-lg text-black mb-1">Add a domain</h2>
          <p className="text-sm text-black/55 mb-4">Drop a URL. The Growth Operator takes it from intake through Google connection, sitemaps, indexing, competitors and monitoring.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addDomain()}
              placeholder="example.com"
              className="xa-input sm:max-w-xs"
              disabled={adding}
            />
            <button onClick={addDomain} disabled={adding || !newDomain.trim()} className="xa-btn-primary">
              {adding ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding…</> : <><Plus className="w-4 h-4" /> Add domain</>}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#CCBB00]" /></div>
        ) : domains.length === 0 ? (
          <div className="xa-card p-10 text-center">
            <Globe className="w-8 h-8 mx-auto text-black/20" />
            <p className="text-black/50 mt-2 text-sm">No domains yet. Add one above to start the growth pipeline.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {domains.map((d) => {
              const status = d.status || "active";
              const style = STATUS_STYLE[status] || STATUS_STYLE.active;
              return (
                <div key={d.id} className="xa-card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#FFF7B3] flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5 text-[#8A7300]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-black text-sm truncate">{d.domain}</div>
                    <div className="text-xs text-black/45 truncate">{d.canonical_url || `https://${d.domain}`}</div>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${style}`}>{status}</span>
                  <button onClick={() => navigate("/mission")} className="xa-btn-outline text-xs px-3 py-2 shrink-0">Run mission</button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}