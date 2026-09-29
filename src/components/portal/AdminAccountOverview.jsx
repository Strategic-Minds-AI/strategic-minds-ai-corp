import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
const names = { vercel: 'Vercel', supabase: 'Supabase', railway: 'Railway', github: 'GitHub' };
export default function AdminAccountOverview({ provider }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => { let active = true; setLoading(true); setError('');
    base44.functions.invoke('adminAccountOverview', { provider }).then(({ data }) => { if (active) setItems(data.items || []); }).catch(e => { if (active) setError(e.response?.data?.error || e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [provider, retry]);
  return <div className="mx-auto max-w-4xl p-6 md:p-8"><h1 className="mb-2 text-2xl font-semibold">{names[provider]} account</h1><p className="mb-6 text-sm text-muted-foreground">Live projects and repositories from your connected account. No data is copied or synced.</p>
    {loading && <p role="status" className="text-sm">Loading {names[provider]}…</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error} <button type="button" className="underline" onClick={() => setRetry(n => n + 1)}>Retry</button></p>}
    {!loading && !error && (items.length ? <ul className="grid gap-3">{items.map(item => <li key={item.id} className="rounded-lg border border-border bg-card p-4"><a href={item.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-4">{item.name}</a>{item.detail && <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>}</li>)}</ul> : <p className="text-sm text-muted-foreground">No projects or repositories found in this account.</p>)}
  </div>;
}