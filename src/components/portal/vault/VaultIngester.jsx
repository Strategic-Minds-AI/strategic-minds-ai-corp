import { useState, useRef } from 'react';
import { Upload, FileText, Loader2, CheckCircle2, AlertTriangle, Trash2, ShieldCheck } from 'lucide-react';
import { parseSecretFile } from '@/components/portal/vault/vaultIngesterParser';

export default function VaultIngester({ vault, onDone }) {
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, errors: [] });
  const [complete, setComplete] = useState(false);
  const fileRef = useRef(null);

  async function handleFile(file) {
    setError(''); setComplete(false); setProgress({ done: 0, total: 0, errors: [] });
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError('File is too large (2 MB max).'); return; }
    setBusy(true);
    try {
      const text = await file.text();
      const result = parseSecretFile(file.name, text);
      if (result.count === 0) { setError('No secrets could be extracted from this file.'); setBusy(false); return; }
      setParsed(result);
    } catch (err) {
      setError(err.message || 'Could not read the file.');
    } finally {
      setBusy(false);
    }
  }

  function removeEntry(idx) {
    setParsed(prev => prev ? { ...prev, entries: prev.entries.filter((_, i) => i !== idx), count: prev.count - 1 } : prev);
  }

  function updateEntry(idx, field, value) {
    setParsed(prev => {
      if (!prev) return prev;
      const entries = [...prev.entries];
      entries[idx] = { ...entries[idx], [field]: value };
      return { ...prev, entries };
    });
  }

  async function importAll() {
    if (!parsed || parsed.entries.length === 0) return;
    setBusy(true); setError(''); setComplete(false);
    const errors = [];
    let done = 0;
    for (const entry of parsed.entries) {
      try {
        await vault.save({ ...entry, title: entry.title.trim(), provider: (entry.provider || '').trim() });
      } catch (err) {
        errors.push(`${entry.title}: ${err.message}`);
      }
      done++;
      setProgress({ done, total: parsed.entries.length, errors: [...errors] });
    }
    setBusy(false);
    if (errors.length === 0) {
      setComplete(true);
      setParsed(null);
      if (fileRef.current) fileRef.current.value = '';
      if (onDone) onDone();
    } else {
      setError(`${done - errors.length} imported, ${errors.length} failed.`);
    }
  }

  function reset() {
    setParsed(null); setError(''); setComplete(false); setProgress({ done: 0, total: 0, errors: [] });
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <section aria-labelledby="vault-ingester-title" className="rounded-xl border border-border bg-card p-5 md:p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="rounded-lg bg-muted p-2.5 text-primary"><Upload size={20} /></span>
        <div>
          <h2 id="vault-ingester-title" className="text-lg font-bold">Batch upload ingester</h2>
          <p className="text-sm text-muted-foreground">Upload a <code className="rounded bg-muted px-1.5 py-0.5 text-xs">.env</code>, JSON, or CSV file of secrets. We clean, normalize, and organize each entry — you review before anything is encrypted and saved.</p>
        </div>
      </div>

      {error && <div role="alert" className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {!parsed && !complete && (
        <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/40 p-10 text-center transition hover:border-primary hover:bg-muted/60">
          <FileText size={32} className="text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Drop or choose a secrets file</span>
          <span className="text-xs text-muted-foreground">.env, .json, or .csv — up to 2 MB</span>
          <input ref={fileRef} type="file" accept=".env,.json,.csv,.txt,text/plain,application/json,text/csv,text/plain" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
          {busy && <Loader2 size={18} className="animate-spin text-primary" />}
        </label>
      )}

      {parsed && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-foreground"><ShieldCheck size={16} className="mr-1.5 inline text-primary" />{parsed.count} entries detected · format: <span className="font-medium">{parsed.format}</span></p>
            <div className="flex gap-2">
              <button type="button" onClick={reset} className="min-h-10 rounded-lg border border-border px-3 text-sm">Clear</button>
              <button type="button" onClick={importAll} disabled={busy || parsed.entries.length === 0} className="agency-button">
                {busy ? <><Loader2 size={16} className="animate-spin" /> Encrypting…</> : `Encrypt & save ${parsed.entries.length}`}
              </button>
            </div>
          </div>

          {busy && progress.total > 0 && (
            <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              Processing {progress.done} of {progress.total}…
              {progress.errors.length > 0 && <span className="text-destructive"> ({progress.errors.length} failed)</span>}
            </div>
          )}

          <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
            {parsed.entries.map((entry, idx) => (
              <div key={idx} className="rounded-lg border border-border bg-background p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <input value={entry.title} onChange={e => updateEntry(idx, 'title', e.target.value)} className="min-w-0 flex-1 rounded border border-border bg-background px-2 py-1 text-sm font-medium" aria-label="Item name" />
                  <button type="button" aria-label="Remove entry" onClick={() => removeEntry(idx)} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"><Trash2 size={15} /></button>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <select value={entry.category} onChange={e => updateEntry(idx, 'category', e.target.value)} className="rounded border border-border bg-background px-2 py-1 text-xs" aria-label="Item type">
                    <option value="login">Login</option>
                    <option value="api_key">API key</option>
                    <option value="note">Note</option>
                  </select>
                  <input value={entry.provider} onChange={e => updateEntry(idx, 'provider', e.target.value)} placeholder="Provider" className="rounded border border-border bg-background px-2 py-1 text-xs" aria-label="Provider" />
                  <input value={entry.username} onChange={e => updateEntry(idx, 'username', e.target.value)} placeholder="Username" className="rounded border border-border bg-background px-2 py-1 text-xs" aria-label="Username" />
                  <input value={entry.url} onChange={e => updateEntry(idx, 'url', e.target.value)} placeholder="URL" className="rounded border border-border bg-background px-2 py-1 text-xs" aria-label="URL" />
                </div>
                <input value={entry.secret} onChange={e => updateEntry(idx, 'secret', e.target.value)} placeholder="Secret / password / token" className="mt-2 w-full rounded border border-border bg-background px-2 py-1 font-mono text-xs" aria-label="Secret" />
                {entry.notes && <input value={entry.notes} onChange={e => updateEntry(idx, 'notes', e.target.value)} placeholder="Notes" className="mt-2 w-full rounded border border-border bg-background px-2 py-1 text-xs" aria-label="Notes" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {complete && !parsed && (
        <div className="flex items-center gap-3 rounded-lg bg-green-500/10 p-4 text-sm text-foreground">
          <CheckCircle2 size={20} className="text-green-600" />
          <span>All entries encrypted and saved to your vault.</span>
          <button type="button" onClick={reset} className="ml-auto text-primary underline">Upload another</button>
        </div>
      )}

      {progress.errors.length > 0 && !complete && (
        <details className="mt-3 rounded-lg bg-muted p-3 text-xs">
          <summary className="cursor-pointer text-muted-foreground">{progress.errors.length} failed entries</summary>
          <ul className="mt-2 space-y-1 text-destructive">{progress.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </details>
      )}
    </section>
  );
}