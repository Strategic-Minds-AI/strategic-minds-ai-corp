// ============================================================
// UNIVERSAL FACTORY OS — Validation Mesh
// Independent validators that produce PASS/FAIL/BLOCKED receipts.
// No implementer self-certifies release readiness.
// ============================================================

export type ValidationStatus = 'PASS' | 'FAIL' | 'BLOCKED';

export interface ValidationEvidence {
  check: string;
  result: string;
  detail: string;
}

export interface ValidationFailure {
  layer: string;
  message: string;
  target: string;
  severity: 'error' | 'warning';
}

export interface ValidatorResult {
  validator_id: string;
  status: ValidationStatus;
  evidence: ValidationEvidence[];
  failures: ValidationFailure[];
  subject_hash: string;
}

export const MANDATORY_VALIDATORS = [
  'schema',
  'completeness',
  'lint',
  'typecheck',
  'security_scan',
  'artifact_integrity',
] as const;

export const ALL_VALIDATORS = [
  ...MANDATORY_VALIDATORS,
  'compile', 'unit_tests', 'integration_tests', 'e2e',
  'visual_regression', 'accessibility', 'dependency_scan',
  'secret_scan', 'data_integrity', 'rls', 'backend_parity',
  'acceptance_criteria',
] as const;

// Schema validator — validates JSON against a JSON Schema
export function validateSchema(subject: any, schema: object): ValidatorResult {
  const evidence: ValidationEvidence[] = [];
  const failures: ValidationFailure[] = [];

  const s = schema as any;
  if (s.type === 'object' && s.required) {
    for (const field of s.required) {
      if (subject[field] === undefined || subject[field] === null) {
        failures.push({
          layer: 'schema',
          message: `Missing required field: ${field}`,
          target: field,
          severity: 'error',
        });
      } else {
        evidence.push({ check: `required:${field}`, result: 'present', detail: `Field ${field} is present` });
      }
    }
  }

  if (s.properties) {
    for (const [key, prop] of Object.entries(s.properties)) {
      if (subject[key] !== undefined) {
        const expectedType = (prop as any).type;
        if (expectedType && typeof subject[key] !== expectedType) {
          failures.push({
            layer: 'schema',
            message: `Field ${key} has wrong type: expected ${expectedType}, got ${typeof subject[key]}`,
            target: key,
            severity: 'error',
          });
        }
      }
    }
  }

  return {
    validator_id: 'schema',
    status: failures.length === 0 ? 'PASS' : 'FAIL',
    evidence,
    failures,
    subject_hash: '',
  };
}

