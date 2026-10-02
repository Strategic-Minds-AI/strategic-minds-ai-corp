import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Loader2, Network, Server, Cloud, BarChart3, Mail, ShoppingCart, Headphones, Calendar, FileText, Shield, Cpu, Globe } from "lucide-react";

export default function SystemMapPage() {
  const navigate = useNavigate();
  const { auditId } = useParams();
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!auditId) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke("runBusinessAudit", { action: "getSystemMap", audit_id: auditId });
      setNodes(res.data?.nodes || []);
      setEdges(res.data?.edges || []);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }, [auditId]);

  useEffect(() => { load(); }, [load]);

  const nodeIcon = (type) => {
    const map = { website: Globe, cms: Server, cdn: Cloud, analytics: BarChart3, crm: Mail, email_marketing: Mail, advertising: BarChart3, support: Headphones, booking: Calendar, forms: FileText, framework: Cpu, hosting: Server, payment: ShoppingCart, social: Globe, other: Shield };
    return map[type] || Server;
  };

  const nodeColor = (health) => {
    if (health === 'healthy') return 'border-green-500/30 bg-green-500/5 text-green-600';
    if (health === 'warning') return 'border-amber-500/30 bg-amber-500/5 text-amber-600';
    if (health === 'critical') return 'border-destructive/30 bg-destructive/5 text-destructive';
    return 'border-border bg-card text-muted-foreground';
  };

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="sticky top-0 z-10 flex min-h-16 items-center gap-3 border-b border-border bg-background px-5 py-2 pl-16">
        <button onClick={() => navigate(-1)} className="rounded-lg p-2 text-foreground hover:bg-muted"><ArrowLeft size={20} /></button>
        <Network size={18} className="text-primary" />
        <span className="text-sm font-semibold text-foreground">System Map</span>
        <span className="text-xs text-muted-foreground">{nodes.length} systems · {edges.length} connections</span>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-primary" /></div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
        ) : nodes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <Network className="mx-auto h-8 w-8 text-muted-foreground/30" />
            <p className="mt-2 text-sm text-muted-foreground">No systems mapped yet. Run a diagnostic audit to detect the tech stack.</p>
          </div>
        ) : (
          <>
            {/* System nodes grid */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {nodes.map(n => {
                const Icon = nodeIcon(n.node_type);
                const connectedEdges = edges.filter(e => e.source_node_id === n.node_id || e.target_node_id === n.node_id);
                return (
                  <div key={n.id} className={`rounded-xl border p-4 ${nodeColor(n.health_status)}`}>
                    <div className="flex items-center gap-2">
                      <Icon size={18} />
                      <span className="text-sm font-bold text-foreground">{n.name}</span>
                    </div>
                    <p className="mt-1 text-[10px] font-bold uppercase text-muted-foreground">{n.node_type}</p>
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{connectedEdges.length} links</span>
                      {n.risk_count > 0 && <span className="text-destructive">{n.risk_count} risks</span>}
                    </div>
                    {n.owner_role && <p className="mt-1 text-[10px] text-muted-foreground">Owner: {n.owner_role}</p>}
                  </div>
                );
              })}
            </div>

            {/* Edges */}
            {edges.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-semibold text-foreground">System Relationships</h2>
                <div className="space-y-2">
                  {edges.map(e => {
                    const source = nodes.find(n => n.node_id === e.source_node_id);
                    const target = nodes.find(n => n.node_id === e.target_node_id);
                    if (!source || !target) return null;
                    return (
                      <div key={e.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-sm">
                        <span className="text-sm font-medium text-foreground">{source.name}</span>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{e.relationship.replace(/_/g, ' ')}</span>
                        <span className="text-sm font-medium text-foreground">{target.name}</span>
                        {e.description && <span className="ml-auto text-xs text-muted-foreground">{e.description}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}