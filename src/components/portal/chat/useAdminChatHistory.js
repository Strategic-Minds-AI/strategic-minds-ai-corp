import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { historyRequest, loadHistory } from '@/components/portal/chat/chatHistoryApi';
import { enqueueOperation, readOutbox } from '@/components/portal/chat/chatHistoryOutbox';
import projectChatOutbox from '@/components/portal/chat/projectChatOutbox';
import synchronizeChatOutbox from '@/components/portal/chat/synchronizeChatOutbox';
import migrateChatHistory from '@/components/portal/chat/migrateChatHistory';
export default function useAdminChatHistory(ownerId) {
  const [chats,setChats] = useState([]); const [scope,setScope] = useState(ownerId); const [loading,setLoading] = useState(true); const [ready,setReady] = useState(false); const [error,setError] = useState(''); const [busy,setBusy] = useState(0);
  const ticket = useRef(0); const hydrated = useRef(false); const flushing = useRef(null);
  const refresh = useCallback(async () => {
    const request = ++ticket.current; const snapshot = await loadHistory(ownerId);
    if (request === ticket.current) setChats(projectChatOutbox(snapshot, readOutbox(ownerId)));
  },[ownerId]);
  const flush = useCallback(() => {
    if (!flushing.current) flushing.current = synchronizeChatOutbox(ownerId).finally(() => { flushing.current = null; });
    return flushing.current;
  },[ownerId]);
  const synchronize = useCallback(async () => {
    if (!ownerId) return; setLoading(true); setError('');
    try { await migrateChatHistory(ownerId); await flush(); await refresh(); hydrated.current = true; setReady(true); }
    catch (failure) { setError(failure.response?.data?.error || failure.message || 'History synchronization failed. Your existing browser history is retained until import succeeds.'); }
    finally { setLoading(false); }
  },[ownerId,flush,refresh]);
  useEffect(() => {
    setScope(ownerId); setChats([]); setReady(false); hydrated.current = false; synchronize();
    const update = event => { if (hydrated.current && (!event?.data?.owner_id || event.data.owner_id === ownerId)) refresh().catch(failure => setError(failure.message || 'Could not refresh history.')); };
    const subscriptions = ownerId ? [base44.entities.AdminConversation.subscribe(update),base44.entities.AdminChatTurn.subscribe(update)] : [];
    const timer = setInterval(() => { if (!document.hidden) update(); },15000); window.addEventListener('focus',update); window.addEventListener('online',synchronize);
    return () => { ticket.current++; hydrated.current = false; subscriptions.forEach(unsubscribe => unsubscribe()); clearInterval(timer); window.removeEventListener('focus',update); window.removeEventListener('online',synchronize); };
  },[ownerId,refresh,synchronize]);
  async function work(operation) {
    ticket.current++; setBusy(count => count + 1); setError('');
    try { const result = await operation(); await refresh(); return result; }
    catch (failure) { setError(failure.response?.data?.error || failure.message || 'History was not saved. Retry synchronization.'); throw failure; }
    finally { setBusy(count => count - 1); }
  }
  async function queued(payload) {
    return work(async () => { enqueueOperation(ownerId,payload); setChats(previous => projectChatOutbox(previous,readOutbox(ownerId))); const discarded = await flush(); if (discarded.some(item => item.chatKey === payload.chatKey && item.turnKey === payload.turnKey)) throw new Error('This conversation was deleted on another device; its unsaved response was discarded.'); });
  }
  return { chats: scope === ownerId ? chats : [], loading: loading || scope !== ownerId, ready: ready && !loading && !error && scope === ownerId, busy: busy > 0, error, retry: synchronize,
    begin: payload => work(() => historyRequest(ownerId,'begin',payload)),
    complete: payload => queued({ ...payload,action:'complete' }),
    fail: async payload => { try { await work(() => historyRequest(ownerId,'fail',payload)); } catch { /* The visible synchronization error preserves the failure; no model retry. */ } },
    remove: chatKey => queued({ action:'delete',chatKey }),
    clear: () => work(async () => { const { before } = await historyRequest(ownerId,'prepareClear'); enqueueOperation(ownerId,{ action:'clear',before }); setChats(previous => projectChatOutbox(previous,readOutbox(ownerId))); await flush(); })
  };
}