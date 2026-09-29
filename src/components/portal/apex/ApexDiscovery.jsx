import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import CapabilityRecord from '@/components/portal/apex/CapabilityRecord';
export default function ApexDiscovery() {
  const [registry, setRegistry] = useState(null); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [query, setQuery] = useState(''); const [changes, setChanges] = useState([]);
  async function discover() {
    setBusy(true); setError('');
    try {
      const { data } = await base44.functions.invoke('apexDiscovery', {});
      if (registry) {
        const changedCapabilities = data.capabilities.filter(item => { const old = registry.capabilities.find(value => value.capability_id === item.capability_id); return !old || old.availability !== item.availability || old.health_status !== item.health_status; }).map(item => `${item.capability_name}: ${item.availability} / ${item.health_status}`);
        const addedModels = data.models.ids.filter(id => !registry.models.ids.includes(id)).map(id => `Catalog model added: ${id} (inference unverified)`);
        const removedModels = registry.models.ids.filter(id => !data.models.ids.includes(id)).map(id => `Catalog model removed: ${id}`);
        setChanges([...changedCapabilities, ...addedModels, ...removedModels]);
      }
      setRegistry(data);
    } catch (failure) { setError(failure.response?.data?.error || failure.message || 'Could not discover capabilities.'); }
    finally { setBusy(false); }
  }
  useEffect(() => { discover(); }, []);
  function download() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(registry, null, 2)], { type: 'application/json' })); const link = document.createElement('a'); link.href = url; link.download = `APEX-capability-registry-${registry.observed_at.replace(/[:.]/g, '-')}.json`; link.click(); URL.revokeObjectURL(url);
  }
  const records = registry?.capabilities.filter(item => `${item.capability_name} ${item.provider} ${item.category} ${item.availability}`.toLowerCase().includes(query.toLowerCase())) || [];
  return <div className="mx-auto max-w-4xl space-y-5"><div><p className="agency-eyebrow mb-2">APEX · DISCOVERY</p><h1 className="mb-2 text-2xl">Capability registry</h1><p className="text-sm text-muted-foreground">Live read checks, existing implementation evidence, and explicit blockers. Verified reads do not certify writes, full parity, or private ChatGPT capabilities.</p></div><div className="flex flex-wrap gap-3"><button type="button" onClick={discover} disabled={busy} className="agency-button">{busy ? 'Checking connections…' : 'Rediscover read access'}</button><button type="button" disabled={!registry || busy} onClick={download} className="rounded border border-border px-4 py-2 text-xs text-primary disabled:opacity-50">Export registry</button></div>{error && <p role="alert" className="text-sm text-destructive">{error}{registry && ' The previous snapshot remains; it is not fresh evidence.'}</p>}{busy && <p role="status" className="text-sm">APEX: checking configured read surfaces. No writes, generation, or worker execution.</p>}
    {registry && <><div className="space-y-2 rounded-lg border border-border bg-muted p-4 text-xs"><p className="mb-0">Observed: {new Date(registry.observed_at).toLocaleString()} · {registry.capabilities.length} records · {registry.models.ids.length} catalog models</p><p className="mb-0">Session-only registry. Export to retain this evidence; durable storage requires approval. Source-inspection records are not live runtime tests.</p><p className="mb-0">No external ChatGPT plugin/skill inventory, authenticated computer worker, or remote-phone bridge verified.</p></div>{changes.length > 0 && <section className="rounded-lg border border-border p-4"><h2 className="mb-2 text-base">Changes since previous check</h2><ul className="space-y-1 text-xs">{changes.map(change => <li key={change}>{change}</li>)}</ul><p className="mt-2 text-xs">These are observed health changes, not automatic conflict resolution or permission grants.</p></section>}<label className="block text-xs">Find a capability<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Provider, capability, category, or status" className="agency-input"/></label><div className="space-y-3">{records.length ? records.map(record => <CapabilityRecord key={record.capability_id} record={record}/>) : <p className="text-sm">No matching capabilities.</p>}</div><details className="rounded-lg border border-border p-4"><summary className="cursor-pointer text-sm text-foreground">Model catalog — inference not verified</summary><ul className="mt-3 max-h-64 space-y-1 overflow-auto font-mono text-xs">{registry.models.ids.map(id => <li key={id}>{id}</li>)}</ul></details></>}
  </div>;
}