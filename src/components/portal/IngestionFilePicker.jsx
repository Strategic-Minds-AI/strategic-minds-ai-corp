export default function IngestionFilePicker({ onFiles, onError }) {
  const take = files => { const selected = Array.from(files || []); if (selected.length > 100) { onFiles([]); return onError('Choose up to 100 files at a time.'); } if (selected.some(f => f.size > 12_000_000)) { onFiles([]); return onError('Each file must be 12 MB or smaller.'); } onError(''); onFiles(selected); };
  return <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); take(e.dataTransfer.files); }} className="rounded-xl border border-dashed border-border bg-muted p-6 text-center text-sm text-foreground">
    <p className="mb-4">Drop files here, or select files or a local folder. Nothing is sent until you confirm a Drive destination.</p>
    <div className="flex flex-wrap justify-center gap-3"><label className="cursor-pointer rounded-lg border border-border bg-background px-4 py-2 hover:border-primary">Choose files<input type="file" multiple className="sr-only" onChange={e => { take(e.target.files); e.target.value = ''; }}/></label>
      <label className="cursor-pointer rounded-lg border border-border bg-background px-4 py-2 hover:border-primary">Choose folder<input type="file" multiple webkitdirectory="" directory="" className="sr-only" onChange={e => { take(e.target.files); e.target.value = ''; }}/></label></div>
    <p className="mt-3 text-xs text-muted-foreground">Up to 100 files per batch, 12 MB each. Folder paths are preserved inside the chosen destination.</p>
  </div>;
}