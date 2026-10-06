import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Phone, MessageSquare, Calendar, Mail, CheckSquare, Sparkles, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import EdenHeader from "@/components/eden/EdenHeader";
import EdenCallLog from "@/components/eden/EdenCallLog";
import EdenMessageInbox from "@/components/eden/EdenMessageInbox";
import EdenCalendarPanel from "@/components/eden/EdenCalendarPanel";
import EdenEmailPanel from "@/components/eden/EdenEmailPanel";
import EdenTaskList from "@/components/eden/EdenTaskList";
import EdenChat from "@/components/eden/EdenChat";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "calls", label: "Calls", icon: Phone },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "email", label: "Email", icon: Mail },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "chat", label: "Chat with Eden", icon: Sparkles },
];

export default function EdenSkye() {
  const [tab, setTab] = useState("dashboard");
  const [status, setStatus] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [calls, setCalls] = useState([]);
  const [events, setEvents] = useState([]);
  const [emails, setEmails] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const invoke = useCallback(async (action, payload = {}) => {
    const res = await base44.functions.invoke("edenSkye", { action, ...payload });
    return res.data;
  }, []);

  const loadStatus = useCallback(async () => {
    try { const s = await invoke("status"); setStatus(s); } catch {}
  }, [invoke]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const d = await invoke("dashboard");
      setDashboard(d);
      setCalls(d.recentCalls || []);
      setTasks(d.pendingTasks || []);
    } catch {}
    setLoading(false);
  }, [invoke]);

  const loadConversations = useCallback(async () => {
    try { const d = await invoke("listConversations"); setConversations(d.conversations || []); } catch {}
  }, [invoke]);

  const loadMessages = useCallback(async (convId) => {
    if (!convId) { setMessages([]); return; }
    try { const d = await invoke("getMessages", { conversation_id: convId }); setMessages(d.messages || []); } catch {}
  }, [invoke]);

  const loadCalendar = useCallback(async () => {
    try { const d = await invoke("listCalendar"); setEvents(d.events || []); } catch {}
  }, [invoke]);

  const loadEmails = useCallback(async () => {
    try { const d = await invoke("listEmails"); setEmails(d.messages || []); } catch {}
  }, [invoke]);

  const loadTasks = useCallback(async () => {
    try { const d = await invoke("listTasks"); setTasks(d.tasks || []); } catch {}
  }, [invoke]);

  useEffect(() => {
    loadStatus();
    loadDashboard();
  }, [loadStatus, loadDashboard]);

  useEffect(() => {
    if (tab === "calls") loadDashboard();
    if (tab === "messages") loadConversations();
    if (tab === "calendar") loadCalendar();
    if (tab === "email") loadEmails();
    if (tab === "tasks") loadTasks();
  }, [tab]);

  const handleSelectConv = (id) => {
    setSelectedConv(id);
    if (id) loadMessages(id);
    else setMessages([]);
  };

  const handleSendSms = async (msg) => {
    if (!selectedConv) return;
    const conv = conversations.find(c => c.id === selectedConv);
    if (!conv) return;
    await invoke("sendSms", { to: conv.participant_identity, message: msg });
    loadMessages(selectedConv);
  };

  const handleMakeCall = async (to) => {
    await invoke("makeCall", { to });
    loadDashboard();
  };

  const handleCreateAppointment = async (data) => {
    await invoke("createAppointment", data);
    loadCalendar();
  };

  const handleReadEmail = async (id) => {
    return await invoke("readEmail", { messageId: id });
  };

  const handleSendEmail = async (data) => {
    await invoke("sendEmail", data);
  };

  const handleDraftReply = async (id) => {
    return await invoke("draftEmailReply", { messageId: id });
  };

  const handleCleanInbox = async () => {
    return await invoke("cleanInbox");
  };

  const handleCreateTask = async (data) => {
    await invoke("createTask", data);
    loadTasks();
  };

  const handleUpdateTask = async (id, taskStatus) => {
    await invoke("updateTask", { task_id: id, status: taskStatus });
    loadTasks();
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <EdenHeader status={status} stats={dashboard?.stats} />

        <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon size={16} /> {t.label}
              </button>
            );
          })}
        </div>

        {tab === "dashboard" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <EdenCallLog calls={calls} onMakeCall={handleMakeCall} />
            <EdenTaskList tasks={tasks} onCreateTask={handleCreateTask} onUpdateTask={handleUpdateTask} />
            <EdenMessageInbox conversations={conversations} messages={messages} onSelect={handleSelectConv} onSend={handleSendSms} selectedId={selectedConv} />
            <div className="lg:col-span-2 min-h-[500px]">
              <EdenChat />
            </div>
          </div>
        )}

        {tab === "calls" && (
          <EdenCallLog calls={calls} onMakeCall={handleMakeCall} />
        )}

        {tab === "messages" && (
          <EdenMessageInbox
            conversations={conversations}
            messages={messages}
            onSelect={handleSelectConv}
            onSend={handleSendSms}
            selectedId={selectedConv}
          />
        )}

        {tab === "calendar" && (
          <EdenCalendarPanel events={events} onCreateAppointment={handleCreateAppointment} />
        )}

        {tab === "email" && (
          <EdenEmailPanel
            emails={emails}
            onReadEmail={handleReadEmail}
            onSendEmail={handleSendEmail}
            onDraftReply={handleDraftReply}
            onCleanInbox={handleCleanInbox}
          />
        )}

        {tab === "tasks" && (
          <EdenTaskList tasks={tasks} onCreateTask={handleCreateTask} onUpdateTask={handleUpdateTask} />
        )}

        {tab === "chat" && (
          <div className="min-h-[600px]">
            <EdenChat />
          </div>
        )}
      </div>
    </div>
  );
}