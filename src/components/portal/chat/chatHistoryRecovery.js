// Live account history is required; recovering older browser data must not block chat.
export async function loadChatSnapshot(load, project) {
  const snapshot = await load();
  try { return { chats: project(snapshot), warning: '' }; }
  catch (failure) {
    return { chats: snapshot, warning: `Your saved account history loaded, but unsaved browser history could not be restored: ${failure.message}` };
  }
}
export default async function chatHistoryRecovery(refresh, operations) {
  const warnings = [];
  const load = async () => { const warning = await refresh(); if (warning) warnings.push(warning); };
  await load();
  for (const operation of operations) {
    try { await operation(); }
    catch (failure) { warnings.push(`Older conversation recovery needs attention: ${failure.response?.data?.error || failure.message}`); }
  }
  await load();
  return [...new Set(warnings)].join(' ');
}