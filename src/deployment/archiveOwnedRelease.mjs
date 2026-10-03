import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join } from 'node:path';
const run = promisify(execFile);
export async function archiveOwnedRelease(output) {
  const name = 'strategic-minds-independent.tar.gz';
  await run('tar', ['-czf', join(output, name), '-C', output, 'dist', 'api', 'workers', 'source', 'server.mjs', 'package.json', 'schema.sql', 'vercel.json', '.env.example', 'README.md', 'dependency-audit.json']);
  return name;
}