export function chatKey(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{8,100}$/.test(value)) throw new Error('Invalid conversation reference.');
  return value;
}
export function chatMessage(value, role) {
  const allowed = role === 'user' ? ['role','content','attachments'] : ['role','content','imageUrl','savedUrl'];
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !allowed.includes(key)) || value.role !== role || typeof value.content !== 'string' || !value.content.trim() || value.content.length > 60000) throw new Error('Invalid or oversized chat message.');
  const result = { role, content: value.content, ...(role === 'user' ? { attachments: [] } : {}) };
  if (value.attachments != null) {
    if (!Array.isArray(value.attachments) || value.attachments.length > 5 || value.attachments.some(file => !file || Object.keys(file).some(key => !['name','file_uri'].includes(key)) || typeof file.name !== 'string' || !file.name || file.name.length > 200 || typeof file.file_uri !== 'string' || !file.file_uri || file.file_uri.length > 1000 || /^data:/i.test(file.file_uri))) throw new Error('Use private upload references, not file contents or public URLs.');
    result.attachments = value.attachments.map(file => ({ name: file.name, file_uri: file.file_uri }));
  }
  for (const key of ['imageUrl','savedUrl']) if (value[key] !== undefined) {
    if (typeof value[key] !== 'string' || value[key].length > 2000 || !/^https:\/\//i.test(value[key])) throw new Error('Invalid saved result link.');
    result[key] = value[key];
  }
  return result;
}
export function pageOffset(value) {
  if (value === undefined) return 0;
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('Invalid history page.');
  return value;
}