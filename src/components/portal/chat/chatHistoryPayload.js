function savedMessage(message, role) {
  if (!message || typeof message !== 'object' || Array.isArray(message)) return message;
  const saved = { role: message.role, content: message.content };
  if (role === 'user' && message.attachments !== undefined) {
    saved.attachments = Array.isArray(message.attachments)
      ? message.attachments.map(file => file && typeof file === 'object' ? { name: file.name, file_uri: file.file_uri } : file)
      : message.attachments;
  }
  if (role === 'assistant') {
    for (const field of ['imageUrl', 'savedUrl']) if (message[field] !== undefined && message[field] !== null && message[field] !== '') saved[field] = message[field];
  }
  return saved;
}
export default function chatHistoryPayload(payload) {
  return { ...payload,
    ...(payload.userMessage !== undefined ? { userMessage: savedMessage(payload.userMessage, 'user') } : {}),
    ...(payload.assistantMessage !== undefined ? { assistantMessage: savedMessage(payload.assistantMessage, 'assistant') } : {}),
  };
}