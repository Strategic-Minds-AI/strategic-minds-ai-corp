import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
export default function AdminGmailRecent({ connectorId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let mounted = true;
    setData(null); setError('');
    base44.functions.invoke('adminGmailAccount', { connectorId, action: 'recent' })
      .then(result => { if (mounted) setData(result.data); })
      .catch(failure => { if (mounted) setError(failure.response?.data?.error || failure.message || 'Could not load this inbox.'); });
    return () => { mounted = false; };
  }, [connectorId]);
  return <div className="space-y-2 rounded-lg border border-border bg-muted p-4 text-sm"><h3 className="mb-1 text-base">Recent inbox mail · {data?.email || 'Loading…'}</h3>
    {error ? <p role="alert" className="text-destructive">{error}</p> : !data ? <p role="status">Loading recent messages…</p> : !data.messages.length ? <p>No recent messages.</p> : <ul className="divide-y divide-border">{data.messages.map(message => <li key={message.id} className="py-2"><p className="mb-0 font-medium text-foreground">{message.subject}</p><p className="truncate text-xs text-muted-foreground">{message.from}</p></li>)}</ul>}
  </div>;
}