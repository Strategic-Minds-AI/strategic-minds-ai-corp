import { chatKey, chatMessage } from './adminChatValidation.ts';
import { ensureConversation, findConversation, touchConversation } from './adminChatConversations.ts';
export async function beginTurn(base44, ownerId, body, importing = false) {
  const turnKey = chatKey(body.turnKey); const userMessage = chatMessage(body.userMessage, 'user');
  const assistantMessage = body.assistantMessage === undefined ? undefined : chatMessage(body.assistantMessage, 'assistant');
  const conversation = await ensureConversation(base44, ownerId, body);
  if (conversation.archived) return importing ? { skipped: true } : { error: 'This conversation was deleted on another device.', status: 409 };
  const existing = await base44.entities.AdminChatTurn.filter({ owner_id: ownerId, chat_key: body.chatKey, turn_key: turnKey }, 'created_date', 100);
  if (existing.length >= 100) throw new Error('Turn references need reconciliation.');
  let turn = existing[0];
  if (turn && JSON.stringify(turn.user_message) !== JSON.stringify(userMessage)) return { error: 'The turn reference belongs to a different message.', status: 409 };
  if (!turn) turn = await base44.entities.AdminChatTurn.create({ owner_id: ownerId, chat_key: body.chatKey, turn_key: turnKey, user_message: userMessage, ...(assistantMessage ? { assistant_message: assistantMessage } : {}), status: assistantMessage ? 'complete' : importing ? 'failed' : 'pending', error: '' });
  else if (importing && assistantMessage && !turn.assistant_message) turn = await base44.entities.AdminChatTurn.update(turn.id, { assistant_message: assistantMessage, status: 'complete', error: '' });
  if ((await findConversation(base44, ownerId, body.chatKey)).archived) {
    await base44.entities.AdminChatTurn.deleteMany({ owner_id: ownerId, chat_key: body.chatKey });
    return importing ? { skipped: true } : { error: 'This conversation was deleted on another device.', status: 409 };
  }
  await touchConversation(base44, ownerId, body.chatKey);
  return { turn };
}
export async function finishTurn(base44, ownerId, body, failed = false) {
  chatKey(body.chatKey); chatKey(body.turnKey);
  const found = await findConversation(base44, ownerId, body.chatKey);
  if (!found.row || found.archived) return { error: 'This conversation was deleted on another device.', status: 409 };
  const rows = await base44.entities.AdminChatTurn.filter({ owner_id: ownerId, chat_key: body.chatKey, turn_key: body.turnKey }, 'created_date', 100);
  if (!rows.length) return { error: 'The saved conversation turn was not found.', status: 404 };
  if (failed && rows.some(row => row.assistant_message)) return { turn: rows.find(row => row.assistant_message) };
  const message = failed ? null : chatMessage(body.assistantMessage, 'assistant');
  if (!failed && rows.some(row => row.assistant_message && (row.assistant_message.content !== message.content || row.assistant_message.imageUrl !== message.imageUrl))) return { error: 'A different response is already saved; it will not be overwritten.', status: 409 };
  const savedUrl = rows.find(row => row.assistant_message?.savedUrl)?.assistant_message?.savedUrl;
  if (!failed && savedUrl && message.savedUrl && message.savedUrl !== savedUrl) return { error: 'A different Drive result is already saved.', status: 409 };
  if (!failed && savedUrl) message.savedUrl = savedUrl;
  const change = failed ? { status: 'failed', error: typeof body.error === 'string' ? body.error.slice(0, 400) : 'Response was not saved.' } : { status: 'complete', assistant_message: message, error: '' };
  await base44.entities.AdminChatTurn.updateMany({ owner_id: ownerId, chat_key: body.chatKey, turn_key: body.turnKey }, { $set: change });
  if ((await findConversation(base44, ownerId, body.chatKey)).archived) {
    await base44.entities.AdminChatTurn.deleteMany({ owner_id: ownerId, chat_key: body.chatKey });
    return { error: 'This conversation was deleted on another device.', status: 409 };
  }
  await touchConversation(base44, ownerId, body.chatKey);
  return { saved: true };
}