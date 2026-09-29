import { historyRequest } from '@/components/portal/chat/chatHistoryApi';
import { readOutbox, removeOperation } from '@/components/portal/chat/chatHistoryOutbox';
export default async function synchronizeChatOutbox(ownerId) {
  const discarded = [];
  while (readOutbox(ownerId).length) {
    const entry = readOutbox(ownerId)[0];
    try { await historyRequest(ownerId, entry.action, entry); }
    catch (failure) {
      const deleted = entry.action === 'complete' && failure.response?.status === 409 && /deleted/.test(failure.response?.data?.error || '');
      if (!deleted) throw failure;
      discarded.push(entry);
    }
    removeOperation(ownerId, entry);
  }
  return discarded;
}