import { callAIGateway, gatewayRequest } from './gateway.mjs';
import { requireUser } from './auth.mjs';
import { uploadFile, signedUrl, persistGeneratedImage } from './storage.mjs';
import { notConfigured } from './runtime.mjs';
import { generateSpeech, transcribeAudio, generateVideo } from './media.mjs';
import { sendEmail } from './mail.mjs';
export function createIntegrations(request) {
  const invoke = async payload => {
    await requireUser(request);
    const files = typeof payload.file_urls === 'string' ? [payload.file_urls] : payload.file_urls || [];
    const content = [{ type: 'text', text: payload.prompt }];
    for (const url of files) {
      if (/\.(pdf)(\?|$)/i.test(url)) content.push({ type: 'file', file: { file_data: url, filename: 'document.pdf' } });
      else content.push({ type: 'image_url', image_url: { url } });
    }
    const result = await callAIGateway({ model: payload.add_context_from_internet ? process.env.AI_GATEWAY_SEARCH_MODEL || 'perplexity/sonar' : payload.model, messages: [{ role: 'user', content: files.length ? content : payload.prompt }], jsonSchema: payload.response_json_schema, maxTokens: payload.max_tokens || 8192 });
    return payload.response_json_schema ? result.json : result.content;
  };
  return { Core: {
    InvokeLLM: invoke,
    GenerateImage: async payload => {
      const user = await requireUser(request);
      const content = [{ type: 'text', text: payload.prompt }, ...(payload.existing_image_urls || []).map(url => ({ type: 'image_url', image_url: { url } }))];
      const data = await (await gatewayRequest('/chat/completions', { model: process.env.AI_GATEWAY_IMAGE_MODEL || 'google/gemini-3.1-flash-image-preview', messages: [{ role: 'user', content }], modalities: ['text', 'image'], stream: false })).json();
      return persistGeneratedImage(data.choices?.[0]?.message?.images?.[0]?.image_url?.url, user);
    },
    ExtractDataFromUploadedFile: async payload => ({ status: 'success', details: null, output: await invoke({ prompt: 'Extract the document data accurately. Do not invent missing fields.', file_urls: [payload.file_url], response_json_schema: payload.json_schema }) }),
    UploadPrivateFile: async payload => uploadFile(payload.file, await requireUser(request), false),
    UploadPublicFile: async payload => uploadFile(payload.file, await requireUser(request), true),
    CreateFileSignedUrl: async payload => signedUrl(payload, await requireUser(request)),
    SendEmail: payload => sendEmail(request, payload),
    SendPushNotification: async () => { throw notConfigured('Native push delivery provider'); },
    GenerateSpeech: payload => generateSpeech(request, payload),
    TranscribeAudio: payload => transcribeAudio(request, payload),
    GenerateVideo: payload => generateVideo(request, payload),
  } };
}