import { chatKey } from './adminChatValidation.ts';
export async function findConversation(base44, ownerId, key) {
  const rows = await base44.entities.AdminConversation.filter({ owner_id: ownerId, chat_key: chatKey(key) }, 'created_date', 100);
  if (rows.length >= 100) throw new Error('Conversation references need reconciliation.');
  return { row: rows[0] || null, archived: rows.some(row => row.archived) };
}
export async function ensureConversation(base44, ownerId, body) {
  const found = await findConversation(base44, ownerId, body.chatKey);
  if (found.archived) return { archived: true };
  if (found.row) return found;
  if (typeof body.title !== 'string' || !body.title.trim() || body.title.length > 120) throw new Error('Invalid conversation title.');
  return { row: await base44.entities.AdminConversation.create({ owner_id: ownerId, chat_key: body.chatKey, title: body.title.trim(), archived: false, last_activity: new Date().toISOString() }), archived: false };
}
export async function touchConversation(base44, ownerId, key) {
  await base44.entities.AdminConversation.updateMany({ owner_id: ownerId, chat_key: key, archived: false }, { $set: { last_activity: new Date().toISOString() } });
}
export async function deleteConversations(base44, ownerId, key, before) {
  const query = { owner_id: ownerId, archived: false, ...(key ? { chat_key: chatKey(key) } : { created_date: { $lte: before } }) };
  let result;
  do { result = await base44.entities.AdminConversation.updateMany(query, { $set: { archived: true, title: 'Deleted conversation' } }); } while (result.has_more);
  let skip = 0;
  do {
    const rows = await base44.entities.AdminConversation.filter({ owner_id: ownerId, archived: true, ...(key ? { chat_key: key } : {}) }, 'created_date', 100, skip);
    if (rows.length) await base44.entities.AdminChatTurn.deleteMany({ owner_id: ownerId, chat_key: { $in: [...new Set(rows.map(row => row.chat_key))] } });
    if (rows.length < 100) break;
    skip += rows.length;
  } while (true);
  return { deleted: true, retained_metadata: 'Opaque conversation references prevent old devices reimporting deleted messages.' };
}