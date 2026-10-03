import { databaseRequest } from './database.mjs';
export async function uploadFile(file, user, publicFile = false) {
  if (!file || typeof file.arrayBuffer !== 'function') throw new Error('A file is required');
  if (file.size > 25 * 1024 * 1024) throw new Error('Maximum file size is 25 MB');
  const bucket = publicFile ? 'public-assets' : 'private-files';
  const path = `${user.id}/${crypto.randomUUID()}/${(file.name || 'file').replace(/[^\w.-]/g, '_')}`;
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_KEY;
  const response = await fetch(`${url}/storage/v1/object/${bucket}/${path}`, { method: 'POST', headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': file.type || 'application/octet-stream' }, body: await file.arrayBuffer() });
  if (!response.ok) throw new Error((await response.json()).message || 'Upload failed');
  return publicFile ? { file_url: `${url}/storage/v1/object/public/${bucket}/${path}` } : { file_uri: `supabase://${bucket}/${path}` };
}
export async function signedUrl({ file_uri, expires_in = 300 }, user) {
  const match = /^supabase:\/\/(private-files)\/(.+)$/.exec(file_uri || '');
  if (!match || match[2].split('/')[0] !== user.id) throw Object.assign(new Error('File access denied'), { status: 403 });
  const response = await databaseRequest(`/storage/v1/object/sign/${match[1]}/${match[2]}`, { service: true, method: 'POST', data: { expiresIn: Math.min(Math.max(Number(expires_in), 30), 3600) } });
  const data = await response.json();
  return { signed_url: `${process.env.SUPABASE_URL.replace(/\/$/, '')}/storage/v1${data.signedURL}` };
}
export async function persistGeneratedImage(dataUrl, user) {
  if (!dataUrl?.startsWith('data:')) throw new Error('Gateway did not return image data');
  const response = await fetch(dataUrl); const blob = await response.blob();
  const file = new File([blob], 'generated-image.png', { type: blob.type });
  const { file_url } = await uploadFile(file, user, true); return { url: file_url };
}