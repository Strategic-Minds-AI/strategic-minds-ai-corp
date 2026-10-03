import { useState, useEffect, useCallback } from 'react';
import { ArrowUpRight, Link2, ShieldCheck, RefreshCw, Send, Check, X, Zap, MessageSquare } from 'lucide-react';
import { callFunction } from '@/lib/functionClient';

export default function ChatGPTConnection() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [threadId, setThreadId] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await callFunction('gptSync', { action: 'status' });
      setStatus(res);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  async function handleSync() {
    if (!message.trim()) return;
    setSyncing(true); setError('');
    const userMsg = { role: 'user', content: message, ts: Date.now() };
    setHistory(h => [...h, userMsg]);
    try {
      const res = await callFunction('gptSync', { action: 'sync', message, thread_id: threadId, instructions: 'You are the Strategic Minds AI agent bridged into this ChatGPT business account. Respond as GPT would, with actionable business intelligence.' });
      if (res.error) throw new Error(res.error);
      setThreadId(res.thread_id || threadId);
      setHistory(h => [...h, { role: 'gpt', content: res.gpt_response, ts: Date.now(), bridge: res.bridge }]);
      setMessage('');
    } catch (e) { setError(e.message); setHistory(h => [...h, { role: 'error', content: e.message, ts: Date.now() }]); }
    setSyncing(false);
  }

  return (
    <section aria-labelledby="chatgpt-connection-title" className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 md:p-9">
        <div className="mb-7 flex items-start gap-4">
          <span className="rounded-lg bg-muted p-3 text-primary"><Link2 size={23} /></span>
          <div>
            <p className="agency-eyebrow mb-2">BIDIRECTIONAL GPT SYNC</p>
            <h2 id="chatgpt-connection-title" className="mb-2 text-2xl font-bold">ChatGPT business account bridge</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">Your chat agent can send messages to your ChatGPT business account and receive responses back. This enables bidirectional command: ask the agent to talk to GPT, push context, or pull insights — all from your admin chat.</p>
          </div>
        </div>

        <div className="mb-6 flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-4">
          {loading ? <RefreshCw size={18} className="animate-spin text-muted-foreground" /> : status?.configured ? <Check size={18} className="text-green" /> : <X size={18} className="text-muted-foreground" />}
          <div className="flex-1">
            <strong className="text-sm">{status?.configured ? 'Direct OpenAI bridge active' : 'AI Gateway fallback'}</strong>
            <p className="text-xs text-muted-foreground">{status?.configured ? `Connected via ${status.bridge}` : 'Set OPENAI_API_KEY in backend secrets for direct ChatGPT sync. Until then, the AI Gateway bridges messages.'}</p>
          </div>
          <button type="button" onClick={loadStatus} className="text-sm text-primary underline">Refresh</button>
        </div>

        <div className="mb-6">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><MessageSquare size={16} /> Test bidirectional sync</h3>
          <div className="rounded-lg border border-border bg-background p-4 min-h-[200px] max-h-[400px] overflow-y-auto xa-scroll">
            {history.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">Send a message below to test the GPT bridge. Your chat agent will forward it to ChatGPT and return the response.</p> : (
              <div className="space-y-3">
                {history.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-3 text-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground' : m.role === 'error' ? 'bg-destructive/10 text-destructive border border-destructive/30' : 'bg-muted'}`}>
                      {m.role === 'gpt' && <span className="mb-1 flex items-center gap-1 text-xs text-primary"><Zap size={12} /> GPT {m.bridge && `(${m.bridge})`}</span>}
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          <div className="mt-3 flex gap-2">
            <input value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !syncing) handleSync(); }} placeholder="Message ChatGPT…" disabled={syncing} className="xa-input flex-1" />
            <button type="button" onClick={handleSync} disabled={syncing || !message.trim()} className="xa-btn-primary">
              {syncing ? <RefreshCw size={17} className="animate-spin" /> : <Send size={17} />} Send
            </button>
          </div>
          {threadId && <p className="mt-2 text-xs text-muted-foreground">Thread: <code className="font-mono">{threadId}</code></p>}
        </div>

        <div className="border-t border-border pt-6">
          <h3 className="mb-3 text-sm font-semibold">MCP connection (ChatGPT → this app)</h3>
          <ol className="space-y-3 text-sm leading-relaxed">
            <li className="flex gap-3"><span className="font-bold text-primary">01</span><span>Publish this app, then copy the MCP server address from the app's MCP page.</span></li>
            <li className="flex gap-3"><span className="font-bold text-primary">02</span><span>In ChatGPT, open Apps, enable Developer mode, create an app, and paste the server address.</span></li>
            <li className="flex gap-3"><span className="font-bold text-primary">03</span><span>Sign in with your agency account and approve access. Enable the app in ChatGPT's composer.</span></li>
          </ol>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer" className="agency-button">Open ChatGPT <ArrowUpRight size={17} /></a>
            <a href="https://help.openai.com/en/articles/12584461-developer-mode-and-mcp-apps-in-chatgpt" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary underline underline-offset-4">Setup guide</a>
          </div>
        </div>

        <p className="mt-7 flex items-start gap-2 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground"><ShieldCheck size={16} className="mt-0.5 shrink-0" />The bidirectional bridge uses your OpenAI API key (stored in the backend vault). MCP lets ChatGPT call into this app; the sync bridge lets this app call into ChatGPT. Both directions are authenticated and scoped to admin access.</p>
      </div>
    </section>
  );
}