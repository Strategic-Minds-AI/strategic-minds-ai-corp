// ============================================================
// systemBuildSchemas.ts — Strict schema validation for every
// generated spec. Enforces types, enums, min lengths, and
// structural requirements.
// ============================================================

export interface StrictValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  score: number;
}

function pass(): StrictValidationResult {
  return { valid: true, errors: [], warnings: [], score: 100 };
}

function fail(errors: string[], warnings: string[] = [], score = 0): StrictValidationResult {
  return { valid: errors.length === 0, errors, warnings, score };
}

export function strictValidateArchitecture(spec: any): StrictValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!spec || typeof spec !== "object") return fail(["Architecture spec is empty or not an object"]);
  if (typeof spec.concept !== "string" || spec.concept.length < 10)
    errors.push("'concept' must be a string of at least 10 characters");
  if (typeof spec.summary !== "string" || spec.summary.length < 20)
    warnings.push("'summary' should be at least 20 characters");
  if (!spec.tech_stack || typeof spec.tech_stack !== "object")
    errors.push("'tech_stack' must be an object");
  else {
    if (typeof spec.tech_stack.frontend !== "string" || spec.tech_stack.frontend.length < 2)
      errors.push("tech_stack.frontend must be a non-empty string");
    if (typeof spec.tech_stack.backend !== "string" || spec.tech_stack.backend.length < 2)
      errors.push("tech_stack.backend must be a non-empty string");
  }
  if (!Array.isArray(spec.pages) || spec.pages.length === 0)
    errors.push("'pages' must be a non-empty array");
  else {
    spec.pages.forEach((p: any, i: number) => {
      if (typeof p.name !== "string" || !p.name.trim()) errors.push(`pages[${i}].name must be a non-empty string`);
      if (typeof p.route !== "string" || !p.route.startsWith("/")) errors.push(`pages[${i}].route must start with '/'`);
    });
  }
  if (!Array.isArray(spec.data_models) || spec.data_models.length === 0)
    warnings.push("No data_models defined — data model step will design from scratch");
  if (!Array.isArray(spec.features) || spec.features.length === 0)
    warnings.push("No features defined");
  const score = errors.length === 0 ? (warnings.length === 0 ? 100 : 85) : 0;
  return fail(errors, warnings, score);
}

export function strictValidateDataModel(spec: any): StrictValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!spec || typeof spec !== "object") return fail(["Data model spec is empty or not an object"]);
  if (!Array.isArray(spec.entities) || spec.entities.length === 0)
    errors.push("'entities' must be a non-empty array");
  else {
    const validTypes = ["string", "number", "boolean", "date", "date-time", "object", "array", "reference", "text", "integer", "float", "uuid", "email", "url", "enum"];
    spec.entities.forEach((e: any, i: number) => {
      if (typeof e.name !== "string" || !e.name.trim()) errors.push(`entities[${i}].name must be a non-empty string`);
      if (!Array.isArray(e.fields) || e.fields.length === 0) errors.push(`entities[${i}] must have at least one field`);
      else e.fields.forEach((f: any, j: number) => {
        if (typeof f.name !== "string" || !f.name.trim()) errors.push(`entities[${i}].fields[${j}].name must be non-empty`);
        if (typeof f.type !== "string" || !f.type.trim()) errors.push(`entities[${i}].fields[${j}].type must be non-empty`);
        else if (!validTypes.includes(f.type.toLowerCase()) && !f.type.includes("[]")) warnings.push(`entities[${i}].fields[${j}].type '${f.type}' is not standard`);
      });
    });
  }
  if (!Array.isArray(spec.relationships)) warnings.push("No 'relationships' array");
  if (!Array.isArray(spec.api_endpoints)) warnings.push("No 'api_endpoints' array");
  const score = errors.length === 0 ? (warnings.length === 0 ? 100 : 85) : 0;
  return fail(errors, warnings, score);
}

export function strictValidateUiSystem(spec: any): StrictValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!spec || typeof spec !== "object") return fail(["UI system spec is empty or not an object"]);
  if (!spec.color_palette || typeof spec.color_palette !== "object") errors.push("'color_palette' must be an object");
  else {
    const hexRegex = /^#[0-9a-fA-F]{3,8}$/;
    if (typeof spec.color_palette.primary !== "string" || !hexRegex.test(spec.color_palette.primary))
      errors.push("color_palette.primary must be a valid hex color");
  }
  if (!spec.typography || typeof spec.typography !== "object") warnings.push("Missing 'typography'");
  if (!Array.isArray(spec.components) || spec.components.length < 3)
    warnings.push("At least 3 components should be defined");
  if (!Array.isArray(spec.layout_patterns) || spec.layout_patterns.length === 0)
    warnings.push("No layout_patterns defined");
  const score = errors.length === 0 ? (warnings.length === 0 ? 100 : 80) : 0;
  return fail(errors, warnings, score);
}

export function strictValidateCodeManifest(spec: any): StrictValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!spec || typeof spec !== "object") return fail(["Code manifest is empty or not an object"]);
  if (typeof spec.framework !== "string" || spec.framework.trim().length < 2) errors.push("'framework' must be a non-empty string");
  if (typeof spec.repo_name !== "string" || spec.repo_name.trim().length < 2) warnings.push("'repo_name' should be specified");
  if (!Array.isArray(spec.files) || spec.files.length === 0) errors.push("'files' must be a non-empty array");
  else {
    let filesWithContent = 0;
    spec.files.forEach((f: any, i: number) => {
      if (typeof f.path !== "string" || !f.path.trim()) errors.push(`files[${i}].path must be non-empty`);
      if (f.content) filesWithContent++;
      if (!f.category) warnings.push(`files[${i}] missing 'category'`);
    });
    if (filesWithContent === 0) warnings.push("No files have content — manifest is a file tree only");
  }
  if (!Array.isArray(spec.build_steps)) warnings.push("No 'build_steps' array");
  const score = errors.length === 0 ? (warnings.length === 0 ? 100 : 80) : 0;
  return fail(errors, warnings, score);
}

export function strictValidateDeployment(spec: any): StrictValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!spec || typeof spec !== "object") return fail(["Deployment spec is empty or not an object"]);
  if (typeof spec.live_url !== "string" || !spec.live_url.trim()) errors.push("'live_url' is required");
  if (!spec.platform) warnings.push("Missing 'platform'");
  if (!spec.build_config || typeof spec.build_config !== "object") warnings.push("Missing 'build_config'");
  const score = errors.length === 0 ? (warnings.length === 0 ? 100 : 80) : 0;
  return fail(errors, warnings, score);
}