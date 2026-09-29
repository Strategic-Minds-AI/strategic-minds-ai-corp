import { useEffect, useRef } from 'react';

export default function AdminAssistantMessages({ messages, sending }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages, sending]);
  return <div aria-label="Chat history" aria-live="polite" className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
    {messages.length === 0 && <p className="text-sm leading-relaxed text-muted-foreground">Ask for help drafting an email, outlining a plan, or thinking through your next step. The assistant cannot view or change portal data.</p>}
    {messages.map((message, index) => <div key={index} className={`max-w-[95%] whitespace-pre-wrap break-words rounded p-3 text-sm leading-relaxed ${message.role === 'user' ? 'ml-auto bg-primary text-primary-foreground' : 'border border-border bg-muted text-foreground'}`}>{message.content}</div>)}
    {sending && <p role="status" className="text-sm text-muted-foreground">Thinking…</p>}
    <div ref={endRef} />
  </div>;
}