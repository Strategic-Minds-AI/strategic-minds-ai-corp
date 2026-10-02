import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Loader2, Activity, Plus, Play, AlertTriangle, CheckCircle2, Bell } from "lucide-react";

export default function MonitoringConsole() {
  const navigate = useNavigate();
  const [rules, setRules] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newRule, setNewRule] = useState({ name: "", check_url: "", rule_type: "uptime", cadence_seconds: 300 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rulesRes, eventsRes] = await Promise.all([
        base44.entities.MonitoringRule.filter({}, { sort: "-created_date", limit: 50 }),
        base44.entities.MonitoringEvent.filter({}, { sort: "-created_date", limit: 30 })
      ]);
      setRules(rulesRes.items || []);
      setEvents(eventsRes.items || []);
    } catch (e) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const runChecks = async () => {
    setRunning(true); setRunResult(null);
    try {
      const res = await base44.functions.invoke("runBusinessAudit", { action: "runMonitoring" });
      setRunResult(res.data);
      await load();
    } catch (e) { setRunResult({ error: e.message }); }
    setRunning(false);
  };

  const createRule = async () => {
    if (!newRule.name || !newRule.check_url) return;
    try {
      const ruleId = `mon_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await base44.entities.MonitoringRule.create({
        rule_id: ruleId,
        name: newRule.name,
        rule_type: newRule.rule_type,
        check_url: newRule.check_url,
        cadence_seconds: newRule.cadence_seconds,
        active: true,
        configuration: JSON.stringify({ url: newRule.check_url, type: newRule.rule_type })
      });
      setNewRule({ name: "", check_url: "", rule_type: "uptime", cadence_seconds: 300 });
      setShowForm(false);
      await load();
    } catch (e) {}
  };

  const toggleRule = async (rule) => {
    try { await base44.entities.MonitoringRule.update(rule.id, { active: !rule.active }); await load(); } catch (e) {}
  };

  const ackEvent = async (ev) => {
    try { await base44.entities.MonitoringEvent.update(ev.id, { acknowledged: true }); await load(); } catch (e) {}
  };

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="sticky top-0 z-10 flex min-h-16 items-center gap-3 border-b border-border bg-background px-5 py-2 pl-16">
        <button onClick={() => navigate("/diagnostic")} className="rounded-lg p-2 text-foreground hover:bg-muted"><ArrowLeft size={20} /></button>
        <Activity size={18} className="text-primary" />
        <span className="text-sm font-semibold text-foreground">Monitoring Console</span>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <>
            {/* Run checks */}
            <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Run Monitoring Checks</h2>
                  <p className="text-xs text-muted-foreground">Checks all active rules and generates events when status changes.</p>
                </div>
                <button onClick={runChecks} disabled={running} className="xa-btn-primary">
                  {running ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking…</> : <><Play className="w-4 h-4" /> Run now</>}
                </button>
              </div>
              {runResult && !runResult.error && (
                <div className="mt-3 rounded-lg bg-primary/5 p-3 text-xs">
                  <span className="font-bold text-foreground">{runResult.rules_checked}</span> rules checked · <span className="font-bold text-foreground">{runResult.events_generated}</span> events generated
                </div>
              )}
              {runResult?.error && <div className="mt-3 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">{runResult.error}</div>}
            </div>

            {/* Rules */}
            <div className="mb-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Monitoring Rules ({rules.length})</h2>
                <button onClick={() => setShowForm(!showForm)} className="xa-btn-outline text-xs"><Plus className="w-3 h-3" /> Add rule</button>
              </div>
              {showForm && (
                <div className="mb-3 rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input value={newRule.name} onChange={e => setNewRule({ ...newRule, name: e.target.value })} placeholder="Rule name" className="xa-input" />
                    <input value={newRule.check_url} onChange={e => setNewRule({ ...newRule, check_url: e.target.value })} placeholder="URL to monitor" className="xa-input" />
                    <select value={newRule.rule_type} onChange={e => setNewRule({ ...newRule, rule_type: e.target.value })} className="xa-input">
                      <option value="uptime">Uptime</option>
                      <option value="ssl">SSL Certificate</option>
                      <option value="page_speed">Page Speed</option>
                      <option value="security">Security Headers</option>
                      <option value="seo_ranking">SEO Ranking</option>
                      <option value="broken_link">Broken Links</option>
                    </select>
                    <button onClick={createRule} className="xa-btn-primary">Create rule</button>
                  </div>
                </div>
              )}
              {rules.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-8 text-center">
                  <Activity className="mx-auto h-8 w-8 text-muted-foreground/30" />
                  <p className="mt-2 text-sm text-muted-foreground">No monitoring rules. Add one to start tracking.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {rules.map(r => (
                    <div key={r.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-sm">
                      <div className={`h-3 w-3 shrink-0 rounded-full ${r.last_status === "pass" ? "bg-green-500" : r.last_status === "fail" ? "bg-destructive" : r.last_status === "warn" ? "bg-amber-500" : "bg-muted"}`} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-foreground">{r.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{r.check_url} · {r.rule_type} · every {r.cadence_seconds}s</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">{r.last_status || "unknown"}</span>
                      <button onClick={() => toggleRule(r)} className={`shrink-0 rounded px-2 py-1 text-[10px] font-bold ${r.active ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}`}>{r.active ? "Active" : "Paused"}</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Events */}
            <div>
              <h2 className="mb-3 text-sm font-semibold text-foreground">Recent Events</h2>
              {events.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-8 text-center">
                  <Bell className="mx-auto h-8 w-8 text-muted-foreground/30" />
                  <p className="mt-2 text-sm text-muted-foreground">No events yet. Run monitoring checks to generate events.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {events.map(ev => (
                    <div key={ev.id} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 shadow-sm">
                      {ev.severity === "critical" ? <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" /> : ev.event_type === "recovery" ? <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" /> : <Bell className="h-5 w-5 shrink-0 text-blue-600" />}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-foreground">{ev.message}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(ev.detected_at).toLocaleString()} · {ev.event_type}</p>
                      </div>
                      {!ev.acknowledged && <button onClick={() => ackEvent(ev)} className="shrink-0 rounded bg-muted px-2 py-1 text-[10px] font-bold text-muted-foreground hover:bg-muted/80">Ack</button>}
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