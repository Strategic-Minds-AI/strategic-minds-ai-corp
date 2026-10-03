import { useCallback } from 'react';
import useSessionState from '@/hooks/useSessionState';
import AgentSidebar, { AGENT_META, ALL_AGENT_NAMES } from '@/components/agents/AgentSidebar';
import AgentChat, { loadAgentChat, clearAgentChat, clearSwarmChat } from '@/components/agents/AgentChat';

export default function AgentCommandCenter({ initialAgent }) {
  const [selectedAgents, setSelectedAgents] = useSessionState('agentCmd.selectedAgents', () => {
    if (initialAgent) return [...new Set([initialAgent])];
    return ['orchestrator'];
  });
  const [multiSelectMode, setMultiSelectMode] = useSessionState('agentCmd.multiSelect', false);
  const [sidebarCollapsed, setSidebarCollapsed] = useSessionState('agentCmd.sidebarCollapsed', false);
  const [chatKey, setChatKey] = useSessionState('agentCmd.chatKey', 0);

  const toggleAgent = useCallback((name, fromLongPress = false) => {
    setSelectedAgents(prev => {
      const set = new Set(prev);
      if (fromLongPress || multiSelectMode) {
        if (set.has(name)) set.delete(name);
        else set.add(name);
        if (fromLongPress) setMultiSelectMode(true);
      } else {
        set.clear();
        set.add(name);
      }
      return [...set];
    });
  }, [multiSelectMode, setSelectedAgents, setMultiSelectMode]);

  const clearSelection = useCallback(() => {
    const current = [...selectedAgents];
    if (current.length === 1) clearAgentChat(current[0]);
    else if (current.length > 1) clearSwarmChat(current);
    setSelectedAgents(['orchestrator']);
    setMultiSelectMode(false);
    setChatKey(k => k + 1);
  }, [selectedAgents, setSelectedAgents, setMultiSelectMode, setChatKey]);

  const swarmMode = useCallback(() => {
    setSelectedAgents([...ALL_AGENT_NAMES]);
    setMultiSelectMode(true);
    setChatKey(k => k + 1);
  }, [setSelectedAgents, setMultiSelectMode, setChatKey]);

  const exitMultiSelect = useCallback(() => {
    setMultiSelectMode(false);
    if (selectedAgents.length === 0) setSelectedAgents(['orchestrator']);
  }, [selectedAgents, setMultiSelectMode, setSelectedAgents]);

  const hasConversation = useCallback((name) => loadAgentChat(name).length > 0, []);

  const agentNames = [...selectedAgents];
  const meta = agentNames.length === 1 ? AGENT_META[agentNames[0]] : null;
  const selectedSet = new Set(agentNames);
  const headerLabel = agentNames.length > 1 ? `Swarm: ${agentNames.length} Agents` : meta?.label || 'Agent';

  return (
    <main className="fixed inset-0 z-50 flex overflow-hidden bg-background font-body text-foreground">
      <AgentSidebar
        selectedAgents={selectedSet}
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