const key = ownerId => `strategic-admin-chat-outbox-${ownerId}`;
const memory = new Map();
function saveOutbox(ownerId, entries) {
  memory.set(ownerId, entries);
  try { if (entries.length) localStorage.setItem(key(ownerId), JSON.stringify(entries)); else localStorage.removeItem(key(ownerId)); }
  catch { /* Keep this session's retry queue when the browser cannot cache it. */ }
}
export function readOutbox(ownerId) {
  if (memory.has(ownerId)) return memory.get(ownerId);
  const saved = localStorage.getItem(key(ownerId));
  if (!saved) return [];
  const entries = JSON.parse(saved);
  if (!Array.isArray(entries)) throw new Error('The unsaved conversation queue could not be read.');
  return entries;
}
export function enqueueOperation(ownerId, payload) {
  const entries = payload.action === 'clear' ? [] : readOutbox(ownerId).filter(item => item.chatKey !== payload.chatKey || (payload.action !== 'delete' && (item.turnKey !== payload.turnKey || item.action !== payload.action)));
  saveOutbox(ownerId, [...entries, payload]);
}
export function removeOperation(ownerId, payload) {
  saveOutbox(ownerId, readOutbox(ownerId).filter(item => JSON.stringify(item) !== JSON.stringify(payload)));
}