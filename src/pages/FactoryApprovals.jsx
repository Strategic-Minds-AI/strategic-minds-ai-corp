import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Shield, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function FactoryApprovals() {
  const navigate = useNavigate();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(null);
  const [filter, setFilter] = useState('pending');

  const loadApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('factoryOS', { action: 'listApprovals', status: filter !== 'all' ? filter : undefined });
      setApprovals(res.data?.approvals || []);
    } catch (e) { /* silent */ }
    setLoading(false);
  }, [filter]);

  useEffect(() => { loadApprovals(); }, [loadApprovals]);

  const resolve = async (id, status) => {
    setResolving(id);
    try {
      await base44.functions.invoke('factoryOS', { action: 'resolveApproval', id, status, resolution_note: '' });
      await loadApprovals();
    } catch (e) { /* silent */ }
    setResolving(null);
  };

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="sticky top-0 z-10 flex min-h-16 items-center gap-3 border-b border-border bg-background px-5 py-2 pl-16">
        <button onClick={() => navigate('/factory')} className="rounded-lg p-2 text-foreground hover:bg-muted"><ArrowLeft size={20} /></button>
        <Shield size={18} className="text-primary" />
        <span className="text-sm font-semibold text-foreground">Approvals</span>
        <select className="ml-auto rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-primary" /></div>
        ) : approvals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <Shield size={32} className="mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No {filter !== 'all' ? filter : ''} approvals.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {approvals.map((a) => (
              <div key={a.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <RiskBadge risk={a.risk_class} />
                  <span className="text-sm font-semibold text-foreground">{a.action_key}</span>
                  <ApprovalStatusBadge status={a.status} />
                  <span className="ml-auto font-mono text-[10px] text-muted-foreground">{a.approval_id}</span>
                </div>
                {a.step_key && <p className="mt-2 text-xs text-muted-foreground">Step: <span className="font-mono">{a.step_key}</span></p>}
                {a.reason && <p className="mt-1 text-xs text-muted-foreground">{a.reason}</p>}
                {a.request && a.request !== '{}' && (
                  <pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-muted p-2 text-xs text-muted-foreground">{a.request}</pre>
                )}
                {a.status === 'pending' && (
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => resolve(a.id, 'approved')} disabled={resolving === a.id} className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-xs font-medium text-white hover:opacity-90 disabled:opacity-40">
                      {resolving === a.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />} Approve
                    </button>
                    <button onClick={() => resolve(a.id, 'rejected')} disabled={resolving === a.id} className="flex items-center gap-1.5 rounded-lg border border-destructive px-4 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-40">
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RiskBadge({ risk }) {
  const styles = { READ: 'bg-blue-500/10 text-blue-600', DRAFT: 'bg-muted text-muted-foreground', BRANCH_WRITE: 'bg-amber-500/10 text-amber-600', PROTECTED: 'bg-destructive/10 text-destructive' };
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${styles[risk] || styles.DRAFT}`}>{risk}</span>;
}

function ApprovalStatusBadge({ status }) {
  const styles = { pending: 'bg-amber-500/10 text-amber-600', approved: 'bg-green-500/10 text-green-600', rejected: 'bg-destructive/10 text-destructive', expired: 'bg-muted text-muted-foreground', cancelled: 'bg-muted text-muted-foreground' };
  const icons = { pending: <Clock size={10} />, approved: <CheckCircle size={10} />, rejected: <XCircle size={10} /> };
  return <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${styles[status] || styles.pending}`}>{icons[status]}{status}</span>;
}