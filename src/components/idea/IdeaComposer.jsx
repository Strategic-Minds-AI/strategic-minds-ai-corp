import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const CATEGORIES = ['feature', 'refactor', 'bugfix', 'research', 'infrastructure', 'content', 'growth', 'security'];

export default function IdeaComposer({ onCreate, onClose }) {
  const [form, setForm] = useState({ title: '', description: '', category: 'feature', impact_score: 6, effort_score: 4, risk_score: 3 });
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!form.title.trim() || !form.description.trim()) return;
    setBusy(true);
    try {
      await onCreate({ ...form, source: 'manual' });
    } finally { setBusy(false); }
  };

  return (
    <div className="rounded-lg border border-primary/30 bg-card p-4 space-y-3">
      <Input placeholder="Idea title..." value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
      <Textarea placeholder="Describe the idea, what it improves, and why it matters..." rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
      <div className="flex flex-wrap gap-3 items-center">
        <select className="bg-secondary text-foreground text-xs rounded-md px-2 py-1.5 border border-border capitalize" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {['impact_score', 'effort_score', 'risk_score'].map(field => (
          <label key={field} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {field.split('_')[0]}:
            <input type="range" min="1" max="10" value={form[field]} onChange={e => setForm({ ...form, [field]: Number(e.target.value) })} className="w-16 accent-primary" />
            <span className="font-mono w-4 text-center">{form[field]}</span>
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={submit} disabled={busy || !form.title.trim() || !form.description.trim()}>Propose Idea</Button>
        <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}