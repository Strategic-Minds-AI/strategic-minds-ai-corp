// Gateway wire contracts mirror the published Vercel speech/transcription/video protocol.
import { gatewayRequest } from './gateway.mjs';
import { requireUser } from './auth.mjs';
import { uploadFile, signedUrl } from './storage.mjs';
const protocol = (kind, model) => ({ 'ai-model-id': model, [`ai-${kind}-model-specification-version`]: '4' });
const native = async (kind, model, body, suffix = '') => (await gatewayRequest(`/ai/${kind}-model${suffix}`, body, { headers: protocol(kind, model) })).json();
const save = async (bytes, name, type, user) => {
  const uploaded = await uploadFile(new File([bytes], name, {type}), user, false);
  return { ...uploaded, url: (await signedUrl(uploaded, user)).signed_url };
};
export async function generateSpeech(request, payload) {
  const user = await requireUser(request);
  if (typeof payload.text !== 'string' || !payload.text.trim() || payload.text.length > 5000) throw new Error('Enter text up to 5000 characters');
  const result = await native('speech', process.env.AI_GATEWAY_SPEECH_MODEL || 'openai/tts-1', { text: payload.text, voice: payload.voice || 'alloy', outputFormat:'mp3', ...(payload.language_code ? {language:payload.language_code} : {}) });
  if (!result.audio) throw new Error('Gateway did not return speech');
  return save(Buffer.from(result.audio, 'base64'), 'speech.mp3', 'audio/mpeg', user);
}
export async function transcribeAudio(request, payload) {
  const user = await requireUser(request);
  const url = payload.file_uri ? (await signedUrl(payload, user)).signed_url : payload.audio_url;
  // Do not permit arbitrary server-side fetches; recordings must be in this deployment's storage.
  if (!url || new URL(url).origin !== new URL(process.env.SUPABASE_URL).origin || !new URL(url).pathname.startsWith('/storage/v1/')) throw new Error('Upload the recording to your storage first');
  const response = await fetch(url); if (!response.ok) throw new Error('Could not load recording');
  const bytes = Buffer.from(await response.arrayBuffer()); if (bytes.length > 25*1024*1024) throw new Error('Recording exceeds 25 MB');
  const result = await native('transcription', process.env.AI_GATEWAY_TRANSCRIPTION_MODEL || 'openai/whisper-1', {audio:bytes.toString('base64'),mediaType:response.headers.get('Content-Type') || 'audio/mpeg'});
  return result.text;
}
export async function generateVideo(request, payload) {
  const user = await requireUser(request); const model = process.env.AI_GATEWAY_VIDEO_MODEL || 'google/veo-3.1-fast-generate-001';
  const start = await native('video', model, { prompt:payload.prompt,n:1,duration:payload.duration || 6,aspectRatio:payload.aspect_ratio || '16:9',generateAudio:payload.generate_audio === true }, '/start');
  const deadline = Date.now() + 540000;
  while (Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve,5000));
    const result = await native('video',model,{operation:start.operation},'/status');
    if (result.status === 'error' || result.status === 'cancelled') throw new Error(result.error || 'Video generation cancelled');
    if (result.status !== 'completed') continue;
    const video = result.videos?.[0]; if (!video) throw new Error('Gateway returned no video');
    if (video.type === 'url') return {url:video.url};
    return save(Buffer.from(video.data,'base64'),'video.mp4',video.mediaType || 'video/mp4',user);
  }
  throw new Error('Video generation timed out');
}