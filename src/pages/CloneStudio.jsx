import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Loader2, Globe, Download, Trash2, Plus, Copy, CheckCircle2, XCircle, Gauge, Image as ImageIcon, FileCode, Link2, Sparkles, ExternalLink } from "lucide-react";

export default function CloneStudio() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cloning, setCloning] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ target_url: "", site_name: "", industry: "", brand_name: "", brand_phone: "", brand_email: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        base44.functions.invoke("runSiteClone", { action: "listQueue", limit: 100 }),
        base44.functions.invoke("runSiteClone", { action: "dashboardStats" })
      ]);
      setItems(listRes.data?.items || []);
      setStats(statsRes.data);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const runClone = async (item) => {
    setCloning(item?.id || "new");
    setError(null);
    setPreview(null);
    try {
      const res = await base44.functions.invoke("runSiteClone", {
        action: "cloneSite",
        target_url: item?.target_url || form.target_url,
        site_name: item?.site_name || form.site_name,
        industry: item?.industry || form.industry,
        brand_name: item?.brand_name || form.brand_name,
        brand_phone: item?.brand_phone || form.brand_phone,
        brand_email: item?.brand_email || form.brand_email,
        queue_id: item?.id,
        source: item?.source || "manual"
      });
      if (res.data?.cloned_html) {
        setPreview({ ...res.data, target_url: item?.target_url || form.target_url });
      }
      await load();
    } catch (e) { setError(e.message); }
    setCloning(null);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.target_url.trim()) return;
    await runClone({ target_url: form.target_url, site_name: form.site_name, industry: form.industry, brand_name: form.brand_name, brand_phone: form.brand_phone, brand_email: form.brand_email, source: "manual" });
    setForm({ target_url: "", site_name: "", industry: "", brand_name: "", brand_phone: "", brand_email: "" });
    setShowAdd(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this clone from the queue?")) return;
    try { await base44.functions.invoke("runSiteClone", { action: "deleteItem", id }); await load(); }
    catch (e) { setError(e.message); }
  };

  const downloadHtml = (html, name) => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${(name || "clone").replace(/[^a-z0-9]/gi, "-").toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="sticky top-0 z-10 flex min-h-16 items-center gap-3 border-b border-border bg-background px-5 py-2 pl-16">
        <button onClick={() => navigate("/diagnostic")} className="rounded-lg p-2 text-foreground hover:bg-muted"><ArrowLeft size={20} /></button>
        <Copy size={18} className="text-primary" />
        <span className="text-sm font-semibold text-foreground">Site Clone Studio</span>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">Deterministic</span>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-6">
        {error && <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"><XCircle size={16} /> {error}</div>}

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-primary" /></div>
        ) : (
          <>
            {/* Stats */}
            {stats && (
              <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                <StatCard label="Total" value={stats.total || 0} icon={Copy} />
                <StatCard label="Queued" value={stats.queued || 0} icon={Plus} />
                <StatCard label="Passed" value={stats.passed || 0} icon={CheckCircle2} />
                <StatCard label="Failed" value={stats.failed || 0} icon={XCircle} />
                <StatCard label="Avg Parity" value={`${stats.avg_parity || 0}/100`} icon={Gauge} />
                <StatCard label="Images" value={stats.total_images_rehosted || 0} icon={ImageIcon} />
                <StatCard label="Pages" value={stats.total_pages_cloned || 0} icon={FileCode} />
              </div>
            )}

            {/* Add form */}
            <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
              <button onClick={() => setShowAdd(!showAdd)} className="flex w-full items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground"><Plus size={16} className="text-primary" /> Clone a New Site</h2>
                <span className="text-xs text-muted-foreground">{showAdd ? "Cancel" : "Add URL"}</span>
              </button>
              {showAdd && (
                <form onSubmit={handleAdd} className="mt-4 space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input value={form.target_url} onChange={e => setForm({ ...form, target_url: e.target.value })} placeholder="example.com" className="xa-input" required />
                    <input value={form.site_name} onChange={e => setForm({ ...form, site_name: e.target.value })} placeholder="Site name (optional)" className="xa-input" />
                    <input value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} placeholder="Industry (optional)" className="xa-input" />
                    <input value={form.brand_name} onChange={e => setForm({ ...form, brand_name: e.target.value })} placeholder="Rebrand to (optional)" className="xa-input" />
                    <input value={form.brand_phone} onChange={e => setForm({ ...form, brand_phone: e.target.value })} placeholder="Phone (optional)" className="xa-input" />
                    <input value={form.brand_email} onChange={e => setForm({ ...form, brand_email: e.target.value })} placeholder="Email (optional)" className="xa-input" />
                  </div>
                  <button type="submit" disabled={cloning === "new" || !form.target_url.trim()} className="xa-btn-primary">
                    {cloning === "new" ? <><Loader2 className="w-4 h-4 animate-spin" /> Cloning…</> : <><Sparkles className="w-4 h-4" /> Clone site</>}
                  </button>
                </form>
              )}
            </div>

            {/* Clone preview */}
            {preview && (
              <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-sm font-bold text-foreground"><CheckCircle2 className="h-5 w-5 text-green-600" /> Clone complete — {preview.target_url}</h2>
                  <div className="flex gap-2">
                    <button onClick={() => downloadHtml(preview.cloned_html, preview.target_url)} className="xa-btn-outline text-xs"><Download className="w-3 h-3" /> Download HTML</button>
                  </div>
                </div>
                <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                  <Metric label="Parity" value={`${preview.metadata?.parity_score}/100`} icon={Gauge} />
                  <Metric label="Images" value={`${preview.metadata?.images_rehosted}/${preview.metadata?.images_total}`} icon={ImageIcon} />
                  <Metric label="CSS inlined" value={preview.metadata?.css_inlined} icon={FileCode} />
                  <Metric label="Links" value={preview.metadata?.links_rewritten} icon={Link2} />
                  <Metric label="Duration" value={`${((preview.metadata?.duration_ms || 0) / 1000).toFixed(1)}s`} icon={Sparkles} />
                </div>
                {preview.truncated && <p className="mb-2 text-xs text-amber-600">Preview truncated — full clone is {preview.full_bytes?.toLocaleString()} bytes. Download for the complete file.</p>}
                <div className="overflow-hidden rounded-lg border border-border">
                  <iframe title="Clone preview" srcDoc={preview.cloned_html} className="h-[500px] w-full bg-white" sandbox="allow-same-origin" />
                </div>
              </div>
            )}

            {/* Queue */}
            <div>
              <h2 className="mb-3 text-sm font-semibold text-foreground">Clone Queue</h2>
              {items.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-10 text-center">
                  <Copy className="mx-auto h-8 w-8 text-muted-foreground/30" />
                  <p className="mt-2 text-sm text-muted-foreground">No clones yet. Add a URL above to start.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-sm">
                      <StatusBadge status={item.status} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-foreground">{item.site_name || item.target_url}</p>
                        <p className="truncate text-xs text-muted-foreground">{item.target_url}</p>
                        {item.industry && <span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{item.industry}</span>}
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        {item.parity_score > 0 && <span className="text-xs font-bold text-primary">{item.parity_score}/100</span>}
                        {item.images_rehosted > 0 && <span className="text-xs text-muted-foreground">{item.images_rehosted} imgs</span>}
                        <button onClick={() => runClone(item)} disabled={cloning === item.id} className="xa-btn-outline text-xs">
                          {cloning === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} {item.status === "passed" ? "Re-clone" : "Clone"}
                        </button>
                        {item.vercel_url && <a href={item.vercel_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary"><ExternalLink size={14} /></a>}
                        <button onClick={() => handleDelete(item.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="flex items-center gap-2"><Icon size={14} className="text-primary" /><span className="text-[10px] font-bold uppercase text-muted-foreground">{label}</span></div>
      <p className="mt-1 text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function Metric({ label, value, icon: Icon }) {
  return (
    <div className="rounded-lg border border-border bg-background p-2">
      <div className="flex items-center gap-1.5"><Icon size={12} className="text-primary" /><span className="text-[10px] font-bold uppercase text-muted-foreground">{label}</span></div>
      <p className="mt-0.5 text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    queued: "bg-muted text-muted-foreground",
    cloning: "bg-blue-500/10 text-blue-600",
    validating: "bg-amber-500/10 text-amber-600",
    passed: "bg-green-500/10 text-green-600",
    failed: "bg-destructive/10 text-destructive",
    cancelled: "bg-muted text-muted-foreground"
  };
  return <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold uppercase ${styles[status] || styles.queued}`}>{status}</span>;
}