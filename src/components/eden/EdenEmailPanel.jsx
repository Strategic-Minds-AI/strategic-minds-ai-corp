import { useState } from "react";
import { Mail, Send, Sparkles, Inbox, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function EdenEmailPanel({ emails, onReadEmail, onSendEmail, onDraftReply, onCleanInbox }) {
  const [selected, setSelected] = useState(null);
  const [emailDetail, setEmailDetail] = useState(null);
  const [draft, setDraft] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [sending, setSending] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [cleanResult, setCleanResult] = useState(null);

  const handleRead = async (id) => {
    setSelected(id);
    setEmailDetail(null);
    setDraft("");
    try {
      const res = await onReadEmail(id);
      setEmailDetail(res);
    } catch {}
  };

  const handleDraft = async () => {
    if (!selected) return;
    setDrafting(true);
    try {
      const res = await onDraftReply(selected);
      setDraft(res.draft || "");
    } catch {}
    setDrafting(false);
  };

  const handleSend = async () => {
    if (!draft || !emailDetail) return;
    setSending(true);
    try {
      const replyTo = (emailDetail.from || "").match(/<(.+?)>/)?.[1] || emailDetail.from || "";
      await onSendEmail({ to: replyTo, subject: `Re: ${emailDetail.subject}`, body: draft });
      setDraft(""); setSelected(null); setEmailDetail(null);
    } catch {}
    setSending(false);
  };

  const handleClean = async () => {
    setCleaning(true);
    try {
      const res = await onCleanInbox();
      setCleanResult(res);
    } catch {}
    setCleaning(false);
  };

  if (selected && emailDetail) {
    return (
      <div className="xa-card flex flex-col">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <button onClick={() => { setSelected(null); setEmailDetail(null); setDraft(""); }} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft size={18} />
          </button>
          <span className="flex-1 truncate text-sm font-semibold">{emailDetail.subject}</span>
        </div>
        <div className="border-b border-border px-4 py-2 text-xs text-muted-foreground">
          <div><strong>From:</strong> {emailDetail.from}</div>
          <div><strong>Date:</strong> {emailDetail.date}</div>
        </div>
        <div className="xa-scroll max-h-[200px] overflow-y-auto p-4 text-sm text-foreground whitespace-pre-wrap">
          {emailDetail.body || emailDetail.snippet}
        </div>
        {draft && (
          <div className="border-t border-border p-3">
            <textarea className="xa-input min-h-[120px] resize-y" value={draft} onChange={e => setDraft(e.target.value)} />
            <button onClick={handleSend} disabled={sending} className="xa-btn-primary mt-2 w-full">
              <Send size={16} /> {sending ? "Sending..." : "Send Reply"}
            </button>
          </div>
        )}
        {!draft && (
          <div className="border-t border-border p-3">
            <button onClick={handleDraft} disabled={drafting} className="xa-btn-outline w-full">
              <Sparkles size={16} /> {drafting ? "Eden is drafting..." : "Ask Eden to Draft Reply"}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="xa-card flex flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Mail size={16} className="text-primary" />
          <span className="font-display text-sm font-bold uppercase tracking-wider">Email</span>
        </div>
        <button onClick={handleClean} disabled={cleaning} className="xa-btn-outline px-3 py-1.5 text-xs">
          <Inbox size={14} /> {cleaning ? "Cleaning..." : "Clean Inbox"}
        </button>
      </div>
      {cleanResult && (
        <div className="border-b border-border bg-blue-50 px-4 py-2 text-xs text-blue-700">
          Eden categorized {cleanResult.total} emails. {cleanResult.categorized?.filter(c => c.category === "urgent").length || 0} urgent.
        </div>
      )}
      <div className="xa-scroll max-h-[400px] flex-1 divide-y divide-border overflow-y-auto">
        {emails.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No emails</div>}
        {emails.map((m) => (
          <button key={m.id} onClick={() => handleRead(m.id)} className={cn("flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-muted/50", m.unread && "bg-blue-50/50")}>
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Mail size={15} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn("text-sm truncate", m.unread ? "font-bold text-foreground" : "font-medium text-muted-foreground")}>{m.from}</span>
                {m.unread && <span className="h-2 w-2 rounded-full bg-primary" />}
              </div>
              <div className="truncate text-sm font-medium text-foreground">{m.subject}</div>
              <div className="truncate text-xs text-muted-foreground">{m.snippet}</div>
            </div>
            <span className="text-[10px] text-muted-foreground">{m.date ? new Date(m.date).toLocaleDateString() : ""}</span>
          </button>
        ))}
      </div>
    </div>
  );
}