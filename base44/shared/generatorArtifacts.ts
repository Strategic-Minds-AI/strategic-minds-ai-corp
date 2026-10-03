// Generated source files are kept in private object storage, not oversized record fields.
export async function persistGeneratorArtifacts(artifacts, ownerId) {
  const base = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!base || !key) throw new Error('NOT_CONFIGURED: Supabase artifact storage');
  return Promise.all(artifacts.map(async artifact => {
    const objectPath = `${ownerId}/${crypto.randomUUID()}/${artifact.name.replace(/[^\w.-]/g, '_')}`;
    const response = await fetch(`${base}/storage/v1/object/private-files/${objectPath}`, { method: 'POST', headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': artifact.media_type || 'text/plain' }, body: artifact.content || '' });
    if (!response.ok) throw new Error('Could not persist generated source file');
    const { content, ...metadata } = artifact;
    return { ...metadata, content_uri: `supabase://private-files/${objectPath}` };
  }));
}
export async function loadGeneratorArtifacts(artifacts) {
  const base = process.env.SUPABASE_URL?.replace(/\/$/, '');const key = process.env.SUPABASE_SERVICE_KEY;
  return Promise.all(artifacts.map(async artifact => {
    if (artifact.content !== undefined) return artifact;
    const path = artifact.content_uri?.replace(/^supabase:\/\/private-files\//, '');
    if (!path || path.includes('..') || !/^[\w./-]+$/.test(path)) throw new Error('Generated artifact content is missing');
    const response = await fetch(`${base}/storage/v1/object/private-files/${path}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    if (!response.ok) throw new Error('Could not load generated source file');
    return { ...artifact, content: await response.text() };
  }));
}