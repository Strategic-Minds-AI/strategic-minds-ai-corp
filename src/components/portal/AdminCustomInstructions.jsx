import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function AdminCustomInstructions() {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    let mounted = true;
    base44.auth.me().then(user => { if (mounted) setValue(user.assistant_instructions || ''); })
      .catch(error => { if (mounted) setMessage(error.message || 'Could not load instructions.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);
  async function save(event) {
    event.preventDefault();
    setSaving(true); setMessage('');
    try {
      await base44.auth.updateMe({ assistant_instructions: value });
      setMessage('Instructions saved. They will apply to your next message.');
    } catch (error) { setMessage(error.message || 'Could not save instructions.'); }
    finally { setSaving(false); }
  }
  return <section aria-labelledby="instructions-heading" className="space-y-3">
    <h2 id="instructions-heading" className="mb-0 text-xl">Custom instructions</h2>
    <p className="text-sm text-muted-foreground">Tell your agency assistant how to respond. These instructions apply to future messages, not earlier answers.</p>
    {loading ? <p role="status" className="text-sm">Loading instructions…</p> : <form onSubmit={save} className="space-y-3">
      <label htmlFor="assistant-instructions" className="block text-sm font-medium text-foreground">Your instructions</label>
      <textarea id="assistant-instructions" value={value} maxLength={15000} onChange={event => { setValue(event.target.value); setMessage(''); }} rows={10} className="w-full resize-y rounded-lg border border-border bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Describe your preferred style, context and working guidelines…" />
      <div className="flex items-center justify-between gap-3"><span className="text-xs text-muted-foreground">{value.length.toLocaleString()} / 15,000 characters</span><button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">{saving ? 'Saving…' : 'Save instructions'}</button></div>
      {message && <p role="status" className="text-sm text-foreground">{message}</p>}
    </form>}
  </section>;
}