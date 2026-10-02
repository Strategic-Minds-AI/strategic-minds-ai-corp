// ============================================================
// UNIVERSAL FACTORY OS — Template Engine
// Renders text/code/document/prompt templates with variables,
// conditions, loops, and partials. No secrets in templates.
// ============================================================

export const TEMPLATE_MODES = [
  'text', 'file_tree', 'code', 'prompt', 'document', 'config',
  'sql', 'ui_recipe', 'workflow_recipe', 'provisioning_recipe', 'compound',
] as const;

export interface TemplateFile {
  path: string;
  content: string;
  media_type?: string;
}

export interface TemplatePack {
  id: string;
  version: string;
  mode: typeof TEMPLATE_MODES[number];
  variables_schema?: object;
  files: TemplateFile[];
  dependencies?: string[];
}

// Simple mustache-style template renderer: {{variable}}, {{#if condition}}...{{/if}}, {{#each items}}...{{/each}}
export function renderTemplate(template: string, variables: Record<string, any>): string {
  let result = template;

  // Process conditionals: {{#if condition}}...{{/if}}
  result = result.replace(/\{\{#if\s+(\w+(?:\.\w+)*)\s*\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, condition, body) => {
    const value = getNestedValue(variables, condition);
    return value ? body : '';
  });

  // Process negated conditionals: {{#unless condition}}...{{/unless}}
  result = result.replace(/\{\{#unless\s+(\w+(?:\.\w+)*)\s*\}\}([\s\S]*?)\{\{\/unless\}\}/g, (_, condition, body) => {
    const value = getNestedValue(variables, condition);
    return !value ? body : '';
  });

  // Process loops: {{#each items}}...{{/each}}
  result = result.replace(/\{\{#each\s+(\w+(?:\.\w+)*)\s*\}\}([\s\S]*?)\{\{\/each\}\}/g, (_, arrayPath, body) => {
    const array = getNestedValue(variables, arrayPath);
    if (!Array.isArray(array)) return '';
    return array.map((item, index) => {
      const itemVars = { ...variables, this: item, index };
      return renderTemplate(body, itemVars);
    }).join('');
  });

  // Replace simple variables: {{variable.path}}
  result = result.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, path) => {
    const value = getNestedValue(variables, path);
    return value !== undefined && value !== null ? String(value) : '';
  });

  return result;
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    if (current === null || current === undefined) return undefined;
    return current[key];
  }, obj);
}

// Render a full TemplatePack
export function renderTemplatePack(pack: TemplatePack, variables: Record<string, any>): TemplateFile[] {
  return pack.files.map((file) => ({
    path: renderTemplate(file.path, variables),
    content: renderTemplate(file.content, variables),
    media_type: file.media_type || 'text/plain',
  }));
}

// Validate template variables against schema
export function validateTemplateVariables(
  variables: Record<string, any>,
  schema: object | undefined
): { valid: boolean; errors: string[] } {
  if (!schema) return { valid: true, errors: [] };

  const errors: string[] = [];
  const s = schema as any;

  if (s.type === 'object' && s.properties) {
    for (const [key, prop] of Object.entries(s.properties)) {
      const required = s.required?.includes(key);
      const value = variables[key];

      if (required && (value === undefined || value === null)) {
        errors.push(`Missing required variable: ${key}`);
      }
      if (value !== undefined && prop && typeof prop === 'object') {
        const expectedType = (prop as any).type;
        if (expectedType === 'string' && typeof value !== 'string') {
          errors.push(`${key} must be a string`);
        } else if (expectedType === 'number' && typeof value !== 'number') {
          errors.push(`${key} must be a number`);
        } else if (expectedType === 'boolean' && typeof value !== 'boolean') {
          errors.push(`${key} must be a boolean`);
        } else if (expectedType === 'array' && !Array.isArray(value)) {
          errors.push(`${key} must be an array`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// Build a simple text template pack
export function buildTextTemplatePack(
  id: string,
  template: string,
  variablesSchema?: object
): TemplatePack {
  return {
    id,
    version: '1.0.0',
    mode: 'text',
    variables_schema: variablesSchema,
    files: [{ path: 'output.txt', content: template, media_type: 'text/plain' }],
  };
}

// Build a code template pack
export function buildCodeTemplatePack(
  id: string,
  files: TemplateFile[],
  variablesSchema?: object
): TemplatePack {
  return {
    id,
    version: '1.0.0',
    mode: 'code',
    variables_schema: variablesSchema,
    files,
  };
}