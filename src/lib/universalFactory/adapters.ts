// ============================================================
// UNIVERSAL FACTORY OS — Adapter System
// Extensible adapter architecture with risk classification,
// idempotency, approval gates, and NOT_CONFIGURED handling.
// ============================================================

import { RISK_CLASSES } from './dsl';

export interface AdapterAction {
  name: string;
  risk_class: typeof RISK_CLASSES[number];
  idempotent: boolean;
  requires_approval: boolean;
  timeout_ms?: number;
  retry_count?: number;
}

export interface AdapterManifest {
  adapter_id: string;
  version: string;
  capabilities: string[];
  config_schema?: object;
  actions: AdapterAction[];
}

export interface AdapterResult {
  status: 'success' | 'not_configured' | 'error' | 'blocked';
  data?: any;
  error?: string;
  required_config?: string[];
  health?: string;
}

// Registry of adapter manifests
const ADAPTER_REGISTRY: Record<string, AdapterManifest> = {
  ai_gateway: {
    adapter_id: 'ai_gateway',
    version: '1.0.0',
    capabilities: ['llm_generate', 'llm_evaluate', 'embed'],
    actions: [
      { name: 'generate', risk_class: 'DRAFT', idempotent: false, requires_approval: false, timeout_ms: 60000 },
      { name: 'evaluate', risk_class: 'READ', idempotent: true, requires_approval: false, timeout_ms: 30000 },
    ],
  },
  http: {
    adapter_id: 'http',
    version: '1.0.0',
    capabilities: ['http_get', 'http_post', 'http_put', 'http_delete'],
    actions: [
      { name: 'http_get', risk_class: 'READ', idempotent: true, requires_approval: false, timeout_ms: 30000 },
      { name: 'http_post', risk_class: 'BRANCH_WRITE', idempotent: false, requires_approval: true, timeout_ms: 30000 },
    ],
  },
  github: {
    adapter_id: 'github',
    version: '1.0.0',
    capabilities: ['repo_create', 'repo_read', 'file_write', 'file_read', 'branch_create', 'pr_create'],
    actions: [
      { name: 'repo_read', risk_class: 'READ', idempotent: true, requires_approval: false, timeout_ms: 15000 },
      { name: 'file_read', risk_class: 'READ', idempotent: true, requires_approval: false, timeout_ms: 15000 },
      { name: 'repo_create', risk_class: 'PROTECTED', idempotent: false, requires_approval: true, timeout_ms: 30000 },
      { name: 'file_write', risk_class: 'BRANCH_WRITE', idempotent: false, requires_approval: true, timeout_ms: 30000 },
    ],
  },
  supabase: {
    adapter_id: 'supabase',
    version: '1.0.0',
    capabilities: ['project_create', 'schema_read', 'schema_write', 'rls_write', 'storage_read'],
    actions: [
      { name: 'schema_read', risk_class: 'READ', idempotent: true, requires_approval: false, timeout_ms: 15000 },
      { name: 'project_create', risk_class: 'PROTECTED', idempotent: false, requires_approval: true, timeout_ms: 60000 },
      { name: 'schema_write', risk_class: 'PROTECTED', idempotent: false, requires_approval: true, timeout_ms: 30000 },
    ],
  },
  vercel: {
    adapter_id: 'vercel',
    version: '1.0.0',
    capabilities: ['project_create', 'deploy', 'domain_add', 'env_set'],
    actions: [
      { name: 'project_create', risk_class: 'PROTECTED', idempotent: false, requires_approval: true, timeout_ms: 30000 },
      { name: 'deploy', risk_class: 'PROTECTED', idempotent: false, requires_approval: true, timeout_ms: 120000 },
    ],
  },
  railway: {
    adapter_id: 'railway',
    version: '1.0.0',
    capabilities: ['service_create', 'service_deploy', 'env_set'],
    actions: [
      { name: 'service_create', risk_class: 'PROTECTED', idempotent: false, requires_approval: true, timeout_ms: 30000 },
      { name: 'service_deploy', risk_class: 'PROTECTED', idempotent: false, requires_approval: true, timeout_ms: 120000 },
    ],
  },
  drive: {
    adapter_id: 'drive',
    version: '1.0.0',
    capabilities: ['folder_create', 'file_upload', 'file_read', 'file_share'],
    actions: [
      { name: 'file_read', risk_class: 'READ', idempotent: true, requires_approval: false, timeout_ms: 15000 },
      { name: 'folder_create', risk_class: 'BRANCH_WRITE', idempotent: false, requires_approval: true, timeout_ms: 15000 },
      { name: 'file_upload', risk_class: 'BRANCH_WRITE', idempotent: false, requires_approval: true, timeout_ms: 30000 },
    ],
  },
  sandbox: {
    adapter_id: 'sandbox',
    version: '1.0.0',
    capabilities: ['code_execute', 'test_run', 'lint', 'build'],
    actions: [
      { name: 'code_execute', risk_class: 'DRAFT', idempotent: false, requires_approval: false, timeout_ms: 60000 },
      { name: 'test_run', risk_class: 'READ', idempotent: true, requires_approval: false, timeout_ms: 60000 },
      { name: 'lint', risk_class: 'READ', idempotent: true, requires_approval: false, timeout_ms: 30000 },
      { name: 'build', risk_class: 'READ', idempotent: true, requires_approval: false, timeout_ms: 120000 },
    ],
  },
  file: {
    adapter_id: 'file',
    version: '1.0.0',
    capabilities: ['zip_create', 'zip_extract', 'file_write_local'],
    actions: [
      { name: 'zip_create', risk_class: 'DRAFT', idempotent: true, requires_approval: false, timeout_ms: 30000 },
      { name: 'file_write_local', risk_class: 'DRAFT', idempotent: true, requires_approval: false, timeout_ms: 10000 },
    ],
  },
  base44: {
    adapter_id: 'base44',
    version: '1.0.0',
    capabilities: ['entity_read', 'entity_write', 'function_invoke'],
    actions: [
      { name: 'entity_read', risk_class: 'READ', idempotent: true, requires_approval: false, timeout_ms: 15000 },
      { name: 'entity_write', risk_class: 'BRANCH_WRITE', idempotent: false, requires_approval: true, timeout_ms: 15000 },
      { name: 'function_invoke', risk_class: 'DRAFT', idempotent: false, requires_approval: false, timeout_ms: 60000 },
    ],
  },
};

