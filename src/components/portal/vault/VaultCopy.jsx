import { useState } from 'react';
export default function VaultCopy({ value, label = 'Copy' }) {
  const [status, setStatus] = useState('');
  async function copy() {
    try { await navigator.clipboard.writeText(value); setStatus('Copied'); }
    catch { setStatus('Could not copy; select the value manually.'); }
  }
  return <span className="inline-flex flex-wrap items-center gap-2"><button type="button" disabled={!value} onClick={copy} className="rounded border border-border px-3 py-1.5 text-xs text-primary disabled:opacity-50">{label}</button><span role="status" className="text-xs text-muted-foreground">{status}</span></span>;
}