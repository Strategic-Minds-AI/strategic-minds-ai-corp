import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DriveFolderPicker from './DriveFolderPicker';

export default function AdminDriveFolderCreator({ open, onOpenChange, projects }) {
  const [kind, setKind] = useState('project');
  const [projectId, setProjectId] = useState('');
  const [parent, setParent] = useState(null);
  const [name, setName] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const changeKind = value => { setKind(value); setError(''); setResult(null); };
  async function create(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setError(''); setResult(null);
    try {
      const payload = kind === 'project' ? { action: 'projectFolder', projectId, approved: true } : { action: 'ensureFolder', folderId: parent.id, name: name.trim(), approved: true };
      const { data } = await base44.functions.invoke('agencyDriveIngest', payload);
      const id = kind === 'project' ? data.folderId : data.folder?.id;
      if (!id) throw new Error('Drive did not return a folder.');
      setResult({ url: `https://drive.google.com/drive/u/0/folders/${encodeURIComponent(id)}`, existing: kind === 'subfolder' && !data.created });
    } catch (e) { setError(e.response?.data?.error || e.message || 'Could not create the folder.'); }
    finally { setBusy(false); }
  }
  return <>
    <Dialog open={open && !pickerOpen} onOpenChange={onOpenChange}><DialogContent className="bg-background text-foreground"><DialogHeader><DialogTitle>Create a Drive folder</DialogTitle></DialogHeader>
      <form onSubmit={create} className="space-y-4">
        <fieldset className="space-y-2"><legend className="mb-2 text-sm font-medium">What would you like to create?</legend>
          <label className="flex items-center gap-2 text-sm"><input type="radio" name="folder-kind" checked={kind === 'project'} onChange={() => changeKind('project')}/> Project files folder</label>
          <label className="flex items-center gap-2 text-sm"><input type="radio" name="folder-kind" checked={kind === 'subfolder'} onChange={() => changeKind('subfolder')}/> Named folder or subfolder</label>
        </fieldset>
        {kind === 'project' ? <div><label htmlFor="folder-project" className="block text-sm font-medium">Which project?</label><select id="folder-project" required value={projectId} onChange={e => { setProjectId(e.target.value); setResult(null); }} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"><option value="">Select a project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select>{!projects.length && <p className="mt-2 text-sm text-muted-foreground">Create a project under Clients & projects first.</p>}</div> : <><div><label htmlFor="folder-name" className="block text-sm font-medium">Folder name</label><input id="folder-name" required maxLength={120} value={name} onChange={e => { setName(e.target.value); setResult(null); }} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="e.g. Research"/></div><div><span className="block text-sm font-medium">Where in Drive?</span><button type="button" onClick={() => setPickerOpen(true)} className="mt-2 rounded-lg border border-border px-3 py-2 text-sm hover:border-primary">{parent ? `Inside ${parent.name}` : 'Choose a parent folder (or My Drive)'}</button></div></>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {result && <p role="status" className="text-sm text-foreground">{result.existing ? 'Folder already exists. ' : 'Folder ready in Drive. '}<a href={result.url} target="_blank" rel="noopener noreferrer" className="text-primary underline">Open folder</a></p>}
        <button type="submit" disabled={busy || (kind === 'project' ? !projectId : !parent || !name.trim())} className="w-full rounded-lg bg-consoleAccent px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">{busy ? 'Creating…' : '+ Create in Drive'}</button>
      </form>
    </DialogContent></Dialog>
    <DriveFolderPicker open={pickerOpen} onOpenChange={setPickerOpen} onChoose={folder => { setParent(folder); setResult(null); }}/>
  </>;
}