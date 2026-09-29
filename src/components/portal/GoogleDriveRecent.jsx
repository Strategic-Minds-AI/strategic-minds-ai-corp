import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
export default function GoogleDriveRecent() {
  const [files, setFiles] = useState(null);
  const [error, setError] = useState('');
  const load = async () => {
    setError('');
    try { const { data } = await base44.functions.invoke('agencyDriveIngest', { action: 'recentFiles' }); setFiles(data.files); }
    catch (failure) { setError(failure.response?.data?.error || failure.message || 'Could not load files.'); }
  };
  useEffect(() => { load(); }, []);
  return <section className="rounded-lg border border-border bg-card p-5"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="mb-0 text-lg">Agency Drive</h2><button type="button" onClick={load} className="text-xs text-primary underline">Refresh</button></div>
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : !files ? <p role="status" className="text-sm">Loading files…</p> : !files.length ? <p className="text-sm">No files found in the connected agency Drive.</p> : <ul className="divide-y divide-border">{files.map(file => <li key={file.id} className="flex items-center justify-between gap-3 py-2 text-sm"><span className="min-w-0 truncate text-foreground" title={file.name}>{file.name}</span>{file.webViewLink && <a href={file.webViewLink} target="_blank" rel="noopener noreferrer" className="shrink-0 text-primary underline">Open</a>}</li>)}</ul>}
  </section>;
}