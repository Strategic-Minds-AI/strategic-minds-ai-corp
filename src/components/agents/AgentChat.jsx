import { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';
import { ArrowUp, Loader2, AlertCircle, RefreshCw, Zap, Users } from 'lucide-react';
import { AGENT_META } from './AgentSidebar';
import SmsQuickAction from './SmsQuickAction';

const STORAGE_KEY = (agent) => `agent-chat-${agent}`;
const SWARM_KEY = (agents) => `agent-chat-swarm-${[...agents].sort().join('-')}`;

export function loadAgentChat(agent) {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY(agent)) || '[]'); } catch { return []; }
}
export function saveAgentChat(agent, messages) {
  try { localStorage.setItem(STORAGE_KEY(agent), JSON.stringify(messages)); } catch { /* ignore */ }
}
export function clearAgentChat(agent) {
  try { localStorage.removeItem(STORAGE_KEY(agent)); } catch { /* ignore */ }
}
export function loadSwarmChat(agents) {
  try { return JSON.parse(localStorage.getItem(SWARM_KEY(agents)) || '[]'); } catch { return []; }
}
export function saveSwarmChat(agents, messages) {
  try { localStorage.setItem(SWARM_KEY(agents), JSON.stringify(messages)); } catch { /* ignore */ }
}
export function clearSwarmChat(agents) {
  try { localStorage.removeItem(SWARM_KEY(agents)); } catch { /* ignore */ }
}

export default function AgentChat({ agentNames, onNewChat }) {
  const isSwarm = agentNames.length > 1;
  const storageKey = isSwarm ? SWARM_KEY(agentNames) : STORAGE_KEY(agentNames[0]);
  const loadFn = isSwarm ? loadSwarmChat : loadAgentChat;
  const saveFn = isSwarm ? saveSwarmChat : saveAgentChat;
  const clearFn = isSwarm ? clearSwarmChat : clearAgentChat;

  const [messages, setMessages] = useState(() => loadFn(agentNames));
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => { setMessages(loadFn(agentNames)); }, [agentNames.join(','), isSwarm]);
  useEffect(() => { saveFn(agentNames, messages); }, [messages, agentNames.join(','), isSwarm]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, sending]);

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
      if (isSwarm) {
        // Swarm mode: send to all agents in parallel
        const apiMessages = newMessages.map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.agentName ? `[${m.agentName}]: ${m.content}` : m.content
        }));

        const results = await Promise.allSettled(
          agentNames.map(name =>
            base44.functions.invoke('runAgentChat', { agent_name: name, messages: apiMessages })
          )
        );

        const updatedMessages = [...newMessages];
        results.forEach((result, i) => {
          const agentName = agentNames[i];
          const meta = AGENT_META[agentName];
          if (result.status === 'fulfilled' && result.value.data && !result.value.data.error) {
            updatedMessages.push({ role: 'assistant', content: result.value.data.content || 'No response.', agentName });
          } else {
            const errMsg = result.status === 'rejected' ? result.reason?.message : result.value?.data?.error;
            updatedMessages.push({ role: 'assistant', content: `Error: ${errMsg || 'Failed to respond.'}`, agentName });
          }
        });
        setMessages(updatedMessages);
      } else {
        // Single agent mode
        const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
        const res = await base44.functions.invoke('runAgentChat', {
          agent_name: agentNames[0],
          messages: apiMessages
        });
        const data = res.data;
        if (data.error) throw new Error(data.error);
        const assistantMessage = { role: 'assistant', content: data.content || 'No response received.' };
        if (data.tool_results?.length > 0) {
          assistantMessage.tool_calls = data.tool_results.map(tr => ({ name: tr.tool, status: 'completed', arguments_string: JSON.stringify(tr.result, null, 2), results: tr.result }));
        }
        setMessages([...newMessages, assistantMessage]);
      }
    } catch (e) {
      setError(e.message || 'Failed to get a response.');
    }
    setSending(false);
  }, [input, sending, messages, agentNames, isSwarm]);

  const headerLabel = isSwarm
    ? `Swarm Mode: ${agentNames.length} Agents`
    : AGENT_META[agentNames[0]]?.label || 'Agent';

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <header className="flex min-h-16 shrink-0 items-center gap-3 border-b border-border px-5 py-2 pl-16 text-sm font-semibold text-foreground md:pl-5">
        {isSwarm ? <Users size={18} className="text-primary" /> : <Zap size={16} className="text-primary" />}
        <span>{headerLabel}</span>
        <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary"><Zap size={10}/> AI Gateway</span>
        <div className="ml-auto">
          <SmsQuickAction agentLabel={headerLabel} />
        </div>
      </header>
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-8">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            {isSwarm ? <Users size={40} className="mb-4 text-primary" /> : <Zap size={32} className="mb-4 text-primary" />}
            <h1 className="mb-0 text-2xl font-semibold text-foreground sm:text-3xl">{headerLabel}</h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-md">
              {isSwarm
                ? `All ${agentNames.length} selected agents will respond to your message in parallel. They can see each other's responses and build on them.`
                : `Give ${headerLabel} a goal and it will decompose the work, dispatch tasks, and operate end to end.`}
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-7">
            {messages.map((m, i) => {
              if (m.role === 'user') {
                return <div key={i} className="ml-auto w-fit max-w-[85%] whitespace-pre-wrap break-words rounded-2xl bg-muted px-4 py-3 text-sm text-foreground">{m.content}</div>;
              }
              return (
                <div key={i} className="max-w-none">
                  {m.agentName && <div className="mb-1 text-xs font-semibold text-primary">{AGENT_META[m.agentName]?.label || m.agentName}</div>}
                  <div className="prose prose-sm max-w-none break-words text-foreground"><ReactMarkdown>{m.content}</ReactMarkdown></div>
                </div>
              );
            })}
            {sending && <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 size={14} className="animate-spin"/> {isSwarm ? 'Agents thinking via AI Gateway...' : 'Thinking via AI Gateway...'}</p>}
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
            placeholder={isSwarm ? `Message all ${agentNames.length} agents...` : `Message ${headerLabel}...`}
            rows={2}
            maxLength={4000}
            className="w-full resize-none bg-transparent px-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <div className="flex items-center justify-end gap-2 px-1">
            <button type="submit" disabled={(!input.trim()) || sending} aria-label="Send message" className="rounded-full bg-consoleAccent p-2 text-primary-foreground disabled:opacity-40"><ArrowUp size={17}/></button>
          </div>
        </form>
        <p className="mt-2 text-center text-xs text-muted-foreground">{isSwarm ? 'All selected agents respond in parallel via Vercel AI Gateway.' : 'Super-agents can create tasks, send SMS, manage campaigns, and build systems.'}</p>
      </div>
    </div>
  );
}