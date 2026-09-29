import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { downloadBenchmark } from '@/components/portal/benchmark/benchmarkDownloads';
export default function useBenchmarkActions(api) {
  const [selectedId, setSelectedId] = useState(null); const [prompt, setPrompt] = useState(null); const [projectId, setProjectId] = useState(''); const [selfCheck, setSelfCheck] = useState(null);
  const handle = (label, operation) => api.act(label, operation).catch(() => null);
  function select(id) { setSelectedId(id); setPrompt(null); api.setNotice(''); }
  async function prepare(id, route) {
    const value = await handle('prepare', async () => {
      const prepared = await base44.functions.invoke('benchmarkHub', { action: 'prepare', criterionId: id, route, requestId: crypto.randomUUID() });
      if (route === 'admin') { const planned = await base44.functions.invoke('benchmarkHub', { action: 'plan', jobId: prepared.data.job.id }); return { ...prepared.data, job: planned.data.job }; }
      return prepared.data;
    });
    if (!value) throw new Error('Enhancement preparation failed; no implementation was performed.');
    setPrompt(value); api.setNotice(route === 'admin' ? 'Draft plan saved in Enhancement records. No code or business actions executed.' : route === 'worker' ? 'Worker contract prepared; no worker job was dispatched.' : 'Builder brief prepared; submit it in the build chat to request implementation.'); return value;
  }
  async function verify() { const value = await handle('verify', async () => (await base44.functions.invoke('benchmarkValidator', { action: 'run' })).data); if (value) api.setNotice('Signed read observations saved. Untested behavior, security, recovery and release checks receive no parity credit.'); }
  async function controls() { const value = await handle('selfcheck', async () => (await base44.functions.invoke('benchmarkValidator', { action: 'selfcheck' })).data); if (value) { setSelfCheck(value); api.setNotice(value.passed ? 'Validator control checks passed; no business-system parity credit awarded.' : 'Validator control checks failed; do not trust release decisions.'); } }
  async function save() { const value = await handle('save', async () => (await base44.functions.invoke('benchmarkHub', { action: 'saveDrive', projectId, approved: true })).data); if (value) api.setNotice(`Report saved to project Drive: ${value.file.name}`); }
  async function roadmap() { const value = await handle('roadmap', async () => (await base44.functions.invoke('benchmarkHub', { action: 'roadmap' })).data); if (value) downloadBenchmark(value, 'agency-enhancement-roadmap.json'); }
  function exportEvidence() { downloadBenchmark(api.data, `agency-audit-evidence-${new Date().toISOString().slice(0,10)}.json`); }
  async function retryPlan(id) { const value = await handle('prepare', async () => (await base44.functions.invoke('benchmarkHub', { action: 'plan', jobId: id })).data); if (value) api.setNotice('Draft plan saved. No implementation or execution claimed.'); }
  return { selectedId, select, close: () => { setSelectedId(null); setPrompt(null); }, prompt, projectId, setProjectId, selfCheck, prepare, verify, controls, save, roadmap, exportEvidence, retryPlan };
}