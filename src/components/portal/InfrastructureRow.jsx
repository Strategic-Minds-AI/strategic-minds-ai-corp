export default function InfrastructureRow({ item, clients, pending, onRun }) {
  const buttons = [
    ['github', 'Create private GitHub repo', !item.github_repo],
    ['vercel', 'Create Vercel project', !!item.github_repo && !item.vercel_id],
    ['railway', 'Create Railway project', !item.railway_id],
    ['railwayService', 'Connect repo to Railway', !!item.github_repo && !!item.railway_id && !item.railway_service_id],
  ];
  return <li className="border-t border-border py-5">
    <p className="font-semibold text-foreground">{item.name} <span className="font-normal text-muted-foreground">· {clients.find(c => c.id === item.client_id)?.email || 'Client'}</span></p>
    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
      {item.github_url && <a className="text-primary underline" href={item.github_url} target="_blank" rel="noopener noreferrer">GitHub repository</a>}
      {item.vercel_id && <a className="text-primary underline" href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer">Vercel dashboard ({item.vercel_id})</a>}
      {item.railway_url && <a className="text-primary underline" href={item.railway_url} target="_blank" rel="noopener noreferrer">Railway {item.railway_service_id ? 'service connected' : 'project'}</a>}
    </div>
    <div className="mt-3 flex flex-wrap gap-2">{buttons.filter(([, , show]) => show).map(([action, label]) => <button key={action} type="button" className="rounded border border-border px-3 py-2 text-sm text-foreground hover:border-primary disabled:opacity-50" disabled={!!pending} onClick={() => onRun(item.id, action)}>{pending === `${item.id}:${action}` ? 'Working…' : label}</button>)}</div>
  </li>;
}