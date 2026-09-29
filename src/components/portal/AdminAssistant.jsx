import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import AdminAssistantMessages from './AdminAssistantMessages';

export default function AdminAssistant() {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  async function send(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    const next = [...messages, { role: 'user', content: text }];
    setMessages(next); setDraft(''); setError(''); setSending(true);
    try {
      const { data } = await base44.functions.invoke('adminAssistant', { messages: next });
      setMessages([...next, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Could not send message.');
    } finally { setSending(false); }
  }
  return <aside aria-label="AI chat assistant" className="flex h-[520px] flex-col overflow-hidden rounded border border-border bg-card lg:sticky lg:top-28 lg:h-[calc(100vh-8rem)]">
    <div className="border-b border-border p-4"><h2 className="mb-0 text-lg">AI assistant</h2><p className="text-xs text-muted-foreground">Powered by Vercel AI Gateway</p></div>
    <AdminAssistantMessages messages={messages} sending={sending} />
    {error && <p role="alert" className="px-4 text-sm text-destructive">{error}</p>}
    <form onSubmit={send} className="border-t border-border p-3">
      <label htmlFor="admin-chat-message" className="sr-only">Message the AI assistant</label>
      <textarea id="admin-chat-message" value={draft} onChange={e => setDraft(e.target.value)} maxLength={4000} rows={3} placeholder="Ask the assistant…" className="w-full resize-none rounded border border-border bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
      <button type="submit" disabled={sending || !draft.trim()} className="agency-button mt-2 w-full">{sending ? 'Sending…' : 'Send message'}</button>
    </form>
  </aside>;
}