// Replaces base44.integrations.Core.* — direct implementations that don't
// route through Base44's server.
//
// - InvokeLLM → Vercel AI Gateway (AI_GATEWAY_API_KEY)
// - SendEmail → Railway endpoint (or direct SMTP/Resend in future)
// - UploadPrivateFile / UploadPublicFile → Railway storage endpoint
// - GenerateImage → Vercel AI Gateway image endpoint
// - ExtractDataFromUploadedFile → Railway endpoint
// - TranscribeAudio / GenerateSpeech / GenerateVideo → Railway endpoints
//
// During transition, unmigrated integrations fall back to Base44.

import { getAccessToken } from './supabaseClient';

const RAILWAY_URL = import.meta.env.VITE_RAILWAY_API_URL || '';
const AI_GATEWAY_URL = import.meta.env.VITE_AI_GATEWAY_URL || 'https://ai-gateway.vercel.sh/v1';

// Lazy Base44 fallback
let _base44Fallback = null;
async function _getBase44Fallback() {
  if (!_base44Fallback) {
    const { createClient } = await import('@base44/sdk');
    const { appParams } = await import('@/lib/app-params');
    _base44Fallback = createClient({ ...appParams, serverUrl: '', requiresAuth: false });
  }
  return _base44Fallback;
}

async function _railwayHeaders() {
  const token = await getAccessToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const integrations = {
  Core: {
    async InvokeLLM(payload) {
      // Route through Vercel AI Gateway directly
      if (import.meta.env.VITE_AI_GATEWAY_API_KEY) {
        return _invokeAIGateway(payload);
      }
      // Fallback to Base44 during transition
      const client = await _getBase44Fallback();
      return client.integrations.Core.InvokeLLM(payload);
    },

    async SendEmail(payload) {
      if (RAILWAY_URL) {
        const res = await fetch(`${RAILWAY_URL}/integrations/sendEmail`, {
          method: 'POST',
          headers: await _railwayHeaders(),
          body: JSON.stringify(payload),
        });
        return res.json();
      }
      const client = await _getBase44Fallback();
      return client.integrations.Core.SendEmail(payload);
    },

    async UploadPrivateFile(payload) {
      if (RAILWAY_URL) {
        const token = await getAccessToken();
        const formData = new FormData();
        formData.append('file', payload.file);
        const res = await fetch(`${RAILWAY_URL}/integrations/uploadPrivateFile`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
        return res.json();
      }
      const client = await _getBase44Fallback();
      return client.integrations.Core.UploadPrivateFile(payload);
    },

    async UploadPublicFile(payload) {
      if (RAILWAY_URL) {
        const token = await getAccessToken();
        const formData = new FormData();
        formData.append('file', payload.file);
        const res = await fetch(`${RAILWAY_URL}/integrations/uploadPublicFile`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
        return res.json();
      }
      const client = await _getBase44Fallback();
      return client.integrations.Core.UploadPublicFile(payload);
    },

    async CreateFileSignedUrl(payload) {
      if (RAILWAY_URL) {
        const res = await fetch(`${RAILWAY_URL}/integrations/createSignedUrl`, {
          method: 'POST',
          headers: await _railwayHeaders(),
          body: JSON.stringify(payload),
        });
        return res.json();
      }
      const client = await _getBase44Fallback();
      return client.integrations.Core.CreateFileSignedUrl(payload);
    },

    async GenerateImage(payload) {
      const client = await _getBase44Fallback();
      return client.integrations.Core.GenerateImage(payload);
    },

    async ExtractDataFromUploadedFile(payload) {
      const client = await _getBase44Fallback();
      return client.integrations.Core.ExtractDataFromUploadedFile(payload);
    },

    async TranscribeAudio(payload) {
      const client = await _getBase44Fallback();
      return client.integrations.Core.TranscribeAudio(payload);
    },

    async GenerateSpeech(payload) {
      const client = await _getBase44Fallback();
      return client.integrations.Core.GenerateSpeech(payload);
    },

    async GenerateVideo(payload) {
      const client = await _getBase44Fallback();
      return client.integrations.Core.GenerateVideo(payload);
    },

    async SendPushNotification(payload) {
      const client = await _getBase44Fallback();
      return client.integrations.Core.SendPushNotification(payload);
    },
  },
};

async function _invokeAIGateway(payload) {
  const apiKey = import.meta.env.VITE_AI_GATEWAY_API_KEY;
  const model = payload.model || 'automatic';
  const body = {
    model,
    messages: [{ role: 'user', content: payload.prompt }],
    ...(payload.response_json_schema ? { response_format: { type: 'json_schema', json_schema: { name: 'response', schema: payload.response_json_schema } } } : {}),
  };
  const res = await fetch(`${AI_GATEWAY_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || 'AI Gateway request failed');
  const content = json.choices?.[0]?.message?.content || '';
  if (payload.response_json_schema) {
    try { return JSON.parse(content); } catch { return { result: content }; }
  }
  return { content };
}