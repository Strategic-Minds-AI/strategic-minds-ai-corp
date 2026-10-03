import { base44 } from '@/api/base44Client';
import { runChatAction } from '@/components/portal/adminChatActions';
export default function useAdminChatSender({ history, chats, selectedId, setSelectedId, draft, setDraft, sending, setSending, setError, uploading, attachments, setAttachments, mode, setMode, executionMode, quickTask, setQuickTask, projectId }) {
  return async function send(event) {
    event.preventDefault(); const text = draft.trim() || (attachments.length ? 'Please analyze these attachments.' : '');
    if (!text || sending || uploading || !history.ready || history.busy) return;
    if (executionMode === 'plan' && mode === 'image') { setError('Plan mode does not generate images. Switch to Build for an image draft.'); return; }
    if (quickTask && mode === 'image') { setError('Finish this project task before creating an image.'); return; }
    if (mode === 'image' && attachments.some(file => !/\.(png|jpe?g|webp)$/i.test(file.name))) { setError('Image creation can use photos as references; remove other attached files first.'); return; }
    if (quickTask && executionMode === 'build' && !projectId) { setError('Choose a project first so the output can be saved to its Drive folder.'); return; }
    if (quickTask === 'notes' && text.includes('[Paste client notes here before sending]')) { setError('Paste the notes before requesting a summary.'); return; }
    const task = executionMode === 'build' ? quickTask : null; const destination = projectId;
    const chatKey = selectedId || crypto.randomUUID(); const turnKey = crypto.randomUUID();
    const existing = chats.find(chat => chat.id === chatKey); const files = attachments; const selectedMode = mode;
    const userMessage = { role: 'user', content: text, ...(files.length ? { attachments: files } : {}) };
    const next = [...(existing?.messages || []), userMessage]; let started = false; let answer = null;
    setError(''); setSending(true);
    try {
      await history.begin({ chatKey, turnKey, title: existing?.title || text.slice(0,42), userMessage });
      started = true; setSelectedId(chatKey); setDraft('');
      answer = await runChatAction({ messages: next, mode: selectedMode, attachments: files, executionMode });
      const assistantMessage = { role: 'assistant', content: answer.content, ...(answer.imageUrl ? { imageUrl: answer.imageUrl } : {}) };
      await history.complete({ chatKey, turnKey, assistantMessage });
      setAttachments([]); setMode(null); setQuickTask(null);
      if (task) {
        try {
          const label = task === 'notes' ? 'Client notes summary' : 'Project outline';
          const name = `${label} ${new Date().toISOString().replace(/[:.]/g,'-')}.md`;
          const saved = await base44.functions.invoke('agencyDriveIngest', { action: 'saveProjectText', projectId: destination, name, content: `# ${label}\n\n${answer.content}`, approved: true });
          await history.complete({ chatKey, turnKey, assistantMessage: { ...assistantMessage, savedUrl: saved.data.file.webViewLink } });
        } catch (failure) { setError(`The answer is here, but saving its Drive deliverable failed: ${failure.response?.data?.error || failure.message}`); }
      }
    } catch (failure) {
      if (!answer) { setDraft(text); if (started) await history.fail({ chatKey, turnKey, error: failure.response?.data?.error || failure.message }); }
      setError(answer ? (/deleted/.test(failure.message || '') ? failure.message : 'The response could not finish synchronizing. Keep this page open and use Retry synchronization without regenerating it.') : failure.response?.data?.error || failure.message || 'Could not send the message.');
    } finally { setSending(false); }
  };
}