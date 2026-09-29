import { base44 } from '@/api/base44Client';
export async function historyRequest(ownerId, action, payload = {}) {
  return (await base44.functions.invoke('adminChatHistory', { ...payload, ownerId, action })).data;
}
async function pages(ownerId, action, payload = {}) {
  const rows = []; let skip = 0;
  do {
    const result = await historyRequest(ownerId, action, { ...payload, skip });
    rows.push(...result.rows); skip = result.nextSkip;
  } while (skip !== null);
  return [...new Map(rows.map(row => [row.id, row])).values()];
}
export async function loadHistory(ownerId) {
  const records = await pages(ownerId, 'conversations');
  const deleted = new Set(records.filter(row => row.archived).map(row => row.chat_key));
  const conversations = new Map();
  for (const row of records) if (!deleted.has(row.chat_key)) {
    const old = conversations.get(row.chat_key);
    if (!old || row.last_activity > old.last_activity) conversations.set(row.chat_key, row);
  }
  const keys = [...conversations.keys()]; const turns = [];
  for (let index = 0; index < keys.length; index += 40) turns.push(...await pages(ownerId, 'turns', { chatKeys: keys.slice(index, index + 40) }));
  const unique = new Map();
  for (const turn of turns) {
    const key = `${turn.chat_key}/${turn.turn_key}`; const previous = unique.get(key);
    if (!previous || (turn.assistant_message && !previous.assistant_message) || (Boolean(turn.assistant_message) === Boolean(previous.assistant_message) && turn.updated_date > previous.updated_date)) unique.set(key, turn);
  }
  return [...conversations.values()].sort((a,b) => b.last_activity.localeCompare(a.last_activity)).map(row => ({ id: row.chat_key, title: row.title, messages: [...unique.values()].filter(turn => turn.chat_key === row.chat_key).sort((a,b) => a.created_date.localeCompare(b.created_date) || a.turn_key.localeCompare(b.turn_key)).flatMap(turn => [{ ...turn.user_message, turnKey: turn.turn_key, deliveryStatus: turn.status }, ...(turn.assistant_message ? [{ ...turn.assistant_message, turnKey: turn.turn_key }] : [])]) }));
}