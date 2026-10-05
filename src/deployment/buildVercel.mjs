// Emit the website and its independent API together on every repository deployment.
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const checks = spawnSync(process.execPath, ['--test', 'src/server/gatewayCredentials.test.mjs', 'src/server/chatDatabase.test.mjs'], { stdio: 'inherit' });
if (checks.status !== 0) throw new Error('Chat database or gateway authentication regression checks failed.');
const release = resolve('.standalone');
const output = resolve('.vercel/output');
const fn = resolve(output, 'functions/api/runtime.func');
const audit = JSON.parse(await readFile(resolve(release, 'dependency-audit.json'), 'utf8'));
if (audit.platformRuntimeDependencies !== 0 || audit.functions < 1) throw new Error('The independent backend release is missing or invalid.');
await rm(output, { recursive: true, force: true });
await mkdir(fn, { recursive: true });
await cp(resolve(release, 'dist'), resolve(output, 'static'), { recursive: true });
await cp(resolve(release, 'api/runtime.mjs'), resolve(fn, 'index.mjs'));
await cp(resolve(release, 'package.json'), resolve(fn, 'package.json'));
await cp(resolve(release, 'node_modules'), resolve(fn, 'node_modules'), { recursive: true });
await writeFile(resolve(fn, '.vc-config.json'), JSON.stringify({ runtime: 'nodejs22.x', handler: 'index.mjs', launcherType: 'Nodejs', maxDuration: 300 }));
const config = { version: 3, routes: [
  { src: '^/api/runtime(?:/(.*))?$', dest: '/api/runtime?route=$1' },
  { handle: 'filesystem' },
  { src: '/.*', dest: '/index.html' },
], ...(process.env.ENABLE_VERCEL_CRON === 'true' && process.env.CRON_SECRET && process.env.JOB_OWNER_ID ? { crons: [{ path: '/api/runtime/jobs/tick', schedule: '*/5 * * * *' }] } : {}) };
await writeFile(resolve(output, 'config.json'), JSON.stringify(config, null, 2));
console.log(`Vercel full-stack output ready: ${audit.functions} independent handlers and the website.`);