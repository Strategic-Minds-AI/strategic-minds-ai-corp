// ============================================================
// UNIVERSAL FACTORY OS — Registry Loader
// Loads generator types, provisioning templates, and AI consulting templates
// ============================================================

import generatorTypes from './registries/generator_types.json';
import provisioningTemplates from './registries/provisioning_templates.json';
import aiConsultingTemplates from './registries/ai_consulting_templates.json';

export const REGISTRY_VERSION = '1.0.0';

export interface GeneratorType {
  id: string;
  category: string;
  type: string;
  status: string;
  version: string;
}

export interface ProvisioningTemplate {
  id: string;
  version: string;
  mode: string;
  live_execution_requires_approval: boolean;
}

export interface AIConsultingTemplate {
  id: string;
  version: string;
  requires_evidence: boolean;
}

export const ALL_GENERATOR_TYPES: GeneratorType[] = generatorTypes.generator_types as GeneratorType[];
export const ALL_PROVISIONING_TEMPLATES: ProvisioningTemplate[] = provisioningTemplates.templates as ProvisioningTemplate[];
export const ALL_AI_CONSULTING_TEMPLATES: AIConsultingTemplate[] = aiConsultingTemplates.templates as AIConsultingTemplate[];

export const GENERATOR_CATEGORIES = ['code', 'ai', 'business', 'consulting', 'marketing', 'data', 'infra', 'design'] as const;

export function getGeneratorTypesByCategory(category: string): GeneratorType[] {
  return ALL_GENERATOR_TYPES.filter((g) => g.category === category);
}

export function getGeneratorTypeById(id: string): GeneratorType | undefined {
  return ALL_GENERATOR_TYPES.find((g) => g.id === id);
}

export function getProvisioningTemplateById(id: string): ProvisioningTemplate | undefined {
  return ALL_PROVISIONING_TEMPLATES.find((t) => t.id === id);
}

export function getAIConsultingTemplateById(id: string): AIConsultingTemplate | undefined {
  return ALL_AI_CONSULTING_TEMPLATES.find((t) => t.id === id);
}

export function countGeneratorTypes(): number {
  return ALL_GENERATOR_TYPES.length;
}

export function countProvisioningTemplates(): number {
  return ALL_PROVISIONING_TEMPLATES.length;
}

export function countAIConsultingTemplates(): number {
  return ALL_AI_CONSULTING_TEMPLATES.length;
}

// Build a default GeneratorDefinition DSL for a given generator type
export function buildDefaultDefinition(typeId: string): any {
  const genType = getGeneratorTypeById(typeId);
  if (!genType) throw new Error(`Unknown generator type: ${typeId}`);

  return {
    id: genType.id,
    name: genType.id.split('.').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
    version: genType.version,
    description: `Generator for ${genType.type}`,
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', minLength: 1 },
        description: { type: 'string' },
      },
      required: ['title'],
    },
    output_contract: {
      type: 'object',
      properties: {
        artifacts: { type: 'array' },
      },
    },
    capabilities: [genType.category],
    workflow_dag: {
      nodes: [
        { id: 'input', type: 'transform', config: { operation: 'normalize_input' } },
        { id: 'generate', type: 'template', config: { template_key: `${genType.id}.default` } },
        { id: 'validate', type: 'validate_schema', config: {} },
        { id: 'package', type: 'package', config: {} },
        { id: 'export', type: 'export', config: {} },
      ],
      edges: [
        { from: 'input', to: 'generate' },
        { from: 'generate', to: 'validate' },
        { from: 'validate', to: 'package' },
        { from: 'package', to: 'export' },
      ],
    },
    templates: [],
    adapters: [],
    model_policy: { provider: 'ai_gateway', model: 'auto', max_tokens: 4000 },
    validation_policy: { mandatory: ['schema', 'completeness'] },
    repair_policy: { max_rounds: 3, target_layer: 'smallest_component' },
    security_policy: { sandbox_required: true, secret_scan: true },
    approval_policy: { required_for: ['adapter_write', 'export'], risk_class: 'PROTECTED' },
    limits: { max_steps: 50, max_duration_ms: 300000, max_cost_cents: 100 },
    observability: { log_level: 'info', step_logs: true },
    export_policy: { format: 'zip', include_manifest: true },
  };
}