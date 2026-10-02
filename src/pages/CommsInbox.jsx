import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import {
  MessageSquare, Send, Phone, RefreshCw, Loader2, Search,
  Inbox, Bot, Zap, Ghost, Users, Rocket, Plus, Play, Pause,
  CheckCircle2, AlertCircle, BookOpen
} from 'lucide-react';

const TIERS = [
  { key: "standard", label: "Standard", icon: Bot, color: "text-blue-400" },
  { key: "super", label: "Super Agent", icon: Zap, color: "text-primary" },
  { key: "swarm", label: "AGI Swarm", icon: Users, color: "text-purple-400" },
  { key: "fulfillment", label: "Fulfillment", icon: Rocket, color: "text-green-400" },
  { key: "shadow", label: "Shadow", icon: Ghost, color: "text-slate-400" },
];

export default function CommsInbox() {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('inbox');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('commsConsole', { action: 'list' });
      setConversations(res?.conversations || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const loadMessages = useCallback(async (conv) => {
    if (!conv) return;
    try {
      const res = await base44.functions.invoke('commsConsole', { action: 'messages', conversation_id: conv.id });
      setMessages(res?.messages || []);
    } catch (e) { setError(e.message); }
  }, []);

  const selectConversation = (conv) => {
    setSelectedConv(conv);
    loadMessages(conv);
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selectedConv) return;
    setSending(true);
    try {
      await base44.functions.invoke('commsConsole', {
        action: 'send',
        to: selectedConv.participant_identity,
        body: replyText.trim(),
      });
      setReplyText('');
      loadMessages(selectedConv);
      load();
    } catch (e) { setError(e.message); }
    finally { setSending(false); }
  };

  const filteredConvs = conversations.filter(c =>
    !searchQuery || c.participant_identity?.includes(searchQuery) || c.contact_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-background">
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-border bg-card px-4 py-2">
        <TabButton active={tab === 'inbox'} onClick={() => setTab('inbox')} icon={Inbox} label="Inbox" />
        <TabButton active={tab === 'agents'} onClick={() => setTab('agents')} icon={Bot} label="Agents" />
        <TabButton active={tab === 'campaigns'} onClick={() => setTab('campaigns')} icon={MessageSquare} label="Campaigns" />
      </div>

      {tab === 'inbox' && (
        <div className="flex min-h-0 flex-1">
          {/* Conversation list */}
          <div className="w-80 shrink-0 border-r border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border p-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <button onClick={load} className="text-muted-foreground hover:text-foreground">
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </button>
            </div>
            <div className="overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center p-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : filteredConvs.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">No conversations yet</div>
              ) : (
                filteredConvs.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={cn(
                      "flex w-full flex-col gap-1 border-b border-border p-3 text-left hover:bg-accent",
                      selectedConv?.id === conv.id && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">
                        {conv.contact_name || conv.participant_identity}
                      </span>
                      {(conv.unread_count || 0) > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    <span className="truncate text-xs text-muted-foreground">{conv.last_message_preview || 'No messages'}</span>
                    <div className="flex items-center gap-1.5">
                      {(conv.channels || []).map(ch => (
                        <span key={ch} className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">{ch}</span>
                      ))}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Message thread */}
          <div className="flex min-w-0 flex-1 flex-col">
            {selectedConv ? (
              <>
                <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{selectedConv.contact_name || selectedConv.participant_identity}</h3>
                    <p className="text-xs text-muted-foreground">{selectedConv.participant_identity}</p>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No messages</div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map(msg => (
                        <div
                          key={msg.id}
                          className={cn("flex", msg.direction === "outbound" ? "justify-end" : "justify-start")}
                        >
                          <div
                            className={cn(
                              "max-w-md rounded-lg px-3 py-2 text-sm",
                              msg.direction === "outbound"
                                ? "bg-primary text-primary-foreground"
                                : "bg-card border border-border text-foreground"
                            )}
                          >
                            {msg.body && <p className="whitespace-pre-wrap">{msg.body}</p>}
                            {msg.media_urls && (() => {
                              try { return JSON.parse(msg.media_urls).map((url, i) => (
                                <img key={i} src={url} alt="MMS" className="mt-2 max-w-xs rounded" />
                              )); } catch { return null; }
                            })()}
                            <div className="mt-1 flex items-center gap-1.5">
                              <span className="text-[10px] opacity-70">{msg.channel}</span>
                              {msg.agent_generated && <span className="text-[10px] opacity-70">· AI</span>}
                              <span className="text-[10px] opacity-70">
                                {new Date(msg.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Reply box */}
                <div className="border-t border-border bg-card p-3">
                  {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
                  <div className="flex items-end gap-2">
                    <textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                      placeholder="Type a reply..."
                      rows={2}
                      className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                    />
                    <button
                      onClick={sendReply}
                      disabled={!replyText.trim() || sending}
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
                    >
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Select a conversation to view messages
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'agents' && <AgentsTab />}
      {tab === 'campaigns' && <CampaignsTab />}
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function AgentsTab() {
  const [agents, setAgents] = useState([]);
  const [playbooks, setPlaybooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', agent_tier: 'super', playbook_id: '', target_industry: '', assigned_number: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [agentsRes, pbRes] = await Promise.all([
        base44.functions.invoke('commsConsole', { action: 'listAgents' }),
        base44.functions.invoke('commsConsole', { action: 'listPlaybooks' }),
      ]);
      setAgents(agentsRes?.agents || []);
      setPlaybooks(pbRes?.playbooks || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const createAgent = async () => {
    if (!form.name) return;
    try {
      await base44.functions.invoke('commsConsole', { action: 'createAgent', ...form });
      setForm({ name: '', agent_tier: 'super', playbook_id: '', target_industry: '', assigned_number: '' });
      setShowForm(false);
      load();
    } catch {}
  };

  if (loading) return <div className="flex items-center justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">AI Agent Personas</h2>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          <Plus className="h-4 w-4" /> New Agent
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Agent Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded border border-border bg-background px-3 py-2 text-sm" placeholder="e.g. SEO Recovery Agent" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Agent Tier</label>
              <select value={form.agent_tier} onChange={e => setForm({ ...form, agent_tier: e.target.value })} className="w-full rounded border border-border bg-background px-3 py-2 text-sm">
                {TIERS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Playbook</label>
              <select value={form.playbook_id} onChange={e => setForm({ ...form, playbook_id: e.target.value })} className="w-full rounded border border-border bg-background px-3 py-2 text-sm">
                <option value="">— None —</option>
                {playbooks.map(pb => <option key={pb.id} value={pb.id}>{pb.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Target Industry</label>
              <input value={form.target_industry} onChange={e => setForm({ ...form, target_industry: e.target.value })} className="w-full rounded border border-border bg-background px-3 py-2 text-sm" placeholder="e.g. Real Estate" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Assigned Number (optional)</label>
              <input value={form.assigned_number} onChange={e => setForm({ ...form, assigned_number: e.target.value })} className="w-full rounded border border-border bg-background px-3 py-2 text-sm" placeholder="+1XXXXXXXXXX" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={createAgent} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Create Agent</button>
            <button onClick={() => setShowForm(false)} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {agents.length === 0 ? (
          <div className="col-span-full rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No agents yet. Create one to get started.
          </div>
        ) : agents.map(agent => {
          const tier = TIERS.find(t => t.key === agent.agent_tier) || TIERS[0];
          const Icon = tier.icon;
          return (
            <div key={agent.id} className="rounded-lg border border-border bg-card p-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className={cn("h-5 w-5", tier.color)} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{agent.name}</h3>
                  <p className="text-xs text-muted-foreground">{tier.label}</p>
                </div>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                {agent.target_industry && <p>Industry: {agent.target_industry}</p>}
                {agent.assigned_number && <p>Number: {agent.assigned_number}</p>}
                <p>Capabilities: {(agent.capabilities || []).join(', ')}</p>
                <p>Status: <span className={agent.status === 'active' ? 'text-green-500' : 'text-muted-foreground'}>{agent.status}</span></p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Playbooks section */}
      <div className="mt-8">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground"><BookOpen className="h-4 w-4" /> Available Playbooks</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {playbooks.map(pb => (
            <div key={pb.id} className="rounded-lg border border-border bg-card p-4">
              <h4 className="text-sm font-semibold text-foreground">{pb.name}</h4>
              <p className="mt-1 text-xs text-muted-foreground">{pb.description}</p>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground">{pb.category}</span>
                <span className="text-muted-foreground">{pb.messages.length} day sequence</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CampaignsTab() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('commsConsole', { action: 'listCampaigns' });
      setCampaigns(res?.campaigns || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="flex items-center justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h2 className="mb-6 text-lg font-semibold text-foreground">Campaigns</h2>
      {campaigns.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No campaigns yet. Campaigns let you send bulk SMS with throttling and opt-out enforcement.
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map(camp => (
            <div key={camp.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{camp.name}</h3>
                  <p className="text-xs text-muted-foreground">{camp.channel} · {camp.status}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{camp.total_recipients || 0} recipients</span>
                  <span>{camp.sent_count || 0} sent</span>
                  <span>{camp.delivered_count || 0} delivered</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}