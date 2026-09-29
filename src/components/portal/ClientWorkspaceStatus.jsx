import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function ClientWorkspaceStatus() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    try {
      const { data: result } = await base44.functions.invoke('provisionClientInfrastructure', { action: 'listMine' });
      setData(result); setError('');
    } catch (e) { setError(e.response?.data?.error || e.message || 'Could not load your setup progress.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  return <section aria-label="Your app setup" className="mb-8 rounded border border-border bg-card p-6">
    <h2 className="mb-2 text-xl">Your App Setup</h2>
    <p className="mb-5 text-sm text-muted-foreground">Your team handles the technical setup. No action is needed from you; we’ll share access when your app is ready.</p>
    {error && <p role="alert" className="text-sm text-destructive">{error} <button type="button" className="underline" onClick={load}>Try again</button></p>}
    {loading ? <p role="status" className="text-sm">Loading your setup progress…</p> : data && !data.workspaces.length && !data.databases.length ? <p className="text-sm text-muted-foreground">Nothing to set up here yet. Your team will take care of it when your project begins.</p> : data && <div className="grid gap-3 sm:grid-cols-2">
      {data.workspaces.map(item => <article key={item.id} className="rounded border border-border bg-background p-4"><h3 className="mb-2 text-base">{item.name}</h3><ul className="space-y-1 text-sm text-muted-foreground">{item.code_requested && <li>App workspace: {item.code_prepared ? 'Prepared by your team' : 'Your team is setting it up'}</li>}{item.data_requested && <li>Database: {item.data_prepared ? 'Prepared by your team' : 'Your team is setting it up'}</li>}</ul></article>)}
      {data.databases.map(site => <article key={site.id} className="rounded border border-border bg-background p-4"><h3 className="mb-2 text-base">{site.name}</h3><p className="text-sm text-muted-foreground">Database prepared by your team</p></article>)}
    </div>}
  </section>;
}