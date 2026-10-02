// ============================================================
// UNIVERSAL FACTORY OS — GeneratorDefinition DSL Compiler
// Validates and compiles generator definitions into immutable RunPlans
// ============================================================

export const NODE_TYPES = [
  'transform', 'template', 'ai_generate', 'ai_evaluate', 'code_execute',
  'test', 'validate_schema', 'validate_content', 'validate_security', 'validate_visual',
  'adapter_read', 'adapter_write', 'approval', 'branch', 'fanout', 'reduce',
  'package', 'checksum', 'export',
] as const;

export const RUN_STATUSES = [
  'DRAFT', 'VALIDATING_INPUT', 'PLANNING', 'WAITING_APPROVAL', 'QUEUED',
  'RUNNING', 'VALIDATING', 'REPAIRING', 'PASSED', 'FAILED', 'BLOCKED',
  'CANCELLED', 'EXPORTED',
] as const;

export const RISK_CLASSES = ['READ', 'DRAFT', 'BRANCH_WRITE', 'PROTECTED'] as const;

export interface DAGNode {
  id: string;
  type: typeof NODE_TYPES[number];
  config: Record<string, any>;
}

export interface DAGEdge {
  from: string;
  to: string;
}

export interface DAG {
  nodes: DAGNode[];
  edges: DAGEdge[];
}

export interface GeneratorDefinition {
  id: string;
  name: string;
  version: string;
  description?: string;
  input_schema: object;
  output_contract: object;
  capabilities?: string[];
  workflow_dag: DAG;
  templates?: any[];
  adapters?: any[];
  model_policy?: object;
  validation_policy: object;
  repair_policy?: object;
  security_policy: object;
  approval_policy?: object;
  limits?: object;
  observability?: object;
  export_policy?: object;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface CompiledRunPlan {
  definition_id: string;
  definition_version: string;
  definition_sha256: string;
  nodes: DAGNode[];
  edges: DAGEdge[];
  topological_order: string[];
  has_cycles: boolean;
  approval_steps: string[];
  side_effect_steps: string[];
  estimated_steps: number;
}

// SHA-256 hash using Web Crypto API (available in browser and Deno)
export async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Validate a GeneratorDefinition against the DSL spec
export function validateDefinition(def: GeneratorDefinition): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!def.id) errors.push('Missing required field: id');
  if (!def.name) errors.push('Missing required field: name');
  if (!def.version) errors.push('Missing required field: version');
  if (!def.input_schema) errors.push('Missing required field: input_schema');
  if (!def.output_contract) errors.push('Missing required field: output_contract');
  if (!def.workflow_dag) errors.push('Missing required field: workflow_dag');
  if (!def.validation_policy) errors.push('Missing required field: validation_policy');
  if (!def.security_policy) errors.push('Missing required field: security_policy');

  // ID format validation
  if (def.id && !/^[a-z0-9][a-z0-9._-]+$/.test(def.id)) {
    errors.push('id must match pattern ^[a-z0-9][a-z0-9._-]+$');
  }

  // Version format validation
  if (def.version && !/^[0-9]+\.[0-9]+\.[0-9]+$/.test(def.version)) {
    errors.push('version must be semver (e.g. 1.0.0)');
  }

  // DAG validation
  if (def.workflow_dag) {
    const dag = def.workflow_dag;
    if (!dag.nodes || !Array.isArray(dag.nodes)) {
      errors.push('workflow_dag.nodes must be an array');
    } else {
      const nodeIds = new Set<string>();
      for (const node of dag.nodes) {
        if (!node.id) errors.push(`Node missing id`);
        if (!node.type || !NODE_TYPES.includes(node.type)) {
          errors.push(`Node ${node.id || '?'} has invalid type: ${node.type}`);
        }
        if (nodeIds.has(node.id)) errors.push(`Duplicate node id: ${node.id}`);
        nodeIds.add(node.id);
      }

      if (!dag.edges || !Array.isArray(dag.edges)) {
        errors.push('workflow_dag.edges must be an array');
      } else {
        for (const edge of dag.edges) {
          if (!edge.from || !edge.to) {
            errors.push('Edge missing from or to');
          } else {
            if (!nodeIds.has(edge.from)) errors.push(`Edge references unknown source node: ${edge.from}`);
            if (!nodeIds.has(edge.to)) errors.push(`Edge references unknown target node: ${edge.to}`);
          }
        }
      }
    }
  }

  // Warnings
  if (!def.repair_policy) warnings.push('No repair_policy specified — defaults will be used');
  if (!def.approval_policy) warnings.push('No approval_policy specified — no approvals will be required');
  if (!def.limits) warnings.push('No limits specified — defaults will be used');

  return { valid: errors.length === 0, errors, warnings };
}

