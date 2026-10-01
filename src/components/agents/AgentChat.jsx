import { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';
import { ArrowUp, Loader2, AlertCircle, RefreshCw, Zap } from 'lucide-react';

const STORAGE_KEY = (agent) => `agent-chat-${agent}`;

export function loadAgentChat(agent) {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY(agent)) || '[]'); } catch { return []; }
}

export function saveAgentChat(agent, messages) {
  try { localStorage.setItem(STORAGE_KEY(agent), JSON.stringify(messages)); } catch { /* ignore */ }
}

export function clearAgentChat(agent) {
  try { localStorage.removeItem(STORAGE_KEY(agent)); } catch { /* ignore */ }
}

export default function AgentChat({ agentName, agentLabel, onNewChat }) {
  const [messages, setMessages] = useState(() => loadAgentChat(agentName));
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => { setMessages(loadAgentChat(agentName)); }, [agentName]);

  useEffect(() => { saveAgentChat(agentName, messages); }, [messages, agentName]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setSending(true);
    setError(null);

    const userMessage = { role: 'user', content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    try {
      const res = await base44.functions.invoke('runAgentChat', {
        agent_name: agentName,
        messages: newMessages.map(m => ({ role: m.role, content: m.content }))
      });
      const data = res.data;
      if (data.error) throw new Error(data.error);

      const assistantMessage = { role: 'assistant', content: data.content || 'No response received.' };
      if (data.tool_results && data.tool_results.length > 0) {
        assistantMessage.tool_calls = data.tool_results.map(tr => ({
          name: tr.tool,
          status: 'completed',
          arguments_string: JSON.stringify(tr.result, null, 2),
          results: tr.result
        }));
      }
      setMessages([...newMessages, assistantMessage]);
    } catch (e) {
      setError(e.message || 'Failed to get a response from the agent.');
    }
    setSending(false);
  }, [input, sending, messages, agentName]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <header className="flex min-h-16 shrink-0 items-center gap-3 border-b border-border px-5 py-2 pl-16 text-sm font-semibold text-foreground md:pl-5">
        <span className="text-lg">{AGENT_ICONS[agentName] || '🤖'}</span>
        <span>{agentLabel}</span>
        <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary"><Zap size={10}/> AI Gateway</span>
      </header>
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-8">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="text-5xl mb-4">{AGENT_ICONS[agentName] || '🤖'}</span>
            <h1 className="mb-0 text-2xl font-semibold text-foreground sm:text-3xl">{agentLabel}</h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-md">Give {agentLabel} a goal and it will decompose the work, dispatch tasks, and operate end to end.</p>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-7">
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'ml-auto w-fit max-w-[85%] whitespace-pre-wrap break-words rounded-2xl bg-muted px-4 py-3 text-sm text-foreground' : 'prose prose-sm max-w-none break-words text-foreground'}>
                {m.role === 'user' ? m.content : <ReactMarkdown>{m.content}</ReactMarkdown>}
                {m.tool_calls?.length > 0 && (
                  <div className="mt-2 space-y-1 not-prose">
                    {m.tool_calls.map((tc, j) => (
                      <div key={j} className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">✓ {tc.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {sending && <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 size={14} className="animate-spin"/> Thinking via AI Gateway…</p>}
            {error && (
              <div className="flex flex-col items-center justify-center px-6 text-center">
                <AlertCircle className="w-8 h-8 text-destructive mb-2" />
                <p className="text-xs text-destructive mb-3">{error}</p>
                <button onClick={() => setError(null)} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted"><RefreshCw size={14} className="inline mr-1"/> Dismiss</button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="mx-auto w-full max-w-3xl shrink-0 px-4 pb-5 pt-2">
        {onNewChat && messages.length > 0 && (
          <button onClick={onNewChat} className="mb-2 text-xs text-muted-foreground hover:text-primary">Clear conversation</button>
        )}
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="rounded-2xl border border-border bg-card p-3 shadow-sm">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }}
            placeholder={`Message ${agentLabel}…`}
            rows={2}
            maxLength={4000}
            className="w-full resize-none bg-transparent px-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <div className="flex items-center justify-end gap-2 px-1">
            <button type="submit" disabled={(!input.trim()) || sending} aria-label="Send message" className="rounded-full bg-consoleAccent p-2 text-primary-foreground disabled:opacity-40"><ArrowUp size={17}/></button>
          </div>
        </form>
        <p className="mt-2 text-center text-xs text-muted-foreground">Super-agents can create tasks, read domains, and manage builds. Responses may be inaccurate.</p>
      </div>
    </div>
  );
}

const AGENT_ICONS = {
  orchestrator: '🧠', growth_operator: '🛡️', code_architect: '⚙️', social_strategist: '📣',
  sales_engine: '🚀', brand_guardian: '✦', replicator: '🧬', swarm: '🐝'
};