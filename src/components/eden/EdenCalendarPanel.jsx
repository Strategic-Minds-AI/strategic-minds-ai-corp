import { useState } from "react";
import { Calendar, Plus, Clock, MapPin, Users } from "lucide-react";

export default function EdenCalendarPanel({ events, onCreateAppointment, onFindSlots }) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!title || !start) return;
    setSaving(true);
    try {
      await onCreateAppointment({ title, start, attendees: email ? [email] : [] });
      setTitle(""); setStart(""); setEmail(""); setShowForm(false);
    } catch {}
    setSaving(false);
  };

  return (
    <div className="xa-card flex flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-primary" />
          <span className="font-display text-sm font-bold uppercase tracking-wider">Calendar</span>
        </div>
        <button onClick={() => setShowForm(s => !s)} className="xa-btn-outline px-3 py-1.5 text-xs">
          <Plus size={14} /> New
        </button>
      </div>
      {showForm && (
        <div className="space-y-2 border-b border-border p-3">
          <input className="xa-input" placeholder="Appointment title" value={title} onChange={e => setTitle(e.target.value)} />
          <input className="xa-input" type="datetime-local" value={start} onChange={e => setStart(e.target.value)} />
          <input className="xa-input" placeholder="Attendee email (optional)" value={email} onChange={e => setEmail(e.target.value)} />
          <button onClick={handleCreate} disabled={saving || !title || !start} className="xa-btn-primary w-full">
            {saving ? "Creating..." : "Create Appointment"}
          </button>
        </div>
      )}
      <div className="xa-scroll max-h-[400px] flex-1 divide-y divide-border overflow-y-auto">
        {events.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No upcoming events</div>}
        {events.map((e) => (
          <div key={e.id} className="px-4 py-3 hover:bg-muted/50">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Calendar size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground">{e.title}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock size={11} /> {new Date(e.start).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                </div>
                {e.location && <div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin size={11} /> {e.location}</div>}
                {e.attendees?.length > 0 && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Users size={11} /> {e.attendees.join(", ")}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}