import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

export default function EdenChat() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm Eden Skye, your AI executive assistant. I can help you manage your calendar, check messages, draft emails, set tasks, and answer questions. What can I do for you? ✨" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setMessages(m => [...m, { role: "user", content: userMsg }]);
    setInput("");
    setLoading(true);
    try {
      const res = await base44.functions.invoke("edenSkye", { action: "chat", message: userMsg });
      setMessages(m => [...m, { role: "assistant", content: res.data.reply }]);
    } catch (e) {
      setMessages(m => [...m, { role: "assistant", content: "I had trouble with that. Let me try again in a moment." }]);
    }
    setLoading(false);
  };

  return (
    <div className="xa-card flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#E6F0FF] to-[#0066FF] text-xs font-black text-white">ES</div>
        <span className="font-display text-sm font-bold uppercase tracking-wider">Chat with Eden</span>
        <span className="ml-auto flex items-center gap-1 text-xs text-green-600">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> Online
        </span>
      </div>
      <div ref={scrollRef} className="xa-scroll flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[85%] rounded-2xl px-4 py-2.5 text-sm", m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
              {m.role === "assistant" && <span className="mb-1 block text-[10px] font-bold text-primary">Eden Skye</span>}
              <div className="whitespace-pre-wrap">{m.content}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-2.5 text-sm text-muted-foreground">
              <Loader2 size={14} className="animate-spin" /> Eden is thinking...
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-2 border-t border-border p-3">
        <input
          className="xa-input flex-1"
          placeholder="Ask Eden anything..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          disabled={loading}
        />
        <button onClick={send} disabled={loading || !input.trim()} className="xa-btn-primary px-4">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}