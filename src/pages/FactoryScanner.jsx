import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, ShieldCheck, ShieldAlert, Loader2, CheckCircle, XCircle, FileSearch, Code2, Wrench, Server, AlertTriangle } from 'lucide-react';

// No-Stub Completeness Scanner
// Scans generator definitions, adapter manifests, and template packs for:
// 1. Placeholder/stub function bodies (TODO, FIXME, "not implemented", empty handlers)
// 2. Fake success returns (returning success without real execution)
// 3. Missing adapter wiring (actions declared but no implementation)
// 4. Incomplete validation policies (mandatory validators missing)
// 5. Missing approval gates for PROTECTED risk actions

const STUB_PATTERNS = [
  { id: 'todo', regex: /\bTODO\b/i, severity: 'warning', message: 'TODO comment found — incomplete implementation' },
  { id: 'fixme', regex: /\bFIXME\b/i, severity: 'warning', message: 'FIXME comment found — known incomplete code' },
  { id: 'not_implemented', regex: /not\s+implemented|unimplemented/i, severity: 'critical', message: 'Explicit "not implemented" marker' },
  { id: 'placeholder', regex: /placeholder|stub\s*function|fake\s*handler/i, severity: 'critical', message: 'Placeholder or stub function detected' },
  { id: 'empty_return', regex: /return\s*(\{\s*\}|\[\s*\]|""|''|undefined|null)\s*;?\s*$/m, severity: 'warning', message: 'Empty return value — possible fake success' },
  { id: 'mock_success', regex: /mock\s*success|simulate\s*success|fake\s*success/i, severity: 'critical', message: 'Mock/fake success return detected' },
  { id: 'noop', regex: /\/\/\s*noop|no-op|no\s*operation/i, severity: 'warning', message: 'No-op handler — does nothing' },
];

const MANDATORY_VALIDATORS = ['schema', 'completeness'];
const PROTECTED_ACTIONS = ['repo_create', 'file_write', 'project_create', 'schema_write', 'deploy', 'service_create', 'service_deploy'];

