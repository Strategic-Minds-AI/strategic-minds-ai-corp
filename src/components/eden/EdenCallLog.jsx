import { useState } from "react";
import { Phone, PhoneCall, PhoneOutgoing, Clock, Play } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_COLORS = {
  completed: "text-green-600 bg-green-50",
  ringing: "text-blue-600 bg-blue-50",
  "in-progress": "text-blue-600 bg-blue-50",
  failed: "text-red-600 bg-red-50",
  busy: "text-orange-600 bg-orange-50",
  "no-answer": "text-orange-600 bg-orange-50",
  canceled: "text-muted-foreground bg-muted",
};

export default function EdenCallLog({ calls, onMakeCall }) {
  const [to, setTo] = useState("");
  const [calling, setCalling] = useState(false);

  const handleCall = async () => {
    if (!to.trim()) return;
    setCalling(true);
    try { await onMakeCall(to.trim()); setTo(""); } catch {}
    setCalling(false);
  };

  return (
    <div className="xa-card flex flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <PhoneCall size={16} className="text-primary" />
          <span className="font-display text-sm font-bold uppercase tracking-wider">Call Log</span>
        </div>
        <span className="text-xs text-muted-foreground">{calls.length} calls</span>
      </div>
      <div className="flex gap-2 border-b border-border p-3">
        <input
          className="xa-input flex-1"
          placeholder="+1 555 000 1234"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
        <button onClick={handleCall} disabled={calling || !to.trim()} className="xa-btn-primary px-4">
          <PhoneOutgoing size={16} /> {calling ? "Calling..." : "Call"}
        </button>
      </div>
      <div className="xa-scroll max-h-[400px] flex-1 divide-y divide-border overflow-y-auto">
        {calls.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No calls yet</div>}
        {calls.map((c) => (
          <div key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50">
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-full", c.direction === "inbound" ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600")}>
              {c.direction === "inbound" ? <Phone size={15} /> : <PhoneOutgoing size={15} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{c.direction === "inbound" ? c.from_number : c.to_number}</span>
                <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold uppercase", STATUS_COLORS[c.status] || STATUS_COLORS.canceled)}>{c.status}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock size={11} /> {new Date(c.started_at || c.created_date).toLocaleString()}
                {c.duration_seconds > 0 && <span>· {c.duration_seconds}s</span>}
              </div>
            </div>
            {c.recording_url && (
              <a href={c.recording_url} target="_blank" rel="noreferrer" className="text-primary hover:opacity-70">
                <Play size={16} />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}