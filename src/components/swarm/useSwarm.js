import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { defaultAgents } from '@/components/swarm/catalog';
import { createSwarm } from '@/components/swarm/swarmActions';

export default function useSwarm() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [active, setActive] = useState(null), [prompt, setPrompt] = useState('');
  const [selected, setSelected] = useState(defaultAgents), [preset, setPreset] = useState('general');
  const [runtime, setRuntime] = useState('native'), [concurrency, setConcurrency] = useState(3);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const runsQuery = useQuery({ queryKey: ['swarm-runs', user?.id], enabled: !!user, queryFn: () => base44.entities.SwarmRun.filter({ created_by: user.id }, '-created_at', 100) });
  const tasksQuery = useQuery({ queryKey: ['swarm-tasks', active], enabled: !!active, queryFn: () => base44.entities.SwarmTask.filter({ run_id: active }, 'created_at', 100), refetchInterval: active ? 10000 : false });
  const run = runsQuery.data?.find(r => r.id === active);
  useEffect(() => {
    const offRuns = base44.entities.SwarmRun.subscribe(() => qc.invalidateQueries({ queryKey: ['swarm-runs'] }));
    const offTasks = base44.entities.SwarmTask.subscribe(() => qc.invalidateQueries({ queryKey: ['swarm-tasks'] }));
    return () => { offRuns(); offTasks(); };
  }, [qc]);
  function newRun() { if (busy) return; setActive(null); setPrompt(''); setError(''); }
  function openRun(r) { if (busy) return; setActive(r.id); setPrompt(r.prompt); setSelected(r.agent_ids); setPreset(r.preset || 'general'); setRuntime(r.runtime); setConcurrency(r.concurrency || 3); setError(''); }
  function toggleAgent(id) { if (busy) return; setActive(null); setSelected(v => v.includes(id) ? v.filter(x => x !== id) : [...v, id]); }
  async function dispatch() {
    setBusy(true); setError('');
    try {
      await createSwarm({ prompt, selected, preset, runtime, concurrency }, r => {
        qc.setQueryData(['swarm-runs', user.id], old => [r, ...(old || [])]); setActive(r.id);
        qc.invalidateQueries({ queryKey: ['swarm-tasks'] });
      });
    } catch (e) { setError(e.message || 'Unable to save this run. Please try again.'); }
    finally { setBusy(false); qc.invalidateQueries({ queryKey: ['swarm-runs'] }); qc.invalidateQueries({ queryKey: ['swarm-tasks'] }); }
  }
  return { user, run, runs: runsQuery.data || [], tasks: tasksQuery.data || [], loading: runsQuery.isLoading || (!!active && tasksQuery.isLoading), loadError: runsQuery.error || tasksQuery.error, prompt, setPrompt, selected, toggleAgent, preset, setPreset, runtime, setRuntime, concurrency, setConcurrency, busy, error, dispatch, newRun, openRun };
}