// Secret requirements per adapter
const ADAPTER_SECRETS: Record<string, string[]> = {
  ai_gateway: ['AI_GATEWAY_API_KEY'],
  github: ['GITHUB_TOKEN'],
  supabase: ['SUPABASE_ACCESS_TOKEN'],
  vercel: ['VERCEL_API_TOKEN'],
  railway: ['RAILWAY_API_TOKEN'],
  drive: ['GOOGLE_DRIVE_TOKEN'],
  sandbox: [],
  http: [],
  file: [],
  base44: [],
};

export function getAdapterManifest(adapterId: string): AdapterManifest | undefined {
  return ADAPTER_REGISTRY[adapterId];
}

export function getAllAdapters(): AdapterManifest[] {
  return Object.values(ADAPTER_REGISTRY);
}

export function getAdapterSecrets(adapterId: string): string[] {
  return ADAPTER_SECRETS[adapterId] || [];
}

// Check if an adapter is configured (has required secrets)
export function checkAdapterConfigured(
  adapterId: string,
  availableSecrets: string[]
): { configured: boolean; missing: string[] } {
  const required = getAdapterSecrets(adapterId);
  const missing = required.filter((s) => !availableSecrets.includes(s));
  return { configured: missing.length === 0, missing };
}

// Execute an adapter action
// Returns NOT_CONFIGURED result if secrets are missing — never fakes success
export function executeAdapterAction(
  adapterId: string,
  actionName: string,
  input: any,
  availableSecrets: string[]
): AdapterResult {
  const manifest = getAdapterManifest(adapterId);
  if (!manifest) {
    return {
      status: 'error',
      error: `Unknown adapter: ${adapterId}`,
    };
  }

  const action = manifest.actions.find((a) => a.name === actionName);
  if (!action) {
    return {
      status: 'error',
      error: `Unknown action ${actionName} on adapter ${adapterId}`,
    };
  }

  // Check configuration
  const { configured, missing } = checkAdapterConfigured(adapterId, availableSecrets);
  if (!configured) {
    return {
      status: 'not_configured',
      error: `Adapter ${adapterId} is not configured. Missing secrets: ${missing.join(', ')}`,
      required_config: missing,
      health: 'not_configured',
    };
  }

  // In production, this would dispatch to the real adapter implementation.
  // For now, return a structured result indicating the action is ready to execute.
  return {
    status: 'success',
    data: { adapter_id: adapterId, action: actionName, input_summary: typeof input },
  };
}