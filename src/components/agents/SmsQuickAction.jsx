import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageSquare, X, Loader2, Send, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * Quick SMS composer that an admin can trigger from the Super Agents chat.
 * Calls the executeAutonomousAction backend function with action: send_sms.
 */
export default function SmsQuickAction({ agentLabel }) {
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const send = async (e) => {
    e.preventDefault();
    const toNum = to.trim();
    const text = body.trim();
    if (!toNum || !text || sending) return;
    setSending(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke('executeAutonomousAction', {
        action: 'send_sms',
        to_number: toNum,
        body: text,
      });
      const d = res?.data || {};
      if (d.error) {
        setResult({ error: d.error });
      } else {
        setResult({ success: true, sid: d.message_sid });
        setTo('');
        setBody('');
      }
    } catch (err) {
      setResult({ error: err.message || 'Failed to send SMS.' });
    }
    setSending(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-foreground hover:bg-muted"
        title={`Send an SMS via ${agentLabel || 'agent'}`}
      >
        <MessageSquare size={14} className="text-primary" />
        <span>Send SMS</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/40 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <MessageSquare size={18} className="text-primary" />
                Quick SMS
              </h3>
              <button type="button" onClick={() => setOpen(false)} className="rounded p-1 text-muted-foreground hover:bg-muted"><X size={18} /></button>
            </div>
            <form onSubmit={send} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">To (E.164)</label>
                <input
                  type="tel"
                  value={to}
                  onChange={e => setTo(e.target.value)}
                  placeholder="+17721234567"
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Message</label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="Type your message (no emojis)..."
                  rows={4}
                  maxLength={1600}
                  required
                  className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                />
                <p className="mt-1 text-right text-[10px] text-muted-foreground">{body.length}/1600</p>
              </div>
              {result?.error && (
                <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <span>{result.error}</span>
                </div>
              )}
              {result?.success && (
                <div className="flex items-start gap-2 rounded-lg bg-primary/10 p-3 text-xs text-primary">
                  <CheckCircle size={14} className="mt-0.5 shrink-0" />
                  <span>SMS sent successfully{result.sid ? ` (SID: ${result.sid.slice(0, 12)}...)` : ''}.</span>
                </div>
              )}
              <button
                type="submit"
                disabled={sending || !to.trim() || !body.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {sending ? 'Sending...' : 'Send SMS'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}