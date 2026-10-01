import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Send, Loader2, AlertCircle, RefreshCw, Zap } from "lucide-react";
import MessageBubble from "./MessageBubble";

export default function AgentChat({ agentName, agentLabel, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    setError(null);

    const userMessage = { role: "user", content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    try {
      const res = await base44.functions.invoke("runAgentChat", {
        agent_name: agentName,
        messages: newMessages.map(m => ({ role: m.role, content: m.content }))
      });
      const data = res.data;
      if (data.error) throw new Error(data.error);

      const assistantMessage = { role: "assistant", content: data.content || "No response received." };
      if (data.tool_results && data.tool_results.length > 0) {
        assistantMessage.tool_calls = data.tool_results.map((tr, i) => ({
          name: tr.tool,
          status: "completed",
          arguments_string: JSON.stringify(tr.result, null, 2),
          results: tr.result
        }));
      }
      setMessages([...newMessages, assistantMessage]);
    } catch (e) {
      setError(e.message || "Failed to get a response from the agent.");
    }
    setSending(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="flex items-center gap-3 px-4 h-14 border-b border-[#E5E7EB] bg-white">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-[#FAFAFA]"><ArrowLeft className="w-5 h-5" /></button>
        <div className="font-heading font-bold text-black">{agentLabel}</div>
        <span className="xa-pill-badge">LIVE</span>
        <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-[#8A7300]"><Zap className="w-3 h-3" /> Vercel AI Gateway</span>
      </div>
      <div ref={scrollRef} className="xa-scroll flex-1 overflow-y-auto px-4 py-6 space-y-5 bg-white">
        {messages.length === 0 ? (
          <div className="text-center text-black/40 mt-20">
            <Zap className="w-8 h-8 mx-auto mb-3 text-[#CCBB00]" />
            <p className="text-sm font-semibold text-black/60 mb-1">{agentLabel} is ready</p>
            <p className="text-xs">Powered by Vercel AI Gateway. Send a message to activate this super-agent.</p>
          </div>
        ) : messages.map((m, i) => <MessageBubble key={i} message={m} />)}
        {sending && <div className="flex items-center gap-2 text-black/40 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Thinking via AI Gateway…</div>}
        {error && (
          <div className="flex flex-col items-center justify-center px-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
            <p className="text-xs text-red-600 mb-3">{error}</p>
            <button onClick={() => setError(null)} className="xa-btn-outline text-sm"><RefreshCw className="w-4 h-4" /> Dismiss</button>
          </div>
        )}
      </div>
      <div className="border-t border-[#E5E7EB] bg-white p-4">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={`Message ${agentLabel}…`}
            rows={1}
            className="xa-input flex-1 resize-none max-h-32 py-3"
          />
          <button onClick={send} disabled={!input.trim() || sending} className="xa-btn-primary h-[42px]"><Send className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
}