export default function projectChatOutbox(chats, entries) {
  const cleared = entries.find(entry => entry.action === 'clear');
  const deleted = new Set(entries.filter(entry => entry.action === 'delete').map(entry => entry.chatKey));
  return chats.filter(chat => !deleted.has(chat.id) && !cleared).map(chat => {
    const messages = [...chat.messages];
    for (const entry of entries.filter(item => item.action === 'complete' && item.chatKey === chat.id)) {
      const answerIndex = messages.findIndex(message => message.role === 'assistant' && message.turnKey === entry.turnKey);
      const answer = { ...entry.assistantMessage, turnKey: entry.turnKey, syncPending: true };
      if (answerIndex >= 0) messages[answerIndex] = answer;
      else { const userIndex = messages.findIndex(message => message.role === 'user' && message.turnKey === entry.turnKey); if (userIndex >= 0) messages.splice(userIndex + 1, 0, answer); }
    }
    return { ...chat, messages };
  });
}