import { useState } from 'react';
import AgentSidebar, { AGENT_META } from '@/components/agents/AgentSidebar';
import AgentChat, { loadAgentChat, clearAgentChat } from '@/components/agents/AgentChat';

export default function AgentCommandCenter({ initialAgent }) {
  const [selectedAgent, setSelectedAgent] = useState(initialAgent || 'orchestrator');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const selectAgent = (name) => setSelectedAgent(name);

  const newChat = () => {
    clearAgentChat(selectedAgent);
    // Force re-render of AgentChat by toggling a key
    setSelectedAgent('');
    setTimeout(() => setSelectedAgent(initialAgent || 'orchestrator'), 0);
  };

  const hasConversation = (name) => loadAgentChat(name).length > 0;

  const meta = AGENT_META[selectedAgent] || AGENT_META.orchestrator;

  return (
    <main className="fixed inset-0 z-50 flex overflow-hidden bg-background font-body text-foreground">
      <AgentSidebar
        selectedAgent={selectedAgent}
        onSelect={selectAgent}
        onNew={newChat}
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
        hasConversation={hasConversation}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        {selectedAgent ? (
          <AgentChat key={selectedAgent} agentName={selectedAgent} agentLabel={meta.label} onNewChat={() => { clearAgentChat(selectedAgent); setSelectedAgent(''); setTimeout(() => setSelectedAgent(selectedAgent), 0); }} />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">Select an agent to begin</div>
        )}
      </div>
    </main>
  );
}