import { useState } from "react";
import { MessageSquare, Send, MessageCircle, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function EdenMessageInbox({ conversations, messages, onSelect, onSend, selectedId }) {
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!reply.trim() || !selectedId) return;
    setSending(true);
    try { await onSend(reply.trim()); setReply(""); } catch {}
    setSending(false);
  };

  if (selectedId && messages.length >= 0) {
    return (
      <div className="xa-card flex flex-col">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <button onClick={() => onSelect(null)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft size={18} />
          </button>
          <span className="text-sm font-semibold text-foreground">{conversations.find(c => c.id === selectedId)?.participant_identity || "Conversation"}</span>
        </div>
        <div className="xa-scroll max-h-[400px] flex-1 space-y-2 overflow-y-auto p-4">
          {messages.length === 0 && <div className="text-center text-sm text-muted-foreground py-8">No messages yet</div>}
          {messages.map((m) => (
            <div key={m.id} className={cn("flex", m.direction === "inbound" ? "justify-start" : "justify-end")}>
              <div className={cn("max-w-[75%] rounded-2xl px-4 py-2 text-sm", m.direction === "inbound" ? "bg-muted text-foreground" : "bg-primary text-primary-foreground")}>
                {m.body}
                {m.agent_generated && <span className="ml-1 text-[9px] opacity-60">· Eden</span>}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 border-t border-border p-3">
          <input
            className="xa-input flex-1"
            placeholder="Reply as Eden..."
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button onClick={handleSend} disabled={sending || !reply.trim()} className="xa-btn-primary px-4">
            <Send size={16} /> {sending ? "..." : "Send"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="xa-card flex flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-primary" />
          <span className="font-display text-sm font-bold uppercase tracking-wider">Messages</span>
        </div>
        <span className="text-xs text-muted-foreground">{conversations.length} conversations</span>
      </div>
      <div className="xa-scroll max-h-[400px] flex-1 divide-y divide-border overflow-y-auto">
        {conversations.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No conversations yet</div>}
        {conversations.map((c) => (
          <button key={c.id} onClick={() => onSelect(c.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <MessageCircle size={15} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{c.contact_name || c.participant_identity}</span>
                {c.unread_count > 0 && <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{c.unread_count}</span>}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="truncate">{c.last_message_preview || "No messages"}</span>
                {c.channels?.includes("whatsapp") && <span className="rounded bg-green-50 px-1 text-[9px] font-bold text-green-600">WA</span>}
              </div>
            </div>
            {c.last_message_at && <span className="text-[10px] text-muted-foreground">{new Date(c.last_message_at).toLocaleDateString()}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}