// Topological sort with cycle detection (Kahn's algorithm)
export function topologicalSort(dag: DAG): { order: string[]; hasCycle: boolean } {
  const inDegree: Record<string, number> = {};
  const adjacency: Record<string, string[]> = {};

  for (const node of dag.nodes) {
    inDegree[node.id] = 0;
    adjacency[node.id] = [];
  }

  for (const edge of dag.edges) {
    adjacency[edge.from].push(edge.to);
    inDegree[edge.to] = (inDegree[edge.to] || 0) + 1;
  }

  const queue: string[] = [];
  for (const node of dag.nodes) {
    if (inDegree[node.id] === 0) queue.push(node.id);
  }

  const order: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    order.push(current);
    for (const neighbor of adjacency[current]) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) queue.push(neighbor);
    }
  }

  return { order, hasCycle: order.length !== dag.nodes.length };
}

// Compile a GeneratorDefinition into an immutable RunPlan
export async function compileRunPlan(def: GeneratorDefinition): Promise<CompiledRunPlan> {
  const validation = validateDefinition(def);
  if (!validation.valid) {
    throw new Error(`Invalid GeneratorDefinition: ${validation.errors.join('; ')}`);
  }

  const { order, hasCycle } = topologicalSort(def.workflow_dag);
  if (hasCycle) {
    throw new Error('Workflow DAG contains a cycle — cycles are forbidden');
  }

  const defJson = JSON.stringify(def);
  const defHash = await sha256(defJson);

  const approvalSteps = def.workflow_dag.nodes
    .filter((n) => n.type === 'approval')
    .map((n) => n.id);

  const sideEffectSteps = def.workflow_dag.nodes
    .filter((n) => ['adapter_write', 'code_execute', 'export'].includes(n.type))
    .map((n) => n.id);

  return {
    definition_id: def.id,
    definition_version: def.version,
    definition_sha256: defHash,
    nodes: def.workflow_dag.nodes,
    edges: def.workflow_dag.edges,
    topological_order: order,
    has_cycles: hasCycle,
    approval_steps: approvalSteps,
    side_effect_steps: sideEffectSteps,
    estimated_steps: order.length,
  };
}

// Normalize input and compute input hash
export async function normalizeInput(input: any): Promise<{ normalized: any; hash: string }> {
  const normalized = JSON.parse(JSON.stringify(input));
  // Sort object keys for deterministic hashing
  const sorted = sortObjectKeys(normalized);
  const hash = await sha256(JSON.stringify(sorted));
  return { normalized: sorted, hash };
}

function sortObjectKeys(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sortObjectKeys);
  const sorted: Record<string, any> = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = sortObjectKeys(obj[key]);
  }
  return sorted;
}

// Generate a deterministic run ID
export async function generateRunId(
  generatorId: string,
  generatorVersion: string,
  inputHash: string,
  seed: string
): Promise<string> {
  const data = `${generatorId}:${generatorVersion}:${inputHash}:${seed}`;
  const hash = await sha256(data);
  return `run_${hash.substring(0, 16)}`;
}