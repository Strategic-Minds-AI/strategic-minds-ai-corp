// ============================================================
// systemBuildValidation.ts — Spec validation for the system-build
// pipeline. Each validator checks that the LLM returned the
// minimum required fields for the spec to be usable.
// ============================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function base(): ValidationResult {
  return { valid: true, errors: [], warnings: [] };
}

export function validateArchitectureSpec(spec: any): ValidationResult {
  const r = base();
  if (!spec || typeof spec !== "object") return { valid: false, errors: ["Architecture spec is empty"], warnings: [] };
  if (!spec.concept) r.errors.push("Missing 'concept'");
  if (!spec.tech_stack || typeof spec.tech_stack !== "object") r.errors.push("Missing 'tech_stack'");
  if (!Array.isArray(spec.pages) || spec.pages.length === 0) r.errors.push("Missing or empty 'pages'");
  else spec.pages.forEach((p: any, i: number) => {
    if (!p.name) r.errors.push(`pages[${i}] missing 'name'`);
    if (!p.route) r.errors.push(`pages[${i}] missing 'route'`);
  });
  r.valid = r.errors.length === 0;
  return r;
}

export function validateDataModelSpec(spec: any): ValidationResult {
  const r = base();
  if (!spec || typeof spec !== "object") return { valid: false, errors: ["Data model spec is empty"], warnings: [] };
  if (!Array.isArray(spec.entities) || spec.entities.length === 0) r.errors.push("Missing or empty 'entities'");
  else spec.entities.forEach((e: any, i: number) => {
    if (!e.name) r.errors.push(`entities[${i}] missing 'name'`);
    if (!Array.isArray(e.fields) || e.fields.length === 0) r.errors.push(`entities[${i}] has no fields`);
  });
  r.valid = r.errors.length === 0;
  return r;
}

export function validateUiSystemSpec(spec: any): ValidationResult {
  const r = base();
  if (!spec || typeof spec !== "object") return { valid: false, errors: ["UI system spec is empty"], warnings: [] };
  if (!spec.color_palette || typeof spec.color_palette !== "object") r.errors.push("Missing 'color_palette'");
  else if (!spec.color_palette.primary) r.errors.push("color_palette.primary is required");
  r.valid = r.errors.length === 0;
  return r;
}

export function validateCodeManifestSpec(spec: any): ValidationResult {
  const r = base();
  if (!spec || typeof spec !== "object") return { valid: false, errors: ["Code manifest is empty"], warnings: [] };
  if (!spec.framework) r.warnings.push("Missing 'framework'");
  if (!Array.isArray(spec.files) || spec.files.length === 0) r.errors.push("Missing or empty 'files'");
  r.valid = r.errors.length === 0;
  return r;
}

export function validateDeploymentSpec(spec: any): ValidationResult {
  const r = base();
  if (!spec || typeof spec !== "object") return { valid: false, errors: ["Deployment spec is empty"], warnings: [] };
  if (!spec.live_url) r.errors.push("Missing 'live_url'");
  r.valid = r.errors.length === 0;
  return r;
}

export function validateDataModelConsistency(dataModel: any, architecture: any): ValidationResult {
  const r = base();
  if (!dataModel?.entities || !architecture?.data_models) return r;
  const archEntityNames = architecture.data_models.map((dm: any) => dm.name?.toLowerCase()).filter(Boolean);
  const dataModelNames = dataModel.entities.map((e: any) => e.name?.toLowerCase()).filter(Boolean);
  const missing = archEntityNames.filter((name: string) => !dataModelNames.includes(name));
  if (missing.length > 0) r.warnings.push(`Data model missing entities: ${missing.join(", ")}`);
  r.valid = r.errors.length === 0;
  return r;
}

export function validateUiSystemConsistency(uiSystem: any, architecture: any): ValidationResult {
  const r = base();
  if (!uiSystem?.components || !architecture?.pages) return r;
  const componentNames = uiSystem.components.map((c: any) => c.name?.toLowerCase() || "");
  const hasNav = componentNames.some((n: string) => n.includes("nav") || n.includes("header") || n.includes("sidebar"));
  if (!hasNav && architecture.pages.length > 1) r.warnings.push("UI system has no navigation component despite multiple pages");
  r.valid = r.errors.length === 0;
  return r;
}

export function validateCodeManifestConsistency(codeManifest: any, architecture: any): ValidationResult {
  const r = base();
  if (!codeManifest?.files || !architecture) return r;
  const filePaths = codeManifest.files.map((f: any) => f.path || "").filter(Boolean);
  const pageRoutes = (architecture.pages || []).map((p: any) => p.route || "").filter(Boolean);
  for (const route of pageRoutes) {
    const routeSlug = route.replace(/^\//, "").replace(/[^a-z0-9]/gi, "-").toLowerCase();
    const hasFile = filePaths.some((p: string) => p.toLowerCase().includes(routeSlug) || p.toLowerCase().includes(route.replace(/^\//, "").toLowerCase()));
    if (!hasFile && route !== "/") r.warnings.push(`No file found for page route '${route}'`);
  }
  r.valid = r.errors.length === 0;
  return r;
}

export function validateDeploymentConsistency(deployment: any, architecture: any): ValidationResult {
  const r = base();
  if (!deployment?.routes || !architecture?.pages) return r;
  const deployRoutes = deployment.routes.map((r: any) => r.path || r.route || "").filter(Boolean);
  const pageRoutes = architecture.pages.map((p: any) => p.route || "").filter(Boolean);
  for (const route of pageRoutes) {
    if (!deployRoutes.includes(route)) r.warnings.push(`Deployment routes missing page: ${route}`);
  }
  r.valid = r.errors.length === 0;
  return r;
}