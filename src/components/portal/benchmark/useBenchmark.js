import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
export default function useBenchmark(enabled) {
  const [data, setData] = useState(null); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(''); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const refresh = useCallback(async () => {
    if (!enabled) { setLoading(false); return; }
    try { const result = await base44.functions.invoke('benchmarkHub', { action: 'catalog' }); setData(result.data); setError(''); }
    catch (failure) { setError(failure.response?.data?.error || failure.message || 'Could not load the benchmark.'); }
    finally { setLoading(false); }
  }, [enabled]);
  useEffect(() => { refresh(); if (!enabled) return; const subscriptions = [base44.entities.BenchmarkRun.subscribe(refresh), base44.entities.EnhancementJob.subscribe(refresh), base44.entities.BenchmarkCheckpoint.subscribe(refresh)]; return () => subscriptions.forEach(unsubscribe => unsubscribe()); }, [refresh, enabled]);
  useEffect(() => {
    if (!data?.report.evidence_fresh) return;
    const delay = Math.max(1000, Date.parse(data.report.observed_at) + 15 * 60 * 1000 - Date.now() + 100);
    const timer = setTimeout(refresh, delay); return () => clearTimeout(timer);
  }, [data?.report.observed_at, data?.report.evidence_fresh, refresh]);
  async function act(label, operation, refreshAfter = true) {
    if (busy) return null;
    setBusy(label); setError(''); setNotice('');
    try { const value = await operation(); if (refreshAfter) await refresh(); return value; }
    catch (failure) { setError(failure.response?.data?.error || failure.message || 'The requested operation did not complete.'); throw failure; }
    finally { setBusy(''); }
  }
  async function loadMore() {
    return act('more', async () => { const result = await base44.functions.invoke('benchmarkHub', { action: 'jobs', skip: data.jobs.length }); setData(previous => ({ ...previous, jobs: [...previous.jobs, ...result.data.jobs], jobs_more: result.data.more })); }, false);
  }
  return { data, setData, loading, busy, error, notice, setNotice, refresh, act, loadMore };
}