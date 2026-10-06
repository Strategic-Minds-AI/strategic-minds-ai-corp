import { useEffect, useState } from "react";
import { Sparkles, Phone, MessageSquare, Mail, Calendar, CheckCircle2, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export default function EdenHeader({ status, stats }) {
  const [pulse, setPulse] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="xa-card flex items-center gap-4 p-5">
      <div className="relative flex-shrink-0">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E6F0FF] via-[#0066FF] to-[#004CE6] text-2xl font-black text-white shadow-lg">
          ES
        </div>
        <span className={cn("absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white bg-green-500", pulse && "animate-ping")} />
        <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white bg-green-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-xl font-black tracking-tight text-foreground">Eden Skye</h2>
          <span className="xa-pill-badge text-[10px]">AI EXECUTIVE ASSISTANT</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {status?.online ? "Online and ready" : "Connecting..."} · Voice: {status?.voice || "Polly.Joanna-Neural"} · {status?.twilio ? "Twilio ✓" : ""} {status?.telnyx ? "Telnyx ✓" : ""} {status?.ai_gateway ? "AI ✓" : ""}
        </p>
      </div>
      <div className="hidden md:flex items-center gap-4">
        <Stat icon={Phone} label="Calls" value={stats?.calls || 0} />
        <Stat icon={MessageSquare} label="Messages" value={stats?.messages || 0} />
        <Stat icon={Mail} label="Unread" value={stats?.unread || 0} />
        <Stat icon={CheckCircle2} label="Tasks" value={stats?.tasks || 0} />
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-center gap-1.5 text-primary">
        <Icon size={16} />
        <span className="font-display text-lg font-black">{value}</span>
      </div>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
}