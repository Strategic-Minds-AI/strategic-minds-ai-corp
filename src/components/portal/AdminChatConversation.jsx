import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { ArrowUp } from 'lucide-react';
import AdminAccountBar from './AdminAccountBar';
export default function AdminChatConversation({ chat, draft, onDraft, onSend, sending, error, projects, projectId, onProject, quickTask, onAccount }) {
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [chat?.messages?.length, sending]);
  return <div className="flex min-h-0 flex-1 flex-col bg-background">
    <header className="flex min-h-16 shrink-0 flex-wrap items-center gap-3 border-b border-border px-5 py-2 pl-16 text-sm font-semibold text-foreground md:pl-16"><AdminAccountBar onSelect={onAccount}/><label className="ml-auto flex items-center gap-2 text-xs font-normal text-muted-foreground">Project <select aria-label="Project for chat deliverables" value={projectId} onChange={e => onProject(e.target.value)} disabled={sending} className="max-w-48 rounded-lg border border-border bg-background px-2 py-1 text-foreground"><option value="">Choose project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></label></header>
    <div aria-live="polite" className="min-h-0 flex-1 overflow-y-auto px-5 py-8">
      {!chat?.messages?.length ? <div className="flex h-full items-center justify-center text-center"><h1 className="mb-0 text-2xl font-semibold text-foreground sm:text-3xl">What can I help with?</h1></div> : <div className="mx-auto max-w-3xl space-y-7">{chat.messages.map((m,i) => <div key={i} className={m.role === 'user' ? 'ml-auto w-fit max-w-[85%] whitespace-pre-wrap break-words rounded-2xl bg-muted px-4 py-3 text-sm text-foreground' : 'prose prose-sm max-w-none break-words text-foreground'}>{m.role === 'user' ? m.content : <><ReactMarkdown>{m.content}</ReactMarkdown>{m.savedUrl && <a href={m.savedUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">Open saved deliverable in Drive</a>}</>}</div>)}{sending && <p role="status" className="text-sm text-muted-foreground">Thinking…</p>}<div ref={end}/></div>}
    </div>
    <div className="mx-auto w-full max-w-3xl shrink-0 px-4 pb-5 pt-2">
      {quickTask && <p className="mb-2 text-xs text-muted-foreground">{quickTask === 'notes' ? 'Client notes summary' : 'Project outline template'} · Choose a project to automatically save the result to Drive.</p>}
      {error && <p role="alert" className="mb-2 text-sm text-destructive">{error}</p>}
      <form onSubmit={onSend} className="rounded-2xl border border-border bg-card p-3 shadow-sm"><label htmlFor="workspace-prompt" className="sr-only">Message Agency AI</label><textarea id="workspace-prompt" rows={2} maxLength={4000} value={draft} onChange={e => onDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); e.currentTarget.form.requestSubmit(); } }} placeholder="Ask anything" className="w-full resize-none bg-transparent px-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"/><div className="flex items-center justify-between px-1"><span className="text-xs text-muted-foreground">Shift + Enter for a new line</span><button type="submit" disabled={!draft.trim() || sending} aria-label="Send message" className="rounded-full bg-consoleAccent p-2 text-primary-foreground disabled:opacity-40"><ArrowUp size={17}/></button></div></form>
      <p className="mt-2 text-center text-xs text-muted-foreground">Responses may be inaccurate. Review important details.</p>
    </div>
  </div>;
}