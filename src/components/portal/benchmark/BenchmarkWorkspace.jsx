import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import useBenchmark from '@/components/portal/benchmark/useBenchmark';
import useBenchmarkActions from '@/components/portal/benchmark/useBenchmarkActions';
import BenchmarkTabs from '@/components/portal/benchmark/BenchmarkTabs';
import BenchmarkScore from '@/components/portal/benchmark/BenchmarkScore';
import BenchmarkControls from '@/components/portal/benchmark/BenchmarkControls';
import BenchmarkCompetitors from '@/components/portal/benchmark/BenchmarkCompetitors';
import BenchmarkSources from '@/components/portal/benchmark/BenchmarkSources';
import BenchmarkAudit from '@/components/portal/benchmark/BenchmarkAudit';
import BenchmarkComparison from '@/components/portal/benchmark/BenchmarkComparison';
import BenchmarkFilters from '@/components/portal/benchmark/BenchmarkFilters';
import BenchmarkLibrary from '@/components/portal/benchmark/BenchmarkLibrary';
import BenchmarkCriterion from '@/components/portal/benchmark/BenchmarkCriterion';
import BenchmarkValidation from '@/components/portal/benchmark/BenchmarkValidation';
import BenchmarkJobs from '@/components/portal/benchmark/BenchmarkJobs';
import BenchmarkContinuation from '@/components/portal/benchmark/BenchmarkContinuation';
import BenchmarkCoding from '@/components/portal/benchmark/BenchmarkCoding';
export default function BenchmarkWorkspace({ projects = [], onDraft }) {
  const { user } = useAuth(); const api = useBenchmark(user?.role === 'admin'); const actions = useBenchmarkActions(api);
  const [tab, setTab] = useState('overview'); const [query, setQuery] = useState(''); const [domain, setDomain] = useState('');
  if (user?.role !== 'admin') return <p role="alert" className="p-8 text-sm">Admin access required.</p>;
  const data = api.data; const selected = data?.criteria.find(item => item.id === actions.selectedId);
  const openCriterion = id => { setTab('library'); actions.select(id); };
  return <section className="mx-auto max-w-6xl space-y-5"><header><p className="agency-eyebrow mb-2">AGENCY / EVIDENCE & IMPROVEMENT</p><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="mb-2 text-2xl">Benchmark & improvement lab</h1><button type="button" disabled={!!api.busy} onClick={api.refresh} className="text-xs text-primary underline">Refresh evidence</button></div><p className="mb-0 text-sm text-muted-foreground">Sourced comparisons, open forensic findings, implementation briefs and independently scored evidence. No automatic claims of production readiness.</p></header>{api.error && <p role="alert" className="rounded-lg border border-destructive p-3 text-sm text-destructive">{api.error}{data && ' Previously loaded data may be stale.'}</p>}{api.notice && <p role="status" className="rounded-lg border border-border bg-muted p-3 text-xs text-primary">{api.notice}</p>}{api.loading && <p role="status" className="text-sm">Loading benchmark evidence…</p>}
    {data && <><BenchmarkScore report={data.report} criterionCount={data.criteria.length}/><BenchmarkControls busy={api.busy} projects={projects} projectId={actions.projectId} onProject={actions.setProjectId} onVerify={actions.verify} onSelfCheck={() => { setTab('validation'); actions.controls(); }} onExport={actions.exportEvidence} onSave={actions.save}/>{!!data.rejected_receipts && <p role="alert" className="text-xs text-destructive">{data.rejected_receipts} modified or incompatible evidence receipt(s) rejected.</p>}<BenchmarkContinuation checkpoint={data.checkpoint} compatible={data.checkpoint_compatible} queue={data.work_queue} onCriterion={openCriterion}/><BenchmarkTabs active={tab} onSelect={setTab}/>{['comparison','library'].includes(tab) && <BenchmarkFilters criteria={data.criteria} query={query} onQuery={setQuery} domain={domain} onDomain={setDomain}/>}
      {tab === 'overview' && <><BenchmarkCoding/><button type="button" onClick={() => setTab('audit')} className="w-full rounded-lg border border-border bg-muted p-4 text-left text-sm text-foreground">{data.findings.length} open source findings, including {data.findings.filter(item => item.severity === 'Critical').length} critical finding(s). <span className="text-primary underline">Review the forensic audit before enabling unattended actions.</span></button><BenchmarkCompetitors competitors={data.competitors} policy={data.selection_policy}/><BenchmarkSources sources={data.sources}/></>}
      {tab === 'comparison' && <BenchmarkComparison criteria={data.criteria} report={data.report} query={query} domain={domain} onCriterion={openCriterion}/>}
      {tab === 'audit' && <BenchmarkAudit findings={data.findings} baseline={data.source_baseline} onCriterion={openCriterion}/>}
      {tab === 'library' && <BenchmarkLibrary criteria={data.criteria} query={query} domain={domain} onCriterion={openCriterion} onRoadmap={actions.roadmap}/>}
      {tab === 'validation' && <BenchmarkValidation report={data.report} selfCheck={actions.selfCheck} criteria={data.criteria}/>}
      {tab === 'jobs' && <BenchmarkJobs jobs={data.jobs} criteria={data.criteria} more={data.jobs_more} onMore={() => api.loadMore().catch(() => null)} busy={api.busy} onRetry={actions.retryPlan}/>}
      {selected && <BenchmarkCriterion key={selected.id} criterion={selected} sources={data.sources} busy={api.busy} onClose={actions.close} onPrepare={actions.prepare} onDraft={onDraft} prompt={actions.prompt} notice={api.notice}/>}
    </>}
  </section>;
}