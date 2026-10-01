import { useState, useCallback } from 'react';
import AgentSidebar, { AGENT_META, ALL_AGENT_NAMES } from '@/components/agents/AgentSidebar';
import AgentChat, { loadAgentChat, clearAgentChat, clearSwarmChat } from '@/components/agents/AgentChat';

export default function AgentCommandCenter({ initialAgent }) {
  const [selectedAgents, setSelectedAgents] = useState(() => {
    if (initialAgent) return new Set([initialAgent]);
    return new Set(['orchestrator']);
  });
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatKey, setChatKey] = useState(0);

  const toggleAgent = useCallback((name, fromLongPress = false) => {
    setSelectedAgents(prev => {
      const next = new Set(prev);
      if (fromLongPress || multiSelectMode) {
        if (next.has(name)) next.delete(name);
        else next.add(name);
        if (fromLongPress) setMultiSelectMode(true);
      } else {
        next.clear();
        next.add(name);
      }
      return next;
    });
  }, [multiSelectMode]);

  const clearSelection = useCallback(() => {
    const current = [...selectedAgents];
    if (current.length === 1) clearAgentChat(current[0]);
    else if (current.length > 1) clearSwarmChat(current);
    setSelectedAgents(new Set(['orchestrator']));
    setMultiSelectMode(false);
    setChatKey(k => k + 1);
  }, [selectedAgents]);

  const swarmMode = useCallback(() => {
    setSelectedAgents(new Set(ALL_AGENT_NAMES));
    setMultiSelectMode(true);
    setChatKey(k => k + 1);
  }, []);

  const exitMultiSelect = useCallback(() => {
    setMultiSelectMode(false);
    if (selectedAgents.size === 0) setSelectedAgents(new Set(['orchestrator']));
  }, [selectedAgents]);

  const hasConversation = useCallback((name) => loadAgentChat(name).length > 0, []);

  const agentNames = [...selectedAgents];
  const meta = agentNames.length === 1 ? AGENT_META[agentNames[0]] : null;
  const headerLabel = agentNames.length > 1 ? `Swarm: ${agentNames.length} Agents` : meta?.label || 'Agent';

  return (
    <main className="fixed inset-0 z-50 flex overflow-hidden bg-background font-body text-foreground">
      <AgentSidebar
        selectedAgents={selectedAgents}
        onToggleAgent={toggleAgent}
        onClearSelection={clearSelection}
        onSwarmMode={swarmMode}
        multiSelectMode={multiSelectMode}
        onExitMultiSelect={exitMultiSelect}
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
        hasConversation={hasConversation}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        {agentNames.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">Select an agent to begin</div>
        ) : (
          <AgentChat key={chatKey} agentNames={agentNames} onNewChat={clearSelection} />
        )}
      </div>
    </main>
  );
}