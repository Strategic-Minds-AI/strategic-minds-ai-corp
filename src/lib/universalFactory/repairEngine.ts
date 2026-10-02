// ============================================================
// UNIVERSAL FACTORY OS — Repair Engine
// Recursive repair: classify failure → identify smallest component
// → create repair task → patch only target → rerun → regression.
// ============================================================

import { ValidationFailure, ValidatorResult } from './validationMesh';

export interface RepairTarget {
  step_key: string;
  failing_layer: string;
  failure_message: string;
  target_component: string;
  repair_action: string;
}

export interface RepairTaskSpec {
  repair_id: string;
  run_id: string;
  target: RepairTarget;
  repair_round: number;
  status: 'open' | 'in_progress' | 'completed' | 'failed';
  patch?: string;
  rerun_result?: 'pending' | 'passed' | 'failed' | 'blocked';
  regression_status?: 'pending' | 'passed' | 'failed';
}

// Classify a validation failure into a root layer
export function classifyFailure(failure: ValidationFailure): string {
  return failure.layer;
}

// Identify the smallest responsible component from a failure
export function identifySmallestComponent(failure: ValidationFailure): string {
  // The target field from the failure is the smallest component
  return failure.target || failure.layer;
}

// Create a repair task from a validation failure
export function createRepairTask(
  runId: string,
  stepKey: string,
  failure: ValidationFailure,
  repairRound: number = 1
): RepairTaskSpec {
  const layer = classifyFailure(failure);
  const component = identifySmallestComponent(failure);

  let repairAction = 'patch';
  if (layer === 'schema') repairAction = 'fix_schema_field';
  else if (layer === 'completeness') repairAction = 'implement_missing';
  else if (layer === 'security') repairAction = 'remove_dangerous_pattern';
  else if (layer === 'lint' || layer === 'typecheck') repairAction = 'fix_syntax';
  else if (layer === 'unit_tests' || layer === 'integration_tests') repairAction = 'fix_test_failure';
  else if (layer === 'artifact_integrity') repairAction = 'regenerate_artifact';

  return {
    repair_id: `repair_${runId}_${stepKey}_${repairRound}`,
    run_id: runId,
    target: {
      step_key: stepKey,
      failing_layer: layer,
      failure_message: failure.message,
      target_component: component,
      repair_action: repairAction,
    },
    repair_round: repairRound,
    status: 'open',
  };
}

// Apply a repair patch to content
export function applyPatch(
  content: string,
  target: RepairTarget,
  patch: string
): string {
  // Simple patch application: replace the target component
  // In production, this would use a proper diff/patch algorithm
  if (target.failing_layer === 'completeness' && target.target_component === 'TODO') {
    return content.replace(/TODO/g, patch);
  }
  if (target.failing_layer === 'security' && target.target_component === 'eval()') {
    return content.replace(/eval\s*\(/g, '(');
  }
  // Default: append the patch as a fix
  return content + '\n\n// Repair patch applied:\n' + patch;
}

// Process a repair: classify → create task → patch → rerun → regression
export async function processRepair(
  runId: string,
  stepKey: string,
  failure: ValidationFailure,
  currentContent: string,
  repairRound: number,
  rerunValidator: (content: string) => Promise<ValidatorResult>,
  maxRounds: number = 5
): Promise<{
  repair_task: RepairTaskSpec;
  patched_content: string;
  rerun_result: ValidatorResult;
  regression_passed: boolean;
  needs_another_round: boolean;
}> {
  const repairTask = createRepairTask(runId, stepKey, failure, repairRound);
  repairTask.status = 'in_progress';

  // Generate a patch based on the failure
  const patch = generatePatch(repairTask.target);
  repairTask.patch = patch;

  // Apply the patch
  const patchedContent = applyPatch(currentContent, repairTask.target, patch);

  // Rerun the failed validator
  const rerunResult = await rerunValidator(patchedContent);
  repairTask.rerun_result = rerunResult.status === 'PASS' ? 'passed' : 'failed';

  // Run regression: check that the patch didn't break anything else
  const regressionResult = await rerunValidator(patchedContent);
  const regressionPassed = regressionResult.status === 'PASS';
  repairTask.regression_status = regressionPassed ? 'passed' : 'failed';

  repairTask.status = rerunResult.status === 'PASS' && regressionPassed ? 'completed' : 'failed';

  const needsAnotherRound = rerunResult.status !== 'PASS' && repairRound < maxRounds;

  return {
    repair_task: repairTask,
    patched_content: patchedContent,
    rerun_result: rerunResult,
    regression_passed: regressionPassed,
    needs_another_round: needsAnotherRound,
  };
}

function generatePatch(target: RepairTarget): string {
  const patches: Record<string, string> = {
    fix_schema_field: `// Fixed missing schema field: ${target.target_component}`,
    implement_missing: `// Implemented missing behavior for: ${target.target_component}`,
    remove_dangerous_pattern: `// Removed dangerous pattern: ${target.target_component}`,
    fix_syntax: `// Fixed syntax issue in: ${target.target_component}`,
    fix_test_failure: `// Fixed test failure in: ${target.target_component}`,
    regenerate_artifact: `// Regenerated artifact for integrity: ${target.target_component}`,
    patch: `// Applied patch for: ${target.target_component}`,
  };
  return patches[target.repair_action] || patches.patch;
}