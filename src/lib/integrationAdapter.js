// AI and file services are server-side. No gateway key is embedded in the browser.
import { getAccessToken } from '@/lib/supabaseClient';
import { runtimeRequest } from '@/lib/runtimeTransport';
const upload = async (name, { file }) => {
  const body = new FormData(); body.append('file', file);
  return runtimeRequest(`/integrations/${name}`, body, { token: await getAccessToken(), form: true });
};
const invoke = async (name, payload) => runtimeRequest(`/integrations/${name}`, payload, { token: await getAccessToken() });
export const integrations = { Core: {
  InvokeLLM: payload => invoke('InvokeLLM', payload),
  GenerateImage: payload => invoke('GenerateImage', payload),
  ExtractDataFromUploadedFile: payload => invoke('ExtractDataFromUploadedFile', payload),
  GenerateSpeech: payload => invoke('GenerateSpeech', payload),
  TranscribeAudio: payload => invoke('TranscribeAudio', payload),
  GenerateVideo: payload => invoke('GenerateVideo', payload),
  SendEmail: payload => invoke('SendEmail', payload),
  SendPushNotification: payload => invoke('SendPushNotification', payload),
  UploadPrivateFile: payload => upload('UploadPrivateFile', payload),
  UploadPublicFile: payload => upload('UploadPublicFile', payload),
  CreateFileSignedUrl: payload => invoke('CreateFileSignedUrl', payload),
} };