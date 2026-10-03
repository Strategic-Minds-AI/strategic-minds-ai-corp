import { getAccessToken } from '@/lib/supabaseClient';
import { API_BASE, runtimeRequest } from '@/lib/runtimeTransport';
const call = async (action, payload) => runtimeRequest('/agents', { action, ...payload }, { token: await getAccessToken() });
const listeners = new Map();
const notify = conversation => listeners.get(conversation.id)?.forEach(callback => callback(conversation));
export const agents = {
  createConversation: payload => call('create', payload),
  listConversations: payload => call('list', payload),
  getConversation: id => call('get', { id }),
  updateConversation: (id, payload) => call('update', { id, ...payload }),
  async addMessage(conversation, message) { const updated = await call('message', { id: conversation.id, message }); notify(updated); return updated.messages.at(-1); },
  subscribeToConversation(id, callback) {
    if (!listeners.has(id)) listeners.set(id, new Set()); listeners.get(id).add(callback);
    const interval = setInterval(() => call('get', { id }).then(value => callback(value)), 5000);
    return () => { clearInterval(interval); listeners.get(id)?.delete(callback); };
  },
  getWhatsAppConnectURL: () => import.meta.env.VITE_WHATSAPP_ASSISTANT_URL || `${API_BASE}/channels/whatsapp`,
};
export const connectors = {
  connectAppUser: async connector_id => (await runtimeRequest('/connections/connect', { connector_id }, { token: await getAccessToken() })).url,
  disconnectAppUser: async connector_id => runtimeRequest('/connections/disconnect', { connector_id }, { token: await getAccessToken() }),
};