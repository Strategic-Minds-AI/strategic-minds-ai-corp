const sections = [
  ['chatgpt', 'ChatGPT connection'],
  ['crm', 'AI-assisted CRM'],
  ['clients', 'Clients & projects'],
  ['commerce', 'Commerce'],
  ['infrastructure', 'Infrastructure'],
  ['provisioning', 'Site provisioning'],
  ['projects', 'Project requests'],
];

export default function AdminPortalMenu({ active, onSelect }) {
  return <nav aria-label="Admin tools" className="rounded border border-border bg-card p-3">
    <p className="px-3 pb-3 pt-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Tools</p>
    <div className="flex gap-1 overflow-x-auto lg:flex-col">
      {sections.map(([id, label]) => <button key={id} type="button" onClick={() => onSelect(id)} aria-current={active === id ? 'page' : undefined} className={`shrink-0 rounded px-3 py-3 text-left text-sm font-medium lg:w-full ${active === id ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'}`}>{label}</button>)}
    </div>
  </nav>;
}