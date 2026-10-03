// ═══════════════════════════════════════════════════════════════════
// Generator Deployment Bridge
// Connects executeGenerator outputs → Sandbox testing → Production provisioning
// Plain module: export helpers, no Deno.serve / no default export.
// ═══════════════════════════════════════════════════════════════════



// ── Types ────────────────────────────────────────────────────────
export interface GeneratorArtifact {
  name: string;
  path: string;
  content?: string;
  sha256?: string;
  media_type?: string;
}

export interface GeneratorRunResult {
  status: "passed" | "failed";
  generator_id: string;
  run_id: string | null;
  output: Record<string, any>;
  artifacts: GeneratorArtifact[];
}

// ── Sandbox deployment ────────────────────────────────────────────
// Creates an AgentTask that a Railway sandbox worker picks up to test
// the generated artifacts in an isolated environment.

export async function deployToSandbox(
  base44: any,
  run: GeneratorRunResult,
  options: {
    sandbox_id?: string;
    test_command?: string;
    description?: string;
  } = {}
): Promise<{ task_id: string; status: string }> {
  const svc = base44.asServiceRole;

  // Find an available sandbox if none specified
  let sandboxId = options.sandbox_id;
  if (!sandboxId) {
    const sandboxes = await svc.entities.Sandbox.filter(
      { status: "active", health_status: "healthy" },
      { sort: "-created_date", limit: 1 }
    );
    sandboxId = sandboxes.items?.[0]?.id;
    if (!sandboxId) throw new Error("No healthy sandbox available for deployment");
  }

  // Build the file tree from artifacts
  const fileTree: Record<string, string> = {};
  for (const art of run.artifacts) {
    if (art.content) fileTree[art.path || art.name] = art.content;
  }

  const task = await svc.entities.AgentTask.create({
    sandbox_id: sandboxId,
    task_type: "generator_deploy",
    status: "pending",
    description: options.description || `Generator ${run.generator_id} deployment test`,
    payload: JSON.stringify({
      generator_id: run.generator_id,
      run_id: run.run_id,
      files: fileTree,
      test_command: options.test_command || "npm install && npm run build",
      output: run.output,
    }),
    priority: 5,
    created_at: new Date().toISOString(),
  });

  return { task_id: task.id, status: "pending" };
}

// ── Production provisioning ────────────────────────────────────────
// Takes generator artifacts and provisions them to Vercel/Railway/Supabase
// by creating a ProvisioningPlan and invoking the provisionSystem flow.

export async function provisionGeneratorOutput(
  base44: any,
  run: GeneratorRunResult,
  options: {
    project_name: string;
    stack_type?: "static_site" | "vite_app" | "fullstack" | "backend_api";
    domain?: string;
    env_vars?: Record<string, string>;
    client_id?: string;
  }
): Promise<{ plan_id: string; status: string }> {
  const svc = base44.asServiceRole;

  // Build file manifest from artifacts
  const files: Record<string, string> = {};
  for (const art of run.artifacts) {
    if (art.content) files[art.path || art.name] = art.content;
  }

  // Create a provisioning plan
  const plan = await svc.entities.ProvisioningPlan.create({
    name: options.project_name,
    stack_type: options.stack_type || "vite_app",
    status: "pending",
    files_json: JSON.stringify(Object.keys(files)),
    domain: options.domain || null,
    env_vars: options.env_vars ? JSON.stringify(options.env_vars) : null,
    client_id: options.client_id || null,
    source: "generator",
    generator_id: run.generator_id,
    generator_run_id: run.run_id,
    created_at: new Date().toISOString(),
  });

  return { plan_id: plan.id, status: "pending" };
}

// ── Artifact file tree builder ─────────────────────────────────────
// Converts a flat artifact list into a nested file tree structure
// suitable for rendering in the UI or passing to deployment systems.

export function buildFileTree(artifacts: GeneratorArtifact[]): Record<string, any> {
  const tree: Record<string, any> = {};
  for (const art of artifacts) {
    const parts = (art.path || art.name).split("/");
    let node = tree;
    for (let i = 0; i < parts.length - 1; i++) {
      const dir = parts[i];
      if (!node[dir]) node[dir] = {};
      node = node[dir];
    }
    node[parts[parts.length - 1]] = {
      content: art.content || "",
      sha256: art.sha256,
      media_type: art.media_type,
    };
  }
  return tree;
}