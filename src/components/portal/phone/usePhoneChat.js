import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
export default function usePhoneChat(userId) {
  const [conversations,setConversations] = useState([]), [current,setCurrent] = useState(null), [loading,setLoading] = useState(true), [busy,setBusy] = useState(false), [error,setError] = useState('');
  const selecting = useRef(0); const mounted = useRef(true);
  async function refresh() {
    setLoading(true); setError('');
    try { const list = await base44.agents.listConversations({ agent_name: 'admin_phone', created_by_id: userId }); if (mounted.current) setConversations(list.filter(item => item.created_by_id === userId)); }
    catch (failure) { if (mounted.current) setError(failure.message || 'Could not load conversations.'); }
    finally { if (mounted.current) setLoading(false); }
  }
  useEffect(() => { mounted.current = true; if (userId) refresh(); return () => { mounted.current = false; selecting.current++; }; }, [userId]);
  useEffect(() => {
    if (!current?.id) return;
    const id = current.id;
    return base44.agents.subscribeToConversation(id, update => { if (update.created_by_id === userId || current.created_by_id === userId) setCurrent(previous => previous?.id === id ? { ...previous, ...update } : previous); });
  }, [current?.id,userId]);
  async function select(id) {
    const request = ++selecting.current; setError(''); setLoading(true);
    try { const conversation = await base44.agents.getConversation(id); if (conversation.created_by_id !== userId || conversation.agent_name !== 'admin_phone') throw new Error('This conversation is not available for your account.'); if (mounted.current && selecting.current === request) setCurrent(conversation); }
    catch (failure) { if (mounted.current && selecting.current === request) setError(failure.message || 'Could not open this conversation.'); }
    finally { if (mounted.current && selecting.current === request) setLoading(false); }
  }
  function newChat() { selecting.current++; setCurrent(null); setLoading(false); setError(''); }
  async function send(text) {
    if (busy || !text.trim()) return false; setBusy(true); setError('');
    try {
      const conversation = current || await base44.agents.createConversation({ agent_name: 'admin_phone', metadata: { name: text.trim().slice(0,60) } });
      if (mounted.current) { setCurrent(conversation); setConversations(previous => [conversation, ...previous.filter(item => item.id !== conversation.id)]); }
      const message = await base44.agents.addMessage(conversation, { role: 'user', content: text.trim() });
      if (mounted.current) setCurrent(previous => previous?.id !== conversation.id || previous.messages?.some(item => item.id === message.id) ? previous : { ...previous, messages: [...(previous.messages || []), message] });
      try {
        const latest = await base44.agents.getConversation(conversation.id);
        if (mounted.current) setCurrent(previous => previous?.id === latest.id ? latest : previous);
      } catch { if (mounted.current) setError('Your message was sent, but the latest reply could not be loaded. Reopen the conversation to refresh it.'); }
      return true;
    } catch (failure) { if (mounted.current) setError(failure.message || 'Could not send this message.'); return false; }
    finally { if (mounted.current) setBusy(false); }
  }
  return { conversations,current,loading,busy,error,refresh,select,newChat,send };
}