export default function FactoryScanner() {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const runScan = async () => {
    setScanning(true);
    setError(null);
    setResults(null);
    try {
      const [genRes, adapterRes, templateRes] = await Promise.all([
        base44.functions.invoke('factoryOS', { action: 'listGenerators' }),
        base44.functions.invoke('factoryOS', { action: 'listAdapters' }),
        base44.functions.invoke('factoryOS', { action: 'listTemplatePacks' }),
      ]);

      const generators = genRes.data?.generators || [];
      const adapters = adapterRes.data?.adapters || [];
      const templates = templateRes.data?.templates || [];

      const findings = [];

      // Scan generators
      for (const gen of generators) {
        let def = {};
        try { def = JSON.parse(gen.definition_json || '{}'); } catch { /* empty */ }

        // Check definition_json for stub patterns
        const defStr = gen.definition_json || '';
        for (const pattern of STUB_PATTERNS) {
          if (pattern.regex.test(defStr)) {
            findings.push({
              target: gen.generator_key,
              target_type: 'generator',
              severity: pattern.severity,
              message: pattern.message,
              detail: `In definition_json of "${gen.name}"`,
            });
          }
        }

        // Check validation policy completeness
        const mandatory = def.validation_policy?.mandatory || [];
        const missingValidators = MANDATORY_VALIDATORS.filter((v) => !mandatory.includes(v));
        if (missingValidators.length > 0) {
          findings.push({
            target: gen.generator_key,
            target_type: 'generator',
            severity: 'warning',
            message: `Missing mandatory validators: ${missingValidators.join(', ')}`,
            detail: `Generator "${gen.name}" validation_policy.mandatory is incomplete`,
          });
        }

        // Check approval gates for protected actions
        const dagNodes = def.workflow_dag?.nodes || [];
        const hasExport = dagNodes.some((n) => typeof n === 'string' ? n === 'export' : n.type === 'export');
        const approvalRequired = def.approval_policy?.required_for || [];
        if (hasExport && !approvalRequired.includes('export')) {
          findings.push({
            target: gen.generator_key,
            target_type: 'generator',
            severity: 'warning',
            message: 'Export step lacks approval gate',
            detail: `Generator "${gen.name}" has an export step but "export" is not in approval_policy.required_for`,
          });
        }

        // Check for empty workflow DAG
        if (!dagNodes || dagNodes.length === 0) {
          findings.push({
            target: gen.generator_key,
            target_type: 'generator',
            severity: 'critical',
            message: 'Empty workflow DAG — no steps defined',
            detail: `Generator "${gen.name}" has no workflow_dag.nodes`,
          });
        }
      }

      // Scan adapters
      for (const adapter of adapters) {
        let actions = [];
        try { actions = JSON.parse(adapter.actions_json || '[]'); } catch { /* empty */ }

        if (actions.length === 0) {
          findings.push({
            target: adapter.adapter_key,
            target_type: 'adapter',
            severity: 'warning',
            message: 'No actions defined',
            detail: `Adapter "${adapter.name}" has an empty actions_json`,
          });
        }

        // Check that PROTECTED risk actions have requires_approval
        for (const action of actions) {
          if (PROTECTED_ACTIONS.includes(action.name) && !action.requires_approval) {
            findings.push({
              target: adapter.adapter_key,
              target_type: 'adapter',
              severity: 'critical',
              message: `Protected action "${action.name}" missing approval gate`,
              detail: `Adapter "${adapter.name}" action "${action.name}" has risk_class PROTECTED but requires_approval is false`,
            });
          }
        }

        // Check health status
        if (adapter.health_status === 'not_configured') {
          findings.push({
            target: adapter.adapter_key,
            target_type: 'adapter',
            severity: 'warning',
            message: 'Adapter not configured',
            detail: `Adapter "${adapter.name}" health_status is not_configured — secrets may be missing`,
          });
        }
      }

      // Scan templates
      for (const tpl of templates) {
        let files = [];
        try { files = JSON.parse(tpl.files_json || '[]'); } catch { /* empty */ }

        if (files.length === 0) {
          findings.push({
            target: tpl.template_key,
            target_type: 'template',
            severity: 'warning',
            message: 'No files in template pack',
            detail: `Template "${tpl.name}" has an empty files_json`,
          });
        }

        // Check template content for stubs
        for (const file of files) {
          const content = file.content || '';
          for (const pattern of STUB_PATTERNS) {
            if (pattern.regex.test(content)) {
              findings.push({
                target: tpl.template_key,
                target_type: 'template',
                severity: pattern.severity,
                message: pattern.message,
                detail: `In file "${file.path || file.name || 'unknown'}" of template "${tpl.name}"`,
              });
            }
          }
        }
      }

      const summary = {
        total_targets: generators.length + adapters.length + templates.length,
        total_findings: findings.length,
        critical: findings.filter((f) => f.severity === 'critical').length,
        warnings: findings.filter((f) => f.severity === 'warning').length,
        ready_for_production: findings.filter((f) => f.severity === 'critical').length === 0,
      };

      setResults({ findings, summary, scanned: { generators: generators.length, adapters: adapters.length, templates: templates.length } });
    } catch (e) {
      setError(e.message);
    }
    setScanning(false);
  };

  const criticalFindings = useMemo(() => results?.findings.filter((f) => f.severity === 'critical') || [], [results]);
  const warningFindings = useMemo(() => results?.findings.filter((f) => f.severity === 'warning') || [], [results]);

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="sticky top-0 z-10 flex min-h-16 items-center gap-3 border-b border-border bg-background px-5 py-2 pl-16">
        <button onClick={() => navigate('/factory')} className="rounded-lg p-2 text-foreground hover:bg-muted"><ArrowLeft size={20} /></button>
        <ShieldCheck size={18} className="text-primary" />
        <span className="text-sm font-semibold text-foreground">No-Stub Scanner</span>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">Completeness Audit</span>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-6">
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <XCircle size={16} /> {error}
          </div>
        )}

        {/* Scan Control */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <FileSearch size={16} className="text-primary" /> Completeness Scanner
          </h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Scans all generator definitions, adapter manifests, and template packs for stubs, fake handlers, missing validators, and incomplete approval gates. Rejects production readiness if any critical findings exist.
          </p>
          <button
            onClick={runScan}
            disabled={scanning}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40"
          >
            {scanning ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />} Run Completeness Scan
          </button>
        </div>

        {/* Results */}
        {results && (
          <>
            {/* Summary */}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">Targets Scanned</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{results.summary.total_targets}</p>
                <p className="text-[10px] text-muted-foreground">{results.scanned.generators} gen · {results.scanned.adapters} adapt · {results.scanned.templates} tpl</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">Critical Findings</p>
                <p className={`mt-1 text-2xl font-bold ${results.summary.critical > 0 ? 'text-destructive' : 'text-green-600'}`}>{results.summary.critical}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">Warnings</p>
                <p className={`mt-1 text-2xl font-bold ${results.summary.warnings > 0 ? 'text-amber-600' : 'text-green-600'}`}>{results.summary.warnings}</p>
              </div>
              <div className={`rounded-xl border p-4 shadow-sm ${results.summary.ready_for_production ? 'border-green-500/30 bg-green-500/5' : 'border-destructive/30 bg-destructive/5'}`}>
                <p className="text-[10px] font-bold uppercase text-muted-foreground">Production Ready</p>
                <p className={`mt-1 flex items-center gap-1 text-lg font-bold ${results.summary.ready_for_production ? 'text-green-600' : 'text-destructive'}`}>
                  {results.summary.ready_for_production ? <CheckCircle size={18} /> : <ShieldAlert size={18} />}
                  {results.summary.ready_for_production ? 'PASS' : 'BLOCKED'}
                </p>
              </div>
            </div>

            {/* Critical Findings */}
            {criticalFindings.length > 0 && (
              <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-destructive">
                  <ShieldAlert size={16} /> Critical Findings ({criticalFindings.length})
                </h3>
                <div className="space-y-2">
                  {criticalFindings.map((f, i) => (
                    <div key={i} className="rounded-lg border border-destructive/20 bg-background p-3">
                      <div className="flex items-center gap-2">
                        <XCircle size={14} className="text-destructive" />
                        <span className="font-mono text-xs font-bold text-foreground">{f.target}</span>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{f.target_type}</span>
                      </div>
                      <p className="mt-1 text-xs text-foreground">{f.message}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{f.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {warningFindings.length > 0 && (
              <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-600">
                  <AlertTriangle size={16} /> Warnings ({warningFindings.length})
                </h3>
                <div className="space-y-2">
                  {warningFindings.map((f, i) => (
                    <div key={i} className="rounded-lg border border-amber-500/20 bg-background p-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={14} className="text-amber-600" />
                        <span className="font-mono text-xs font-bold text-foreground">{f.target}</span>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{f.target_type}</span>
                      </div>
                      <p className="mt-1 text-xs text-foreground">{f.message}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{f.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Clean state */}
            {results.summary.total_findings === 0 && (
              <div className="mt-5 rounded-xl border border-green-500/30 bg-green-500/5 p-8 text-center">
                <CheckCircle size={32} className="mx-auto mb-2 text-green-600" />
                <p className="text-sm font-semibold text-green-600">All targets pass — no stubs or fake handlers detected</p>
              </div>
            )}
          </>
        )}

        {!results && !scanning && (
          <div className="mt-5 rounded-xl border border-dashed border-border p-12 text-center">
            <ShieldCheck size={32} className="mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Run a scan to audit all factory targets for stubs, fake handlers, and missing validation gates.</p>
          </div>
        )}
      </div>
    </div>
  );
}