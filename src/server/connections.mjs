// OAuth tokens belong to this deployment, encrypted at rest in Supabase.
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { databaseRequest } from './database.mjs';
import { requireUser } from './auth.mjs';
import { notConfigured } from './runtime.mjs';
const key = () => { if (!process.env.VAULT_BACKUP_ENCRYPTION_KEY) throw notConfigured('VAULT_BACKUP_ENCRYPTION_KEY'); return createHash('sha256').update(process.env.VAULT_BACKUP_ENCRYPTION_KEY).digest(); };
export function seal(value) { const iv = randomBytes(12); const cipher = createCipheriv('aes-256-gcm', key(), iv); const data = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]); return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64url'); }
export function unseal(value) { const buffer = Buffer.from(value, 'base64url'); const decipher = createDecipheriv('aes-256-gcm', key(), buffer.subarray(0,12)); decipher.setAuthTag(buffer.subarray(12,28)); return JSON.parse(Buffer.concat([decipher.update(buffer.subarray(28)), decipher.final()]).toString()); }
const GOOGLE_TYPES = {
  gmail: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send'],
  googlecalendar: ['https://www.googleapis.com/auth/calendar.events'], googledrive: ['https://www.googleapis.com/auth/drive'],
  googledocs: ['https://www.googleapis.com/auth/documents'], googlesheets: ['https://www.googleapis.com/auth/spreadsheets'],
  google_contacts: ['https://www.googleapis.com/auth/contacts'], google_analytics: ['https://www.googleapis.com/auth/analytics.readonly'], google_search_console: ['https://www.googleapis.com/auth/webmasters.readonly'],
};
const connectorTypes = {
  '6aa76cc2470fe12f80973720': 'googlecalendar', '69ddcb305a599e0b4a1b3cff': 'googlecalendar',
  '69db1e5e75a5f8c15c80cf34': 'googledrive', '69ddcb7e5d965b5605cd24b4': 'googledocs', '69db1fad3c50db37ad0ce8dd': 'googlesheets',
};
for (const id of ['6abbed6325bab487a6a06667','6abbecd20b04136d3ef3da21','6abbecb23c993078c3bf0f08','6abbec8dfc8de6e5b6ff7ae7','6abbec1e310bbce28457b4f5','6abbebea4801b98ec961a60b','6abbebb5683767aff814cbe8','6abbeb8a102f96ec70855440','6abbe8dc4ff4f4d2ecd95aa4','69db200274332486fd28dd7e']) connectorTypes[id] = 'gmail';
const callbackUrl = () => { if (!process.env.API_URL) throw notConfigured('API_URL'); return `${process.env.API_URL.replace(/\/$/,'')}/connections/callback`; };
async function connection(id, user) {
  const response = await databaseRequest(`/rest/v1/runtime_connections?owner_id=eq.${user.id}&connector_id=eq.${encodeURIComponent(id)}&limit=1`, { service: true });
  const [record] = await response.json(); if (!record) throw notConfigured(`${id} OAuth connection; reconnect this account on the independent deployment`);
  const credentials = unseal(record.encrypted_credentials);
  if (credentials.expires_at < Date.now() + 60000) {
    if (!credentials.refresh_token || !GOOGLE_TYPES[record.provider]) throw notConfigured(`Refresh authorization for ${id}`);
    const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: credentials.refresh_token, client_id: process.env.GOOGLE_OAUTH_CLIENT_ID, client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET }) });
    const refreshed = await response.json(); if (!response.ok) throw new Error(refreshed.error_description || 'Account authorization expired');
    Object.assign(credentials, refreshed, { expires_at: Date.now() + refreshed.expires_in * 1000 });
    await databaseRequest(`/rest/v1/runtime_connections?id=eq.${record.id}`, { service: true, method:'PATCH', data:{ encrypted_credentials: seal(credentials) } });
  }
  return { accessToken: credentials.access_token, connectionConfig: record.connection_config || {} };
}
export function createConnections(request) {
  return {
    getCurrentAppUserConnection: async id => connection(id, await requireUser(request)),
    getWorkspaceConnection: async id => connection(id, await requireUser(request, true)),
    getConnection: async type => {
      let user;
      if (new URL(request.url).pathname.endsWith('/benchmarkCostRenewal') && process.env.JOB_OWNER_ID) {
        const [owner] = await (await databaseRequest(`/rest/v1/profiles?id=eq.${encodeURIComponent(process.env.JOB_OWNER_ID)}&limit=1`, {service:true})).json();
        if (owner?.role !== 'admin') throw new Error('Automation owner must be an approved admin');
        user=owner;
      } else user=await requireUser(request,true);
      return connection(type,user);
    },
  };
}
export async function connectAccount(request, { connector_id }) {
  const user = await requireUser(request); const type = connectorTypes[connector_id] || connector_id;
  if (!GOOGLE_TYPES[type] || !process.env.GOOGLE_OAUTH_CLIENT_ID || !process.env.GOOGLE_OAUTH_CLIENT_SECRET) throw notConfigured(`${type} independent OAuth client`);
  const state = seal({ user_id: user.id, connector_id, type, expires: Date.now() + 600000 });
  const params = new URLSearchParams({ client_id: process.env.GOOGLE_OAUTH_CLIENT_ID, redirect_uri: callbackUrl(), response_type: 'code', access_type:'offline', prompt:'consent', scope: ['openid','email',...GOOGLE_TYPES[type]].join(' '), state });
  return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` };
}
export async function completeConnection(request) {
  const params = new URL(request.url).searchParams;
  const state = unseal(params.get('state')); if (state.expires < Date.now()) throw new Error('Connection request expired');
  if (!params.get('code')) throw new Error(params.get('error') || 'Authorization was not completed');
  const response = await fetch('https://oauth2.googleapis.com/token', { method:'POST', body: new URLSearchParams({ code:params.get('code'), client_id:process.env.GOOGLE_OAUTH_CLIENT_ID, client_secret:process.env.GOOGLE_OAUTH_CLIENT_SECRET, redirect_uri:callbackUrl(), grant_type:'authorization_code' }) });
  const credentials = await response.json(); if (!response.ok) throw new Error(credentials.error_description || 'OAuth exchange failed');
  credentials.expires_at = Date.now() + credentials.expires_in * 1000;
  await databaseRequest('/rest/v1/runtime_connections?on_conflict=owner_id,connector_id', { service:true, method:'POST', headers:{Prefer:'resolution=merge-duplicates'}, data:{owner_id:state.user_id, connector_id:state.connector_id, provider:state.type, encrypted_credentials:seal(credentials)} });
  return new Response('<!doctype html><title>Account connected</title><p>Account connected. You can close this window.</p><script>window.close()</script>', { headers:{'Content-Type':'text/html; charset=utf-8'} });
}
export async function disconnectAccount(request, { connector_id }) {
  const user = await requireUser(request);
  await databaseRequest(`/rest/v1/runtime_connections?owner_id=eq.${user.id}&connector_id=eq.${encodeURIComponent(connector_id)}`, {service:true,method:'DELETE'});
  return { success:true };
}