import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, SquarePen, Search, X, PanelLeftClose, PanelLeftOpen, ChevronDown, Cpu, ArrowLeft } from 'lucide-react';

const AGENT_GROUPS = [
  { label: 'Apex', agents: ['orchestrator', 'replicator', 'swarm'] },
  { label: 'Operate', agents: ['growth_operator'] },
  { label: 'Build', agents: ['code_architect'] },
  { label: 'Grow', agents: ['social_strategist', 'sales_engine'] },
  { label: 'Discover', agents: ['brand_guardian'] },
];

const TOOLS = [
  ['architect', 'Meta Architect'],
  ['factory', 'System Factory'],
  ['batch', 'Batch Operations'],
  ['website-factory', 'Website Factory'],
  ['mission-control', 'Mission Control'],
  ['mission', 'Growth Mission'],
  ['domains', 'Domain Registry'],
  ['analytics', 'Live Analytics'],
];

export const AGENT_META = {
  orchestrator: { label: 'The Orchestrator', icon: '🧠' },
  growth_operator: { label: 'Growth Operator', icon: '🛡️' },
  code_architect: { label: 'Code Architect', icon: '⚙️' },
  social_strategist: { label: 'Social Strategist', icon: '📣' },
  sales_engine: { label: 'Sales Engine', icon: '🚀' },
  brand_guardian: { label: 'Brand Guardian', icon: '✦' },
  replicator: { label: 'The Replicator', icon: '🧬' },
  swarm: { label: 'The Swarm', icon: '🐝' },
};

export default function AgentSidebar({ selectedAgent, onSelect, onNew, collapsed, onCollapse, hasConversation }) {
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [toolsOpen, setToolsOpen] = useState(false);
  const choose = (fn) => { fn(); setOpen(false); };

  const matches = (name) => {
    if (!query) return true;
    const meta = AGENT_META[name];
    return meta.label.toLowerCase().includes(query.toLowerCase()) || name.includes(query.toLowerCase());
  };

  return <>
    {collapsed && <button type="button" aria-label="Expand sidebar" title="Expand sidebar" onClick={() => onCollapse(false)} className="absolute left-4 top-4 z-20 hidden rounded-lg p-2 text-foreground hover:bg-muted md:block"><PanelLeftOpen size={20}/></button>}
    <button aria-label="Open sidebar" type="button" onClick={() => setOpen(true)} className="absolute left-4 top-4 z-10 rounded-lg p-2 text-foreground hover:bg-consoleAccent hover:text-primary-foreground md:hidden"><Menu size={22}/></button>
    {open && <button type="button" aria-label="Close sidebar" onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-foreground/30 md:hidden"/>}
    <aside aria-label="Super Agents" className={`absolute inset-y-0 left-0 z-40 flex w-[270px] flex-col border-r border-border bg-background p-3 transition-transform md:relative md:shrink-0 md:translate-x-0 md:transition-[width,padding] ${collapsed ? 'md:w-0 md:overflow-hidden md:border-0 md:p-0' : ''} ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between px-2 pb-3 pt-1">
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary">
          <ArrowLeft size={16} /> Strategic Minds AI
        </Link>
        <button type="button" aria-label="Collapse sidebar" title="Collapse sidebar" onClick={() => onCollapse(true)} className="ml-auto hidden rounded p-2 text-foreground hover:bg-muted md:block"><PanelLeftClose size={19}/></button>
        <button type="button" aria-label="Close sidebar" onClick={() => setOpen(false)} className="rounded p-2 md:hidden"><X size={18}/></button>
      </div>
      <button type="button" onClick={() => choose(onNew)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-consoleAccent hover:text-primary-foreground"><SquarePen size={18}/> New chat</button>
      <button type="button" onClick={() => setSearching(!searching)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-consoleAccent hover:text-primary-foreground"><Search size={18}/> Search agents</button>
      {searching && <input autoFocus aria-label="Search agents" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search agents" className="my-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"/>}
      <div className="mt-5 min-h-0 flex-1 overflow-y-auto">
        {AGENT_GROUPS.map(group => {
          const visible = group.agents.filter(matches);
          if (visible.length === 0) return null;
          return <div key={group.label}>
            <p className="px-3 pb-1 pt-3 text-xs font-semibold text-muted-foreground">{group.label}</p>
            {visible.map(name => {
              const meta = AGENT_META[name];
              const active = selectedAgent === name;
              return <button key={name} type="button" onClick={() => choose(() => onSelect(name))} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-consoleAccent hover:text-primary-foreground ${active ? 'bg-muted font-medium' : ''}`}>
                <span className="text-base">{meta.icon}</span>
                <span className="truncate">{meta.label}</span>
                {hasConversation(name) && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"/>}
              </button>;
            })}
          </div>;
        })}
      </div>
      <div className="shrink-0 border-t border-border pt-2">
        <button type="button" aria-expanded={toolsOpen} aria-controls="agent-tools-list" onClick={() => setToolsOpen(value => !value)} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-foreground hover:bg-consoleAccent hover:text-primary-foreground"><Cpu size={17}/>Agent tools<ChevronDown size={16} className={`ml-auto transition-transform ${toolsOpen ? 'rotate-180' : ''}`}/></button>
        {toolsOpen && <div id="agent-tools-list" className="max-h-56 overflow-y-auto pl-2">
          {TOOLS.map(([id, label]) => <Link key={id} to={`/${id}`} className="block w-full rounded-lg px-3 py-1.5 text-left text-sm text-foreground hover:bg-consoleAccent hover:text-primary-foreground">{label}</Link>)}
        </div>}
      </div>
    </aside>
  </>;
}