// Completeness validator — checks for stubs, TODOs, empty handlers
export function validateCompleteness(content: string): ValidatorResult {
  const evidence: ValidationEvidence[] = [];
  const failures: ValidationFailure[] = [];

  const stubPatterns = [
    { pattern: /TODO/g, label: 'TODO' },
    { pattern: /FIXME/g, label: 'FIXME' },
    { pattern: /HACK/g, label: 'HACK' },
    { pattern: /NotImplemented/g, label: 'NotImplemented' },
    { pattern: /throw new Error\(['"]not implemented['"]\)/gi, label: 'not implemented error' },
    { pattern: /\/\/\s*placeholder/gi, label: 'placeholder comment' },
  ];

  for (const { pattern, label } of stubPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      failures.push({
        layer: 'completeness',
        message: `Found ${matches.length} occurrence(s) of ${label}`,
        target: label,
        severity: 'error',
      });
    } else {
      evidence.push({ check: `no_${label}`, result: 'clean', detail: `No ${label} found` });
    }
  }

  // Check for empty function bodies
  const emptyFunctionPattern = /function\s+\w+\s*\([^)]*\)\s*\{\s*\}/g;
  const emptyMatches = content.match(emptyFunctionPattern);
  if (emptyMatches) {
    failures.push({
      layer: 'completeness',
      message: `Found ${emptyMatches.length} empty function body(ies)`,
      target: 'empty_functions',
      severity: 'error',
    });
  }

  return {
    validator_id: 'completeness',
    status: failures.length === 0 ? 'PASS' : 'FAIL',
    evidence,
    failures,
    subject_hash: '',
  };
}

// Security scan — checks for dangerous patterns
export function validateSecurity(content: string): ValidatorResult {
  const evidence: ValidationEvidence[] = [];
  const failures: ValidationFailure[] = [];

  const dangerousPatterns = [
    { pattern: /eval\s*\(/g, label: 'eval()' },
    { pattern: /innerHTML\s*=/g, label: 'innerHTML assignment' },
    { pattern: /document\.write/g, label: 'document.write()' },
    { pattern: /exec\s*\(/g, label: 'exec()' },
    { pattern: /child_process/g, label: 'child_process' },
  ];

  for (const { pattern, label } of dangerousPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      failures.push({
        layer: 'security',
        message: `Found ${matches.length} occurrence(s) of dangerous pattern: ${label}`,
        target: label,
        severity: 'error',
      });
    } else {
      evidence.push({ check: `no_${label}`, result: 'clean', detail: `No ${label} found` });
    }
  }

  // Check for secret patterns
  const secretPatterns = [
    { pattern: /(?:sk|pk)_(?:live|test)_[a-zA-Z0-9]{20,}/g, label: 'Stripe-like secret key' },
    { pattern: /ghp_[a-zA-Z0-9]{36}/g, label: 'GitHub PAT' },
    { pattern: /AKIA[A-Z0-9]{16}/g, label: 'AWS access key' },
  ];

  for (const { pattern, label } of secretPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      failures.push({
        layer: 'security',
        message: `Found potential secret: ${label}`,
        target: label,
        severity: 'error',
      });
    }
  }

  return {
    validator_id: 'security_scan',
    status: failures.length === 0 ? 'PASS' : 'FAIL',
    evidence,
    failures,
    subject_hash: '',
  };
}

// Artifact integrity validator — checks SHA-256 checksums
export function validateArtifactIntegrity(
  expectedHash: string,
  actualContent: string,
  computeSha256: (data: string) => Promise<string>
): Promise<ValidatorResult> {
  return computeSha256(actualContent).then((actualHash) => {
    const evidence: ValidationEvidence[] = [];
    const failures: ValidationFailure[] = [];

    if (expectedHash === actualHash) {
      evidence.push({ check: 'sha256_match', result: 'match', detail: 'SHA-256 hash matches expected value' });
    } else {
      failures.push({
        layer: 'artifact_integrity',
        message: `SHA-256 mismatch: expected ${expectedHash}, got ${actualHash}`,
        target: 'sha256',
        severity: 'error',
      });
    }

    return {
      validator_id: 'artifact_integrity',
      status: failures.length === 0 ? 'PASS' : 'FAIL',
      evidence,
      failures,
      subject_hash: actualHash,
    };
  });
}

// Run all mandatory validators on a run output
export function runMandatoryValidators(
  runOutput: any,
  artifacts: Array<{ name: string; content: string; sha256: string }>,
  computeSha256: (data: string) => Promise<string>
): Promise<ValidatorResult[]> {
  const results: ValidatorResult[] = [];

  // Schema validation
  results.push(validateSchema(runOutput, { type: 'object', required: ['artifacts'] }));

  // Completeness on all artifact contents
  const allContent = artifacts.map((a) => a.content).join('\n');
  results.push(validateCompleteness(allContent));

  // Security scan
  results.push(validateSecurity(allContent));

  // Artifact integrity
  const integrityPromises = artifacts.map((a) =>
    validateArtifactIntegrity(a.sha256, a.content, computeSha256)
  );

  return Promise.all(integrityPromises).then((integrityResults) => {
    results.push(...integrityResults);
    return results;
  });
}

// Check if all mandatory validators passed
export function allMandatoryPassed(results: ValidatorResult[]): boolean {
  return results
    .filter((r) => MANDATORY_VALIDATORS.includes(r.validator_id as any))
    .every((r) => r.status === 'PASS');
}