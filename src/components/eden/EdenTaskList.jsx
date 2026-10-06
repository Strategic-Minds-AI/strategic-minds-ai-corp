import { useState } from "react";
import { CheckSquare, Check, Clock, Flag, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const PRIORITY_COLORS = {
  urgent: "bg-red-50 text-red-600",
  high: "bg-orange-50 text-orange-600",
  medium: "bg-blue-50 text-blue-600",
  low: "bg-muted text-muted-foreground",
};

const CATEGORY_ICONS = {
  callback: "📞", follow_up: "↩️", appointment: "📅", reminder: "⏰", email: "✉️", research: "🔍", admin: "📋", personal: "👤",
};

export default function EdenTaskList({ tasks, onCreateTask, onUpdateTask }) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("admin");
  const [priority, setPriority] = useState("medium");

  const handleCreate = async () => {
    if (!title.trim()) return;
    try {
      await onCreateTask({ title: title.trim(), category, priority });
      setTitle(""); setShowForm(false);
    } catch {}
  };

  const handleToggle = async (task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    try { await onUpdateTask(task.id, newStatus); } catch {}
  };

  return (
    <div className="xa-card flex flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <CheckSquare size={16} className="text-primary" />
          <span className="font-display text-sm font-bold uppercase tracking-wider">Tasks</span>
        </div>
        <button onClick={() => setShowForm(s => !s)} className="xa-btn-outline px-3 py-1.5 text-xs">
          <Plus size={14} /> New
        </button>
      </div>
      {showForm && (
        <div className="space-y-2 border-b border-border p-3">
          <input className="xa-input" placeholder="Task title" value={title} onChange={e => setTitle(e.target.value)} />
          <div className="flex gap-2">
            <select className="xa-input flex-1" value={category} onChange={e => setCategory(e.target.value)}>
              {Object.entries(CATEGORY_ICONS).map(([k, v]) => <option key={k} value={k}>{v} {k}</option>)}
            </select>
            <select className="xa-input flex-1" value={priority} onChange={e => setPriority(e.target.value)}>
              {["low", "medium", "high", "urgent"].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <button onClick={handleCreate} disabled={!title.trim()} className="xa-btn-primary w-full">Create Task</button>
        </div>
      )}
      <div className="xa-scroll max-h-[400px] flex-1 divide-y divide-border overflow-y-auto">
        {tasks.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No pending tasks</div>}
        {tasks.map((t) => (
          <div key={t.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50">
            <button onClick={() => handleToggle(t)} className={cn("mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border", t.status === "completed" ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
              {t.status === "completed" && <Check size={12} />}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-base">{CATEGORY_ICONS[t.category] || "📋"}</span>
                <span className={cn("text-sm font-medium", t.status === "completed" ? "text-muted-foreground line-through" : "text-foreground")}>{t.title}</span>
              </div>
              {t.description && <div className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{t.description}</div>}
              <div className="mt-1 flex items-center gap-2">
                <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-bold uppercase", PRIORITY_COLORS[t.priority])}>
                  <Flag size={8} className="inline" /> {t.priority}
                </span>
                {t.due_at && <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Clock size={9} /> {new Date(t.due_at).toLocaleDateString()}</span>}
                {t.source && t.source !== "manual" && <span className="text-[10px] text-muted-foreground">from {t.source}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}