import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, SquarePen, Search, X, PanelLeftClose, PanelLeftOpen, ChevronDown, Cpu, ArrowLeft, Check, Users, Layers } from 'lucide-react';
import { useLongPress } from './useLongPress';

function AgentListItem({ name, meta, selected, multiSelectMode, hasConversation, onToggleAgent }) {
  const longPress = useLongPress(() => onToggleAgent(name, true));
  return (
    <button
      key={name}
      type="button"
      onClick={() => onToggleAgent(name)}
      onTouchStart={longPress.onTouchStart}
      onTouchEnd={longPress.onTouchEnd}
      onTouchMove={longPress.onTouchMove}
      onContextMenu={longPress.onContextMenu}
      onMouseDown={longPress.onMouseDown}
      onMouseUp={longPress.onMouseUp}
      onMouseLeave={longPress.onMouseLeave}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-consoleAccent hover:text-primary-foreground ${selected ? 'bg-primary/10 font-medium' : ''}`}
    >
      {multiSelectMode && <span className={`flex h-4 w-4 items-center justify-center rounded border ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}><Check size={12} /></span>}
      <span className="truncate">{meta.label}</span>
      {hasConversation(name) && !multiSelectMode && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"/>}
    </button>
  );
}

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
  ['frontend-factory', 'Frontend Factory'],
  ['mission-control', 'Mission Control'],
  ['mission', 'Growth Mission'],
  ['domains', 'Domain Registry'],
  ['sandboxes', 'Sandbox System'],
  ['analytics', 'Live Analytics'],
  ['comms', 'SMS & Voice Inbox'],
];

export const AGENT_META = {
  orchestrator: { label: 'The Orchestrator', icon: 'brain' },
  growth_operator: { label: 'Growth Operator', icon: 'shield' },
  code_architect: { label: 'Code Architect', icon: 'code' },
  social_strategist: { label: 'Social Strategist', icon: 'megaphone' },
  sales_engine: { label: 'Sales Engine', icon: 'rocket' },
  brand_guardian: { label: 'Brand Guardian', icon: 'sparkles' },
  replicator: { label: 'The Replicator', icon: 'gitfork' },
  swarm: { label: 'The Swarm', icon: 'users' },
};

export const ALL_AGENT_NAMES = Object.keys(AGENT_META);

export default function AgentSidebar({ selectedAgents, onToggleAgent, onClearSelection, onSwarmMode, multiSelectMode, onExitMultiSelect, collapsed, onCollapse, hasConversation }) {
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [toolsOpen, setToolsOpen] = useState(false);
  const choose = (fn) => { fn(); setOpen(false); };

  const longPress = useLongPress(() => {
    // Long press enters multi-select mode (handled by parent via onToggleAgent)
  });

  const matches = (name) => {
    if (!query) return true;
    const meta = AGENT_META[name];
    return meta.label.toLowerCase().includes(query.toLowerCase()) || name.includes(query.toLowerCase());
  };

  const handleAgentClick = (name) => {
    onToggleAgent(name);
  };

  return <>
    {collapsed && <button type="button" aria-label="Expand sidebar" title="Expand sidebar" onClick={() => onCollapse(false)} className="absolute left-4 top-4 z-20 hidden rounded-lg p-2 text-foreground hover:bg-muted md:block"><PanelLeftOpen size={20}/></button>}
    <button aria-label={open ? "Close sidebar" : "Open sidebar"} type="button" onClick={() => setOpen(value => !value)} className="absolute left-4 top-4 z-50 rounded-lg p-2 text-foreground hover:bg-consoleAccent hover:text-primary-foreground md:hidden">{open ? <X size={22}/> : <Menu size={22}/>}</button>
    {open && <button type="button" aria-label="Close sidebar" onClick={() => setOpen(false)} className="fixed inset-0 top-14 z-30 bg-foreground/30 md:hidden"/>}
    <aside aria-label="Super Agents" className={`absolute top-14 left-0 z-40 flex max-h-[calc(100%-3.5rem)] w-full flex-col overflow-y-auto border-b border-border bg-background p-3 shadow-lg transition-transform duration-300 ease-out md:inset-y-0 md:top-0 md:max-h-none md:w-[270px] md:overflow-visible md:border-0 md:border-r md:border-border md:shadow-none md:transition-[width,padding] md:relative md:shrink-0 md:translate-y-0 ${collapsed ? 'md:w-0 md:overflow-hidden md:border-0 md:p-0' : ''} ${open ? 'translate-y-0' : '-translate-y-[calc(100%+3.5rem)] md:translate-y-0'}`}>
      <div className="flex items-center justify-between px-2 pb-3 pt-1">
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary">
          <ArrowLeft size={16} /> Strategic Minds AI
        </Link>
        <button type="button" aria-label="Collapse sidebar" title="Collapse sidebar" onClick={() => onCollapse(true)} className="ml-auto hidden rounded p-2 text-foreground hover:bg-muted md:block"><PanelLeftClose size={19}/></button>
        <button type="button" aria-label="Close sidebar" onClick={() => setOpen(false)} className="rounded p-2 md:hidden"><X size={18}/></button>
      </div>
      <button type="button" onClick={() => choose(onClearSelection)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-consoleAccent hover:text-primary-foreground"><SquarePen size={18}/> New chat</button>
      <button type="button" onClick={() => choose(onSwarmMode)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-consoleAccent hover:text-primary-foreground"><Users size={18}/> Swarm Mode</button>
      <button type="button" onClick={() => setSearching(!searching)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-consoleAccent hover:text-primary-foreground"><Search size={18}/> Search agents</button>
      {searching && <input autoFocus aria-label="Search agents" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search agents" className="my-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"/>}
      {multiSelectMode && (
        <div className="mt-2 flex items-center justify-between rounded-lg bg-primary/10 px-3 py-2">
          <span className="text-xs font-semibold text-primary">{selectedAgents.size} selected</span>
          <button type="button" onClick={() => choose(onExitMultiSelect)} className="text-xs text-muted-foreground hover:text-foreground">Done</button>
        </div>
      )}
      <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
        {AGENT_GROUPS.map(group => {
          const visible = group.agents.filter(matches);
          if (visible.length === 0) return null;
          return <div key={group.label}>
            <p className="px-3 pb-1 pt-3 text-xs font-semibold text-muted-foreground">{group.label}</p>
            {visible.map(name => (
              <AgentListItem
                key={name}
                name={name}
                meta={AGENT_META[name]}
                selected={selectedAgents.has(name)}
                multiSelectMode={multiSelectMode}
                hasConversation={hasConversation}
                onToggleAgent={onToggleAgent}
              />
            ))}
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