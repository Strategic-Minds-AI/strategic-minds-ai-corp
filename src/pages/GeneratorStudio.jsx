import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Workflow, Plus, Trash2, Play, Save, Loader2, CheckCircle, XCircle, Cpu, FileCode, Shield, Boxes, Zap } from 'lucide-react';
import { ALL_GENERATOR_TYPES, GENERATOR_CATEGORIES, buildDefaultDefinition } from '@/lib/universalFactory/registry';
import { validateDefinition, NODE_TYPES } from '@/lib/universalFactory/dsl';

export default function GeneratorStudio() {
  const navigate = useNavigate();
  const [generators, setGenerators] = useState([]);
  const [selectedGen, setSelectedGen] = useState(null);
  const [definition, setDefinition] = useState(null);
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const loadGenerators = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('factoryOS', { action: 'listGenerators' });
      setGenerators(res.data?.generators || []);
    } catch (e) { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadGenerators(); }, [loadGenerators]);

  const createFromType = (typeId) => {
    const def = buildDefaultDefinition(typeId);
    setDefinition(def);
    const result = validateDefinition(def);
    setValidation(result);
    setSelectedGen(null);
  };

  const loadGenerator = async (gen) => {
    setSelectedGen(gen.id);
    try {
      const def = JSON.parse(gen.definition_json || '{}');
      setDefinition(def);
      const result = validateDefinition(def);
      setValidation(result);
    } catch (e) {
      setError('Failed to parse definition JSON');
    }
  };

  const updateNode = (nodeId, field, value) => {
    if (!definition) return;
    const newDef = { ...definition };
    const node = newDef.workflow_dag.nodes.find((n) => n.id === nodeId);
    if (node) {
      node[field] = value;
      if (field === 'type') node.config = {};
    }
    setDefinition(newDef);
    setValidation(validateDefinition(newDef));
  };

  const addNode = () => {
    if (!definition) return;
    const newDef = { ...definition };
    const id = `node_${newDef.workflow_dag.nodes.length + 1}`;
    newDef.workflow_dag.nodes.push({ id, type: 'transform', config: {} });
    setDefinition(newDef);
    setValidation(validateDefinition(newDef));
  };

  const removeNode = (nodeId) => {
    if (!definition) return;
    const newDef = { ...definition };
    newDef.workflow_dag.nodes = newDef.workflow_dag.nodes.filter((n) => n.id !== nodeId);
    newDef.workflow_dag.edges = newDef.workflow_dag.edges.filter((e) => e.from !== nodeId && e.to !== nodeId);
    setDefinition(newDef);
    setValidation(validateDefinition(newDef));
  };

  const addEdge = (from, to) => {
    if (!definition || !from || !to) return;
    const newDef = { ...definition };
    newDef.workflow_dag.edges.push({ from, to });
    setDefinition(newDef);
    setValidation(validateDefinition(newDef));
  };

  const saveGenerator = async () => {
    if (!definition) return;
    setSaving(true);
    setError(null);
    try {
      const defJson = JSON.stringify(definition);
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(defJson));
      const sha256 = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');

      const res = await base44.functions.invoke('factoryOS', {
        action: selectedGen ? 'updateGenerator' : 'createGenerator',
        id: selectedGen,
        definition: {
          generator_key: definition.id,
          name: definition.name,
          category: definition.id.split('.')[0],
          generator_type: definition.id.split('.').slice(1).join('.'),
          description: definition.description || '',
          current_version: definition.version,
          definition_json: defJson,
          definition_sha256: sha256,
          input_schema: JSON.stringify(definition.input_schema),
          output_contract: JSON.stringify(definition.output_contract),
          capabilities: definition.capabilities || [],
          can_compose: true,
        },
      });
      setSuccess(`Generator ${selectedGen ? 'updated' : 'created'}: ${definition.id}`);
      await loadGenerators();
    } catch (e) {
      setError(e.message);
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="sticky top-0 z-10 flex min-h-16 items-center gap-3 border-b border-border bg-background px-5 py-2 pl-16">
        <button onClick={() => navigate('/factory')} className="rounded-lg p-2 text-foreground hover:bg-muted"><ArrowLeft size={20} /></button>
        <Workflow size={18} className="text-primary" />
        <span className="text-sm font-semibold text-foreground">Generator Studio</span>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left Panel — Generator List + Type Registry */}
        <div className="w-64 shrink-0 overflow-y-auto border-r border-border bg-card p-3">
          <h3 className="mb-2 text-xs font-bold uppercase text-muted-foreground">My Generators</h3>
          {generators.map((gen) => (
            <button key={gen.id} onClick={() => loadGenerator(gen)} className={`mb-1 block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted ${selectedGen === gen.id ? 'bg-primary/10 font-medium' : ''}`}>
              {gen.name}
            </button>
          ))}
          {generators.length === 0 && <p className="px-3 py-2 text-xs text-muted-foreground">No generators yet</p>}

          <h3 className="mb-2 mt-4 text-xs font-bold uppercase text-muted-foreground">Registry ({ALL_GENERATOR_TYPES.length})</h3>
          {GENERATOR_CATEGORIES.map((cat) => (
            <div key={cat} className="mb-2">
              <p className="px-3 pb-1 text-[10px] font-bold uppercase text-primary">{cat}</p>
              {ALL_GENERATOR_TYPES.filter((g) => g.category === cat).map((g) => (
                <button key={g.id} onClick={() => createFromType(g.id)} className="block w-full rounded-lg px-3 py-1.5 text-left text-xs text-foreground hover:bg-muted">
                  {g.id}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Center — DAG Canvas */}
        <div className="flex-1 overflow-y-auto p-5">
          {error && <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"><XCircle size={16} /> {error}</div>}
          {success && <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/5 px-4 py-3 text-sm text-green-600"><CheckCircle size={16} /> {success}</div>}

          {!definition ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center">
              <Workflow size={32} className="mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Select a generator from the left panel or create one from the registry to start composing.</p>
            </div>
          ) : (
            <>
              {/* Definition Header */}
              <div className="mb-4 rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <input className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground" value={definition.name} onChange={(e) => setDefinition({ ...definition, name: e.target.value })} />
                  <input className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" value={definition.version} onChange={(e) => setDefinition({ ...definition, version: e.target.value })} />
                  <button onClick={saveGenerator} disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
                  </button>
                </div>
                <textarea className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted-foreground" rows={2} placeholder="Description" value={definition.description || ''} onChange={(e) => setDefinition({ ...definition, description: e.target.value })} />
              </div>

              {/* Validation Status */}
              {validation && (
                <div className={`mb-4 rounded-xl border p-3 ${validation.valid ? 'border-green-500/30 bg-green-500/5' : 'border-destructive/30 bg-destructive/5'}`}>
                  <div className="flex items-center gap-2">
                    {validation.valid ? <CheckCircle size={16} className="text-green-600" /> : <XCircle size={16} className="text-destructive" />}
                    <span className={`text-sm font-semibold ${validation.valid ? 'text-green-600' : 'text-destructive'}`}>{validation.valid ? 'Valid' : 'Invalid'}</span>
                  </div>
                  {validation.errors.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {validation.errors.map((err, i) => <li key={i} className="text-xs text-destructive">• {err}</li>)}
                    </ul>
                  )}
                  {validation.warnings.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {validation.warnings.map((w, i) => <li key={i} className="text-xs text-amber-600">⚠ {w}</li>)}
                    </ul>
                  )}
                </div>
              )}

              {/* DAG Nodes */}
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Workflow DAG ({definition.workflow_dag?.nodes?.length || 0} nodes)</h3>
                  <button onClick={addNode} className="flex items-center gap-1 rounded-lg border border-border px-3 py-1 text-xs text-foreground hover:bg-muted"><Plus size={12} /> Add Node</button>
                </div>
                <div className="space-y-2">
                  {definition.workflow_dag?.nodes?.map((node) => (
                    <div key={node.id} className="flex items-center gap-2 rounded-lg border border-border bg-card p-3 shadow-sm">
                      <input className="w-32 rounded border border-border bg-background px-2 py-1 text-xs font-mono" value={node.id} onChange={(e) => updateNode(node.id, 'id', e.target.value)} />
                      <select className="w-40 rounded border border-border bg-background px-2 py-1 text-xs" value={node.type} onChange={(e) => updateNode(node.id, 'type', e.target.value)}>
                        {NODE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <input className="flex-1 rounded border border-border bg-background px-2 py-1 text-xs font-mono" placeholder="config JSON" value={JSON.stringify(node.config || {})} onChange={(e) => { try { updateNode(node.id, 'config', JSON.parse(e.target.value)); } catch {} }} />
                      <button onClick={() => removeNode(node.id)} className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Edges */}
              <div className="mb-4">
                <h3 className="mb-2 text-sm font-semibold text-foreground">Edges ({definition.workflow_dag?.edges?.length || 0})</h3>
                <div className="space-y-1">
                  {definition.workflow_dag?.edges?.map((edge, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-primary">{edge.from}</span>
                      →
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-primary">{edge.to}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Policies */}
              <div className="grid grid-cols-2 gap-3">
                <PolicyCard title="Validation Policy" icon={Shield} data={definition.validation_policy} />
                <PolicyCard title="Security Policy" icon={Shield} data={definition.security_policy} />
                <PolicyCard title="Model Policy" icon={Cpu} data={definition.model_policy} />
                <PolicyCard title="Approval Policy" icon={Shield} data={definition.approval_policy} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PolicyCard({ title, icon: Icon, data }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
      <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase text-muted-foreground"><Icon size={12} /> {title}</h4>
      <pre className="overflow-x-auto rounded bg-muted p-2 text-[10px] text-muted-foreground">{JSON.stringify(data || {}, null, 2)}</pre>
    </div>
  );
}