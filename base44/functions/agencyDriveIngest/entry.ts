import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in first.' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required.' }, { status: 403 });
    const body = await req.json();
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    const headers = { Authorization: `Bearer ${accessToken}` };
    const folder = body.folderId || 'root';
    if (typeof folder !== 'string' || !/^(root|[A-Za-z0-9_-]{8,200})$/.test(folder)) return Response.json({ error: 'Invalid destination.' }, { status: 400 });
    const google = async (url: string, options: RequestInit = {}) => {
      const response = await fetch(url, { ...options, headers: { ...headers, ...options.headers } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Drive request failed.');
      return data;
    };
    if (body.action === 'folders') {
      const pageToken = body.pageToken || '';
      if (typeof pageToken !== 'string' || pageToken.length > 500) return Response.json({ error: 'Invalid page.' }, { status: 400 });
      const query = new URLSearchParams({ q: `'${folder}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`, fields: 'nextPageToken,files(id,name,mimeType)', pageSize: '100', orderBy: 'name', ...(pageToken ? { pageToken } : {}) });
      const data = await google(`https://www.googleapis.com/drive/v3/files?${query}`);
      return Response.json({ folders: data.files || [], nextPageToken: data.nextPageToken || null });
    }
    if (body.action !== 'ensureFolder' && body.action !== 'upload') return Response.json({ error: 'Unknown action.' }, { status: 400 });
    if (body.approved !== true) return Response.json({ error: 'Confirm this Drive action first.' }, { status: 403 });
    if (folder !== 'root') {
      const info = await google(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(folder)}?fields=id,mimeType,trashed,capabilities(canAddChildren)`);
      if (info.trashed || info.mimeType !== 'application/vnd.google-apps.folder' || !info.capabilities?.canAddChildren) return Response.json({ error: 'Cannot add files to that folder.' }, { status: 403 });
    }
    if (body.action === 'ensureFolder') {
      const name = body.name;
      if (typeof name !== 'string' || !name.trim() || name.length > 120 || /[\\/\x00-\x1F]/.test(name)) return Response.json({ error: 'Invalid folder name.' }, { status: 400 });
      const q = new URLSearchParams({ q: `'${folder}' in parents and name = '${name.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`, fields: 'files(id,name),nextPageToken', pageSize: '100' });
      const found = await google(`https://www.googleapis.com/drive/v3/files?${q}`);
      if (found.files?.length) return Response.json({ folder: found.files[0], created: false });
      const created = await google('https://www.googleapis.com/drive/v3/files?fields=id,name', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder', parents: [folder] }) });
      return Response.json({ folder: created, created: true });
    }
    const { fileUri, name, mimeType } = body;
    if (typeof fileUri !== 'string' || !fileUri || fileUri.length > 1000 || typeof name !== 'string' || !name.trim() || name.length > 200 || /[\\/\x00-\x1F]/.test(name)) return Response.json({ error: 'Invalid file.' }, { status: 400 });
    if (/\.(exe|dll|scr|com|msi|bat|cmd|ps1|jar)$/i.test(name)) return Response.json({ error: 'Executable files are not accepted.' }, { status: 400 });
    const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: fileUri, expires_in: 120 });
    const source = await fetch(signed_url);
    if (!source.ok) throw new Error('The private upload could not be read.');
    const bytes = await source.arrayBuffer();
    if (bytes.byteLength > 12_000_000) return Response.json({ error: 'File exceeds the 12 MB limit.' }, { status: 413 });
    const sha256 = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('');
    const type = typeof mimeType === 'string' && /^[\w.+-]+\/[\w.+-]+$/.test(mimeType) ? mimeType : 'application/octet-stream';
    const boundary = `agency-${crypto.randomUUID()}`;
    const metadata = { name, parents: [folder], appProperties: { sha256 } };
    const payload = new Blob([`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${type}\r\n\r\n`, bytes, `\r\n--${boundary}--`]);
    const result = await google('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,md5Checksum,parents', { method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body: payload });
    return Response.json({ file: result, sha256 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Drive operation failed.' }, { status: 500 });
  }
}