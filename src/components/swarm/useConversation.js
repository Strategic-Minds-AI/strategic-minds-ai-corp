import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
export default function useConversation(id) {
  const [live, setLive] = useState(null);
  const query = useQuery({ queryKey: ['swarm-conversation', id], enabled: !!id, queryFn: () => base44.agents.getConversation(id) });
  useEffect(() => { setLive(null); if (!id) return; return base44.agents.subscribeToConversation(id, data => setLive({ id, messages: data?.messages || [] })); }, [id]);
  return { messages: live && live.id === id ? live.messages : query.data?.messages || [], loading: !!id && query.isLoading, error: query.error };
}