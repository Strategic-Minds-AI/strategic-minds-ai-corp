import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import AdminChatSidebar from './AdminChatSidebar';
import AdminChatConversation from './AdminChatConversation';
import AdminChatSettings from './AdminChatSettings';
import AdminPortalWorkspace from './AdminPortalWorkspace';

export default function AdminChatWorkspace(props) {
  const { user } = useAuth();
  const key = `strategic-admin-chats-${user?.id}`;
  const [chats, setChats] = useState(() => { try { const saved = JSON.parse(localStorage.getItem(key)); return Array.isArray(saved) ? saved : []; } catch { return []; } });
  const [selectedId, setSelectedId] = useState(null);
  const [view, setView] = useState('chat');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { localStorage.setItem(key, JSON.stringify(chats)); }, [chats, key]);
  const current = chats.find(c => c.id === selectedId);
  const newChat = () => { setSelectedId(null); setDraft(''); setError(''); setView('chat'); };
  const select = id => { setSelectedId(id); setError(''); setView('chat'); };
  const remove = id => { setChats(prev => prev.filter(c => c.id !== id)); if (selectedId === id) setSelectedId(null); };
  async function send(e) {
    e.preventDefault(); const text = draft.trim(); if (!text || sending) return;
    const id = selectedId || crypto.randomUUID();
    const existing = chats.find(c => c.id === id);
    const next = [...(existing?.messages || []), { role: 'user', content: text }];
    setSelectedId(id); setDraft(''); setError(''); setSending(true);
    setChats(prev => [{ id, title: existing?.title || text.slice(0, 42), messages: next }, ...prev.filter(c => c.id !== id)]);
    try {
      const { data } = await base44.functions.invoke('adminAssistant', { messages: next });
      setChats(prev => prev.map(c => c.id === id ? { ...c, messages: [...next, { role: 'assistant', content: data.reply }] } : c));
    } catch (err) { setError(err.response?.data?.error || err.message || 'Could not send message. You can try again.'); }
    finally { setSending(false); }
  }
  return <main className="fixed inset-0 z-50 flex overflow-hidden bg-background font-body text-foreground">
    <AdminChatSidebar chats={chats} selectedId={selectedId} view={view} onView={setView} onNew={newChat} onSelect={select} onDelete={remove} onSettings={() => setView('settings')}/>
    {view === 'chat' ? <AdminChatConversation chat={current} draft={draft} onDraft={setDraft} onSend={send} sending={sending} error={error}/> : view === 'settings' ? <AdminChatSettings chats={chats} onClear={() => { setChats([]); setSelectedId(null); }} onBack={() => setView('chatgpt')}/> : <div className="min-w-0 flex-1 overflow-y-auto bg-background"><header className="sticky top-0 z-10 flex h-16 items-center border-b border-border bg-background px-6 pl-16 text-sm font-semibold capitalize text-foreground md:pl-7">{view === 'chatgpt' ? 'MCP connection' : view.replace('-', ' ')}</header><div className="p-5 md:p-8"><AdminPortalWorkspace {...props} active={view}/></div></div>}
  </main>;
}