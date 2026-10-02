import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Loader2, Mail, CheckCircle2, XCircle, Send, Eye } from "lucide-react";

export default function OutreachConsole() {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.entities.OutreachDraft.filter({}, { sort: "-created_date", limit: 50 });
      setDrafts(res.items || []);
      if (res.items?.length > 0 && !selectedDraft) setSelectedDraft(res.items[0]);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }, [selectedDraft]);

  useEffect(() => { load(); }, [load]);

  const approve = async (draft) => {
    try {
      await base44.entities.OutreachDraft.update(draft.id, { approval_status: "approved", approved_at: new Date().toISOString() });
      await load();
    } catch (e) { setError(e.message); }
  };

  const reject = async (draft) => {
    try {
      await base44.entities.OutreachDraft.update(draft.id, { approval_status: "rejected" });
      await load();
    } catch (e) { setError(e.message); }
  };

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="sticky top-0 z-10 flex min-h-16 items-center gap-3 border-b border-border bg-background px-5 py-2 pl-16">
        <button onClick={() => navigate("/diagnostic")} className="rounded-lg p-2 text-foreground hover:bg-muted"><ArrowLeft size={20} /></button>
        <Mail size={18} className="text-primary" />
        <span className="text-sm font-semibold text-foreground">Outreach Drafts</span>
        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-600">Draft Only</span>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : drafts.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            <Mail className="mx-auto h-8 w-8 text-muted-foreground/30" />
            <p className="mt-2 text-sm text-muted-foreground">No outreach drafts. Run a diagnostic and generate outreach from the audit detail page.</p>
            <button onClick={() => navigate("/diagnostic")} className="xa-btn-primary mt-4">Go to Diagnostic Console</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Draft list */}
            <div className="lg:col-span-1">
              <h2 className="mb-3 text-sm font-semibold text-foreground">Drafts ({drafts.length})</h2>
              <div className="space-y-2">
                {drafts.map(d => (
                  <button key={d.id} onClick={() => setSelectedDraft(d)} className={`flex w-full flex-col gap-1 rounded-lg border p-3 text-left transition-all ${selectedDraft?.id === d.id ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:shadow-sm"}`}>
                    <p className="truncate text-sm font-bold text-foreground">{d.company_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{d.subject}</p>
                    <span className={`mt-1 w-fit rounded-full px-2 py-0.5 text-[10px] font-bold ${d.approval_status === "approved" ? "bg-green-500/10 text-green-600" : d.approval_status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-600"}`}>{d.approval_status}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Draft detail */}
            <div className="lg:col-span-2">
              {selectedDraft && (
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <div className="mb-4 border-b border-border pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">To</p>
                        <p className="text-sm font-bold text-foreground">{selectedDraft.company_name}</p>
                        <p className="text-xs text-muted-foreground">{selectedDraft.company_url}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${selectedDraft.approval_status === "approved" ? "bg-green-500/10 text-green-600" : selectedDraft.approval_status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-600"}`}>{selectedDraft.approval_status}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Subject</p>
                    <p className="text-sm font-bold text-foreground">{selectedDraft.subject}</p>
                  </div>

                  {selectedDraft.value_summary && (
                    <div className="mb-4 rounded-lg bg-primary/5 p-3">
                      <p className="text-[10px] font-bold uppercase text-primary">Value Summary</p>
                      <p className="text-xs text-foreground">{selectedDraft.value_summary}</p>
                    </div>
                  )}

                  <div className="mb-4">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Body</p>
                    <pre className="mt-1 whitespace-pre-wrap rounded-lg bg-muted/30 p-4 text-xs text-foreground font-mono leading-relaxed">{selectedDraft.body}</pre>
                  </div>

                  {selectedDraft.approval_status === "draft" && (
                    <div className="flex gap-3">
                      <button onClick={() => approve(selectedDraft)} className="xa-btn-primary"><CheckCircle2 className="w-4 h-4" /> Approve</button>
                      <button onClick={() => reject(selectedDraft)} className="xa-btn-outline"><XCircle className="w-4 h-4" /> Reject</button>
                    </div>
                  )}

                  <div className="mt-4 rounded-lg bg-amber-500/5 p-3">
                    <p className="text-[10px] font-bold text-amber-600">DRAFT ONLY — Outreach is draft-only by design. Approved drafts require a connected email adapter to send. No emails are sent without explicit human approval.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {error && <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      </div>
    </div>
  );
}