import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
const forbidden = /@base44\/(?:sdk|vite-plugin)|base44:runtime|https:\/\/(?:[\w.-]+\.)?base44\.(?:app|com)/;
async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const children = await Promise.all(entries.map(entry => entry.isDirectory() ? files(join(directory, entry.name)) : [join(directory, entry.name)]));
  return children.flat();
}
export async function auditStandalone(output, results) {
  for (const result of results) for (const file of Object.keys(result.metafile.inputs)) {
    if (file.includes('node_modules/@base44/')) throw new Error(`Platform dependency in runtime: ${file}`);
  }
  const browserFiles = (await files(join(output, 'dist'))).filter(file => /\.(?:js|css|html)$/.test(file));
  const targets = [...browserFiles, join(output, 'server.mjs'), join(output, 'api/runtime.mjs')];
  for (const file of targets) if (forbidden.test(await readFile(file, 'utf8'))) throw new Error(`Platform dependency or hosted URL in release: ${file}`);
  return { browserFilesChecked: browserFiles.length, serverFilesChecked: 2, platformRuntimeDependencies: 0, platformHostedURLs: 0 };
}