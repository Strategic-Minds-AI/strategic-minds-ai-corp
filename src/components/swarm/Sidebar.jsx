import { Plus, LayoutGrid, Bot, Plug, ChevronDown, LockKeyhole, LogOut, ArrowUpRight, MessageSquare, Circle, Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Brand from '@/components/swarm/Brand';
import { presets } from '@/components/swarm/catalog';
export default function Sidebar({ swarm: s, onLibrary, onConnect, onClose = () => {} }) {
  return <aside className="flex h-full w-[240px] flex-col bg-sidebar p-4">
    <div className="flex h-10 items-center justify-between"><Brand/><span className="text-muted-foreground"><ChevronDown size={14}/></span></div>
    <button disabled={s.busy} onClick={() => { s.newRun(); onClose(); }} className="mt-7 flex h-10 items-center justify-center gap-2 rounded-md border bg-card font-medium hover:bg-secondary"><Plus size={16}/>New swarm</button>
    <nav className="mt-6 space-y-1" aria-label="Workspace navigation">
      <button onClick={onClose} className="flex w-full items-center gap-3 rounded-md bg-primary/10 px-3 py-2.5 text-primary"><LayoutGrid size={16}/>Swarm workspace<span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"/></button>
      <button onClick={onLibrary} className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-muted-foreground hover:bg-card hover:text-foreground"><Bot size={16}/>Agent library<span className="ml-auto font-mono text-[10px]">30</span></button>
      <button onClick={onConnect} className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-muted-foreground hover:bg-card hover:text-foreground"><Plug size={16}/>Connections<ArrowUpRight size={13} className="ml-auto"/></button>
      <Link to="/idea-engine" onClick={onClose} className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-muted-foreground hover:bg-card hover:text-foreground"><Lightbulb size={16}/>Idea Engine<ArrowUpRight size={13} className="ml-auto"/></Link>
    </nav>
    <div className="mt-8 flex items-center justify-between px-2"><h2 className="swarm-label">Your swarms</h2><span className="font-mono text-[10px] text-muted-foreground">{s.runs.length}</span></div>
    <div className="mt-3 min-h-16 flex-1 overflow-y-auto space-y-1">
      {s.loading && !s.runs.length && <p className="px-2 text-xs text-muted-foreground">Loading your workspace…</p>}
      {!s.loading && !s.runs.length && <p className="px-2 text-xs leading-5 text-muted-foreground">A fresh start.<br/>Your saved swarms will appear here.</p>}
      {s.runs.map(r => <button key={r.id} disabled={s.busy} onClick={() => { s.openRun(r); onClose(); }} className={`flex w-full items-center gap-2 rounded-md px-2 py-2.5 text-left text-xs hover:bg-card ${s.run?.id === r.id ? 'bg-card text-foreground' : 'text-muted-foreground'}`}><MessageSquare size={14} className="shrink-0"/><span className="truncate">{r.title}</span></button>)}
    </div>
    <h2 className="swarm-label mt-7 px-2">System presets</h2>
    <div className="mt-3 space-y-1">{Object.entries(presets).map(([key, p]) => <button key={key} disabled={s.busy} onClick={() => s.setPreset(key)} className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-xs hover:bg-card ${s.preset === key ? 'text-foreground' : 'text-muted-foreground'}`}><p.icon size={14}/>{p.name}{s.preset === key && <span className="ml-auto text-primary"><Circle size={6} fill="currentColor"/></span>}</button>)}</div>
    <button onClick={onConnect} className="mt-7 rounded-md border bg-card p-3 text-left"><span className="flex items-center gap-2 text-xs"><LockKeyhole size={13} className="text-primary"/>MCP server<span className="ml-auto rounded border px-1 text-[9px] text-muted-foreground">OAuth</span></span><span className="mt-2 block text-[10px] text-muted-foreground">Publish to activate your endpoint</span></button>
    <div className="mt-4 flex items-center gap-2 border-t pt-4"><span className="flex h-8 w-8 items-center justify-center rounded-md border bg-secondary text-xs font-medium">{(s.user?.full_name || s.user?.email || 'S')[0].toUpperCase()}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{s.user?.full_name || 'My workspace'}</p><p className="text-[10px] text-muted-foreground">Personal · Private</p></div><button onClick={() => base44.auth.logout('/login')} aria-label="Sign out" className="swarm-icon-button"><LogOut size={14}/></button></div>
  </aside>;
}