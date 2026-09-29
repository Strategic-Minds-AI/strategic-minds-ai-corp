import { useState } from 'react';
import { Menu, SquarePen, Search, Settings2, X, LayoutGrid } from 'lucide-react';
import AdminChatQuickTasks from './AdminChatQuickTasks';
const tools = [['ingestion','Ingestion'], ['crm','CRM'], ['clients','Clients & projects'], ['commerce','Commerce'], ['infrastructure','Infrastructure'], ['provisioning','Site provisioning'], ['projects','Project requests'], ['chatgpt','MCP connection']];
export default function AdminChatSidebar({ chats, selectedId, view, onView, onNew, onSelect, onSettings, onDelete, onQuickTask }) {
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const choose = (fn) => { fn(); setOpen(false); };
  return <>
    <button aria-label="Open sidebar" type="button" onClick={() => setOpen(true)} className="absolute left-4 top-4 z-10 rounded-lg p-2 text-foreground hover:bg-consoleAccent hover:text-primary-foreground md:hidden"><Menu size={22}/></button>
    {open && <button type="button" aria-label="Close sidebar" onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-foreground/30 md:hidden"/>}
    <aside aria-label="Admin workspace" className={`absolute inset-y-0 left-0 z-40 flex w-[270px] flex-col border-r border-border bg-background p-3 transition-transform md:relative md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between px-2 pb-3 pt-1"><span className="text-sm font-semibold text-foreground">Strategic Minds AI</span><button type="button" aria-label="Close sidebar" onClick={() => setOpen(false)} className="rounded p-2 md:hidden"><X size={18}/></button></div>
      <button type="button" onClick={() => choose(onNew)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-consoleAccent hover:text-primary-foreground"><SquarePen size={18}/> New chat</button>
      <button type="button" onClick={() => setSearching(!searching)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-consoleAccent hover:text-primary-foreground"><Search size={18}/> Search chats</button>
      {searching && <input autoFocus aria-label="Search chats" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search chats" className="my-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"/>}
      <div className="mt-5 min-h-0 flex-1 overflow-y-auto"><p className="px-3 pb-2 text-xs font-semibold text-muted-foreground">Recent</p>
        {chats.filter(c => !query || (c.title + ' ' + c.messages.map(m => m.content).join(' ')).toLowerCase().includes(query.toLowerCase())).map(c => <div key={c.id} className={`group flex items-center rounded-lg hover:bg-consoleAccent ${view === 'chat' && selectedId === c.id ? 'bg-muted' : ''}`}><button type="button" onClick={() => choose(() => onSelect(c.id))} className="min-w-0 flex-1 truncate px-3 py-2 text-left text-sm text-foreground group-hover:text-primary-foreground" title={c.title}>{c.title}</button><button type="button" aria-label={`Delete ${c.title}`} onClick={() => onDelete(c.id)} className="rounded p-2 text-muted-foreground group-hover:text-primary-foreground hover:text-primary-foreground" title="Delete chat"><X size={15}/></button></div>)}
        {chats.length === 0 && <p className="px-3 text-xs text-muted-foreground">Your conversations will appear here.</p>}
        <AdminChatQuickTasks onChoose={task => choose(() => onQuickTask(task))}/>
        <p className="mt-6 px-3 pb-2 text-xs font-semibold text-muted-foreground">Agency tools</p>{tools.map(([id,label]) => <button key={id} type="button" onClick={() => choose(() => onView(id))} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-consoleAccent hover:text-primary-foreground ${view === id ? 'bg-muted font-medium' : ''}`}><LayoutGrid size={16}/>{label}</button>)}
      </div>
      <button type="button" onClick={() => choose(onSettings)} className="flex items-center gap-3 rounded-lg border-t border-border px-3 py-4 text-left text-sm text-foreground hover:bg-consoleAccent hover:text-primary-foreground"><Settings2 size={17}/> Settings</button>
    </aside>
  </>;
}