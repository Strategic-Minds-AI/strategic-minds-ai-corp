import { base44 } from '@/api/base44Client';

export async function runChatAction({ messages, mode, attachments }) {
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
    const urls = await Promise.all(attachments.map(async file => {
      const result = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: file.file_uri });
      return result.signed_url;
    }));
    const user = await base44.auth.me();
    const context = messages.slice(-8).map(m => `${m.role}: ${m.content}`).join('\n\n');
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are the Strategic Minds AI agency administrator's assistant. Do not claim access to portal records or permission to change them. Follow these personal response preferences when appropriate:\n${(user.assistant_instructions || '').slice(0, 15000)}\n\nConversation:\n${context}\n\n${mode === 'web' ? 'Use current online information. Include source links for factual claims; say when a fact cannot be verified.' : 'Analyze the attached files in the context of the latest user message.'}`,
      ...(urls.length ? { file_urls: urls } : {}),
      ...(mode === 'web' ? { add_context_from_internet: true } : {}),
    });
    return { content: typeof result === 'string' ? result : JSON.stringify(result) };
  }
  const { data } = await base44.functions.invoke('adminAssistant', { messages });
  return { content: data.reply };
}