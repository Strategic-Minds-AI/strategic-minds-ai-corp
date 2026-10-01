import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

const AGENT_OPTIONS = [
  { value: 'orchestrator', label: 'Orchestrator' },
  { value: 'growth', label: 'Growth Operator' },
  { value: 'code', label: 'Code Architect' },
  { value: 'social', label: 'Social Strategist' },
  { value: 'sales', label: 'Sales Engine' },
  { value: 'brand', label: 'Brand Guardian' },
  { value: 'replicator', label: 'Replicator' },
  { value: 'swarm', label: 'Swarm' },
];

const TASK_TYPES = [
  { value: 'growth_audit', label: 'Growth Audit' },
  { value: 'build_system', label: 'Build System' },
  { value: 'google_connect', label: 'Google Connect' },
  { value: 'social_connect', label: 'Social Connect' },
  { value: 'content_optimize', label: 'Content Optimize' },
  { value: 'video_generate', label: 'Video Generate' },
  { value: 'general', label: 'General' },
];

export default function SandboxTaskDispatcher({ onDispatched }) {
  const [form, setForm] = useState({
    agent_name: 'orchestrator',
    task_type: 'growth_audit',
    title: '',
    description: '',
    domain: '',
    priority: 'medium',
    autonomous: true,
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const dispatch = async () => {
    if (!form.title.trim()) {
      setError('Task title is required');
      return;
    }
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await base44.functions.invoke('dispatchAgentTask', {
        action: 'create',
        ...form,
      });
      if (res.data?.error) throw new Error(res.data.error);
      setSuccess(`Task dispatched to ${form.agent_name} (ID: ${res.data?.task?.id?.slice(0, 8)}...)`);
      setForm({ ...form, title: '', description: '', domain: '' });
      if (onDispatched) onDispatched();
    } catch (e) {
      setError(e.message);
    }
    setSending(false);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Send size={15} className="text-primary" /> Dispatch Task to Sandbox
      </h3>

      {error && <div className="mb-3 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"><AlertCircle size={14}/> {error}</div>}
      {success && <div className="mb-3 flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/5 px-3 py-2 text-xs text-green-600"><CheckCircle2 size={14}/> {success}</div>}

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Agent</label>
            <select value={form.agent_name} onChange={e => setForm({ ...form, agent_name: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
              {AGENT_OPTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Task Type</label>
            <select value={form.task_type} onChange={e => setForm({ ...form, task_type: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
              {TASK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        <input className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="Task title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />

        <div className="grid grid-cols-2 gap-3">
          <input className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="Domain (optional)" value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })} />
          <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <textarea className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="Description / JSON payload (optional)" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />

        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={form.autonomous} onChange={e => setForm({ ...form, autonomous: e.target.checked })} className="rounded" />
          Autonomous (sandbox worker can execute without human approval)
        </label>

        <button onClick={dispatch} disabled={sending || !form.title.trim()} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40">
          {sending ? <Loader2 size={14} className="animate-spin"/> : <Send size={14}/>} Dispatch Task
        </button>
      </div>
    </div>
  );
}