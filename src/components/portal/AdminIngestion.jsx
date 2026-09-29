import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import IngestionFilePicker from './IngestionFilePicker';
import DriveFolderPicker from './DriveFolderPicker';
export default function AdminIngestion() {
  const [files, setFiles] = useState([]);
  const [destination, setDestination] = useState(null);
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);
  async function transfer() {
    if (!destination || !files.length || busy || !window.confirm(`Copy ${files.length} file(s) to ${destination.name} in the shared agency Drive? New subfolders may be created to preserve selected folder paths.`)) return;
    setBusy(true); setError(''); setResults([]);
    const folders = new Map();
    for (const file of files) {
      try {
        let folderId = destination.id;
        const parts = (file.webkitRelativePath || '').split('/').slice(0, -1);
        for (const name of parts) {
          const key = `${folderId}/${name}`;
          if (!folders.has(key)) { const { data } = await base44.functions.invoke('agencyDriveIngest', { action: 'ensureFolder', folderId, name, approved: true }); folders.set(key, data.folder.id); }
          folderId = folders.get(key);
        }
        const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
        const { data } = await base44.functions.invoke('agencyDriveIngest', { action: 'upload', folderId, fileUri: file_uri, name: file.name, mimeType: file.type, approved: true });
        setResults(prev => [...prev, { name: file.webkitRelativePath || file.name, status: 'Uploaded', url: data.file.webViewLink, hash: data.sha256 }]);
      } catch (e) { setResults(prev => [...prev, { name: file.webkitRelativePath || file.name, status: 'Failed', error: e.response?.data?.error || e.message }]); }
    }
    setBusy(false);
  }
  return <section className="mx-auto max-w-4xl space-y-6 text-foreground"><div><p className="agency-eyebrow">APEX · INGESTION</p><h2 className="mb-2 text-2xl">Send files to your agency Drive</h2><p className="text-sm text-muted-foreground">Select what you want to ingest, choose an existing destination, then approve the transfer. This first stage copies originals only; it does not analyze, sync, or automatically classify them.</p></div>
    <IngestionFilePicker onFiles={setFiles} onError={setError}/>
    {files.length > 0 && <div className="rounded-xl border border-border bg-card p-5"><p className="mb-3 text-sm font-medium">{files.length} file{files.length === 1 ? '' : 's'} selected</p><ul className="mb-4 max-h-32 overflow-y-auto text-xs text-muted-foreground">{files.map((f, i) => <li key={`${f.name}-${i}`} className="truncate py-1">{f.webkitRelativePath || f.name}</li>)}</ul><button type="button" disabled={busy} onClick={() => setPicker(true)} className="mr-3 rounded-lg border border-border px-4 py-2 text-sm hover:border-primary">{destination ? `Destination: ${destination.name}` : 'Choose Drive destination'}</button><button type="button" disabled={busy || !destination} onClick={transfer} className="rounded-lg bg-consoleAccent px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">{busy ? 'Transferring…' : 'Confirm and transfer'}</button></div>}
    <DriveFolderPicker open={picker} onOpenChange={setPicker} onChoose={setDestination}/>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {results.length > 0 && <div aria-live="polite" className="rounded-xl border border-border bg-card p-5"><h3 className="mb-3 text-base">Transfer results</h3><ul className="space-y-2 text-sm">{results.map((r,i) => <li key={i} className="break-words">{r.status}: {r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-primary underline">{r.name}</a> : r.name}{r.error && <span className="text-destructive"> — {r.error}</span>}{r.hash && <span className="block font-mono text-xs text-muted-foreground">SHA-256: {r.hash}</span>}</li>)}</ul></div>}
  </section>;
}