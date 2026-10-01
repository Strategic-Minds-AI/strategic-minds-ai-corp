import assert from "node:assert/strict";
import { Sandbox } from "railway";

const expectedEnvironment = process.env.RAILWAY_ENVIRONMENT_ID;
if (!process.env.RAILWAY_API_TOKEN && !process.env.RAILWAY_TOKEN) {
  throw new Error("Railway API credential is not available to this process");
}
if (!expectedEnvironment) {
  throw new Error("RAILWAY_ENVIRONMENT_ID is required");
}

const base = await Sandbox.create();
console.log(JSON.stringify({ event: "base_running", id: base.id, environmentId: expectedEnvironment }));

try {
  const probe = await base.exec("printf 'READY'");
  assert.equal(probe.exitCode, 0, probe.stderr);
  assert.equal(probe.stdout, "READY");

  const fork = await base.fork();
  console.log(JSON.stringify({ event: "fork_running", id: fork.id }));

  try {
    const result = await fork.exec("printf 'FORK_READY'");
    assert.equal(result.exitCode, 0, result.stderr);
    assert.equal(result.stdout, "FORK_READY");
    console.log(JSON.stringify({ event: "pass", baseId: base.id, forkId: fork.id }));
  } finally {
    await fork.destroy();
  }
} finally {
  await base.destroy();
}
