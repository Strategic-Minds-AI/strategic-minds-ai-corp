import { historyRequest } from '@/components/portal/chat/chatHistoryApi';
export default async function migrateChatHistory(ownerId) {
  const key = `strategic-admin-chats-${ownerId}`; const raw = localStorage.getItem(key);
  if (!raw) return;
  const chats = JSON.parse(raw);
  if (!Array.isArray(chats)) throw new Error('Existing browser history is invalid; it has been kept unchanged.');
  for (const chat of [...chats].reverse()) {
    if (!Array.isArray(chat.messages)) throw new Error('An existing conversation could not be imported; browser history is kept unchanged.');
    for (let index = 0; index < chat.messages.length; index++) {
      const userMessage = chat.messages[index];
      if (userMessage.role !== 'user') throw new Error('An existing conversation has an unsupported message order; browser history is kept unchanged.');
      const bytes = new TextEncoder().encode(JSON.stringify({ chatKey: chat.id, index, userMessage }));
      const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(byte => byte.toString(16).padStart(2,'0')).join('');
      const assistantMessage = chat.messages[index + 1]?.role === 'assistant' ? chat.messages[++index] : undefined;
      await historyRequest(ownerId, 'import', { chatKey: chat.id, title: chat.title, turnKey: `legacy-${digest}`, userMessage, ...(assistantMessage ? { assistantMessage } : {}) });
    }
  }
  localStorage.removeItem(key);
}