import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
export async function exportOwnedSource(output, backendSource) {
  const destination = join(output, 'source');
  await mkdir(destination, { recursive: true });
  await cp('src', join(destination, 'src'), { recursive: true, filter: source => !/^src\/railway(?:\/|$)/.test(source) });
  for (const folder of ['entities', 'functions', 'shared', 'agents', 'workflows']) await cp(join(backendSource, folder), join(destination, 'backend', folder), { recursive: true });
  await cp('public', join(destination, 'public'), { recursive: true });
  for (const file of ['index.html', 'tailwind.config.js', 'postcss.config.js', 'tsconfig.json', 'tsconfig.node.json', 'jsconfig.json', 'vercel.json']) await cp(file, join(destination, file));
  await cp('src/deployment/viteStandalone.config.js', join(destination, 'vite.config.js'));
  await cp('src/deployment/standalone.env.example', join(destination, '.env.example'));
  await cp('src/deployment/STANDALONE.md', join(destination, 'README.md'));
  const original = JSON.parse(await readFile('package.json', 'utf8'));
  const keep = entries => Object.fromEntries(Object.entries(entries || {}).filter(([name]) => !name.startsWith('@base44/')));
  const esbuild = JSON.parse(await readFile('node_modules/esbuild/package.json', 'utf8'));
  const runtimePackage = JSON.parse(await readFile(join(output, 'package.json'), 'utf8'));
  const scripts = { dev: 'vite', build: 'npm run build:standalone', 'build:standalone': 'vite build --config src/deployment/viteStandalone.config.js && node src/deployment/buildStandalone.mjs', 'build:vercel': 'npm run build:standalone && npm --prefix .standalone install --omit=dev --ignore-scripts && node src/deployment/buildVercel.mjs', start: 'node .standalone/server.mjs', 'test:gateway': 'node --test src/server/gatewayCredentials.test.mjs', preview: 'vite preview --outDir .standalone/dist' };
  const manifest = { name: 'strategic-minds-ai-owned-source', private: true, version: original.version, type: 'module', engines: { node: '22.x' }, scripts, dependencies: { ...keep(original.dependencies), ...runtimePackage.dependencies }, devDependencies: { ...keep(original.devDependencies), esbuild: `^${esbuild.version}` } };
  await writeFile(join(destination, 'package.json'), JSON.stringify(manifest, null, 2));
  await writeFile(join(destination, '.gitignore'), 'node_modules/\n.standalone/\n.env\n.env.*\n!.env.example\n');
  return { directory: 'source', platformBuildDependencies: 0 };
}