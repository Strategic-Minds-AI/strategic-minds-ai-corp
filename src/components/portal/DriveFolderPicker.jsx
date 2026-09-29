import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Folder, ChevronRight } from 'lucide-react';
export default function DriveFolderPicker({ open, onOpenChange, onChoose }) {
  const [path, setPath] = useState([{ id: 'root', name: 'My Drive' }]);
  const [folders, setFolders] = useState([]);
  const [next, setNext] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const current = path[path.length - 1];
  useEffect(() => { if (!open) return; let live = true; setBusy(true); setError(''); setFolders([]); setNext(null);
    base44.functions.invoke('agencyDriveIngest', { action: 'folders', folderId: current.id }).then(({ data }) => { if (live) { setFolders(data.folders); setNext(data.nextPageToken); } }).catch(e => { if (live) setError(e.response?.data?.error || e.message); }).finally(() => { if (live) setBusy(false); });
    return () => { live = false; };
  }, [open, current.id, retry]);
  async function more() { setBusy(true); try { const { data } = await base44.functions.invoke('agencyDriveIngest', { action: 'folders', folderId: current.id, pageToken: next }); setFolders(f => [...f, ...data.folders]); setNext(data.nextPageToken); } catch(e) { setError(e.response?.data?.error || e.message); } finally { setBusy(false); } }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[85vh] overflow-y-auto bg-background text-foreground"><DialogHeader><DialogTitle>Choose a Drive destination</DialogTitle></DialogHeader>
    <div className="flex flex-wrap items-center gap-1 text-xs">{path.map((part, i) => <button type="button" key={part.id} onClick={() => setPath(path.slice(0, i + 1))} className="rounded px-2 py-1 text-primary hover:bg-muted">{part.name}{i < path.length - 1 ? ' /' : ''}</button>)}</div>
    {error && <p role="alert" className="text-sm text-destructive">{error} <button type="button" onClick={() => setRetry(n => n + 1)} className="underline">Retry</button></p>}
    {busy && <p role="status" className="text-sm text-muted-foreground">Loading folders…</p>}
    <div className="max-h-64 space-y-1 overflow-y-auto">{folders.map(f => <button key={f.id} type="button" onClick={() => setPath(p => [...p, f])} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"><Folder size={16} className="text-primary"/><span className="flex-1 truncate">{f.name}</span><ChevronRight size={15}/></button>)}{!busy && !folders.length && !error && <p className="p-3 text-sm text-muted-foreground">No subfolders here.</p>}{next && <button type="button" disabled={busy} onClick={more} className="px-3 text-sm text-primary underline">Load more folders</button>}</div>
    <button type="button" disabled={busy || !!error} onClick={() => { onChoose(current); onOpenChange(false); }} className="w-full rounded-lg bg-consoleAccent px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50">Use {current.name}</button>
  </DialogContent></Dialog>;
}