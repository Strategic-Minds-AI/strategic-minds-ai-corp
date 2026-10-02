// NOTATION: All LLM calls in this app route through the Vercel AI Gateway
// (base44/shared/aiGateway.ts) via the adminAssistant backend function —
// never the credit-blocked built-in InvokeLLM integration.
import { base44 } from '@/api/base44Client';

export async function runChatAction({ messages, mode, attachments, executionMode = 'plan' }) {
  if (executionMode === 'plan' && mode === 'image') throw new Error('Plan mode does not create images.');
  const guidance = executionMode === 'plan' ? 'PLAN MODE: Analyze and draft a plan only. Identify evidence, unknown capabilities, required permissions, approvals, validation and rollback. Do not claim to execute actions or make changes.' : 'BUILD MODE — DRAFT ONLY: Produce reviewable implementation drafts. No sandbox, browser or computer worker is connected to this assistant. Do not claim execution, deployment or independent validation. Flag production mutations, customer messages, secrets, permissions and new spend as requiring explicit operator approval.';
  const guidedMessages = messages.map((message, index) => index === messages.length - 1 ? { ...message, content: `${guidance}\n\n${message.content}` } : message);
  const text = messages.at(-1).content;
  if (mode === 'image') {
    const referenceUrls = await Promise.all(attachments.filter(file => /\.(png|jpe?g|webp)$/i.test(file.name)).map(async file => {
      const result = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: file.file_uri });
      return result.signed_url;
    }));
    const result = await base44.integrations.Core.GenerateImage({ prompt: text, ...(referenceUrls.length ? { existing_image_urls: referenceUrls } : {}) });
    return { content: 'Here is the image you requested.', imageUrl: result.url };
  }
  if (mode === 'web' || attachments.length) {
    // Route through the Vercel AI Gateway via adminAssistant (no built-in InvokeLLM).
    // The gateway does not support live web search or file_url vision; attachment
    // names are passed as context so the assistant is aware of what was shared.
    const attachmentNote = attachments.length
      ? `\n\n[Attachments shared: ${attachments.map(f => f.name).join(', ')}]`
      : '';
    const webNote = mode === 'web'
      ? '\n\n[Web mode: live web search is not available via the AI Gateway — answer from training knowledge and say when a fact cannot be verified.]'
      : '';
    const augmented = guidedMessages.map((m, i) =>
      i === guidedMessages.length - 1 ? { ...m, content: m.content + attachmentNote + webNote } : m
    );
    const { data } = await base44.functions.invoke('adminAssistant', { messages: augmented, executionMode });
    return { content: data.reply };
  }
  const { data } = await base44.functions.invoke('adminAssistant', { messages, executionMode });
  return { content: data.reply };
}