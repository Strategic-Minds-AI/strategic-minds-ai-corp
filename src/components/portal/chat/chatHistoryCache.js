// Local cache of the last successfully loaded chat history.
// Survives navigation away and back — the UI shows cached chats instantly
// while the backend sync runs in the background. If the sync fails, the
// cached chats remain visible instead of disappearing.
const cacheKey = ownerId => `strategic-admin-chat-cache-${ownerId}`;

export function readChatCache(ownerId) {
  if (!ownerId) return null;
  try {
    const raw = localStorage.getItem(cacheKey(ownerId));
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!Array.isArray(data.chats)) return null;
    return { chats: data.chats, savedAt: data.savedAt || 0 };
  } catch { return null; }
}

export function writeChatCache(ownerId, chats) {
  if (!ownerId) return;
  try {
    localStorage.setItem(cacheKey(ownerId), JSON.stringify({ chats, savedAt: Date.now() }));
  } catch { /* quota or private mode — cache is best-effort */ }
}

export function clearChatCache(ownerId) {
  if (!ownerId) return;
  try { localStorage.removeItem(cacheKey(ownerId)); } catch { /* ignore */ }
}