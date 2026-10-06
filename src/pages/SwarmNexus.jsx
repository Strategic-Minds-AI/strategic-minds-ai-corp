import { useState } from 'react';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import useSwarm from '@/components/swarm/useSwarm';
import Sidebar from '@/components/swarm/Sidebar';
import WorkspaceHeader from '@/components/swarm/WorkspaceHeader';
import WorkspaceFooter from '@/components/swarm/WorkspaceFooter';
import SwarmStage from '@/components/swarm/SwarmStage';
import RuntimePanel from '@/components/swarm/RuntimePanel';
import AgentLibrary from '@/components/swarm/AgentLibrary';
import ConnectionsDialog from '@/components/swarm/ConnectionsDialog';
import ParametersDialog from '@/components/swarm/ParametersDialog';

export default function SwarmNexus() {
  const swarm = useSwarm();
  const [library, setLibrary] = useState(false), [connections, setConnections] = useState(false), [parameters, setParameters] = useState(false);
  const [menu, setMenu] = useState(false), [runtimeDrawer, setRuntimeDrawer] = useState(false), [runtimeOpen, setRuntimeOpen] = useState(true);
  const openLibrary = () => { setMenu(false); setLibrary(true); };
  const openConnections = () => { setMenu(false); setRuntimeDrawer(false); setConnections(true); };
  const toggleRuntime = () => window.innerWidth < 1280 ? setRuntimeDrawer(v => !v) : setRuntimeOpen(v => !v);
  return <div className="flex h-dvh w-full overflow-hidden bg-background text-foreground">
    <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-primary focus:p-3 focus:text-primary-foreground">Skip to workspace</a>
    <div className="hidden shrink-0 border-r md:block"><Sidebar swarm={swarm} onLibrary={openLibrary} onConnect={openConnections}/></div>
    <main className="flex min-w-0 flex-1 flex-col">
      <WorkspaceHeader swarm={swarm} onMenu={() => setMenu(true)} onRuntime={toggleRuntime} runtimeOpen={runtimeOpen}/>
      <SwarmStage swarm={swarm} onLibrary={openLibrary} onConnect={openConnections} onParameters={() => setParameters(true)} onRuntime={toggleRuntime}/>
      <WorkspaceFooter count={swarm.selected.length} concurrency={swarm.concurrency} onParameters={() => setParameters(true)}/>
    </main>
    {runtimeOpen && <div className="hidden shrink-0 border-l xl:block"><RuntimePanel swarm={swarm} onConnect={openConnections}/></div>}
    <Sheet open={menu} onOpenChange={setMenu}><SheetContent side="left" className="w-[240px] p-0"><SheetTitle className="sr-only">Workspace navigation</SheetTitle><SheetDescription className="sr-only">Manage swarms, agents and connections.</SheetDescription><Sidebar swarm={swarm} onLibrary={openLibrary} onConnect={openConnections} onClose={() => setMenu(false)}/></SheetContent></Sheet>
    <Sheet open={runtimeDrawer} onOpenChange={setRuntimeDrawer}><SheetContent side="right" className="w-[320px] max-w-[90vw] p-0"><SheetTitle className="sr-only">Runtime overview</SheetTitle><SheetDescription className="sr-only">MCP connection status and swarm activity.</SheetDescription><RuntimePanel swarm={swarm} onConnect={openConnections}/></SheetContent></Sheet>
    <AgentLibrary open={library} onOpenChange={setLibrary} selected={swarm.selected} onToggle={swarm.toggleAgent} busy={swarm.busy}/>
    <ConnectionsDialog open={connections} onOpenChange={setConnections} run={swarm.run}/>
    <ParametersDialog open={parameters} onOpenChange={setParameters} swarm={swarm}/>
  </div>;
}