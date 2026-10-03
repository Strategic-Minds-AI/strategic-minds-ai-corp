// ═══════════════════════════════════════════════════════════════════
// Shared provisioning primitives — used by provisionSite + provisionSystem
// Plain module: export helpers, no Deno.serve / no default export.
// ═══════════════════════════════════════════════════════════════════
import { secrets } from './runtimeSecrets.ts';
import { viteAuthFiles, backendAuthFiles } from './provisioningAuth.ts';

export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 63);
}

export async function providerError(res: Response, provider: string) {
  const data = await res.json().catch(() => ({}));
  throw new Error(`${provider}: ${data.error?.message || data.message || data.error || `request failed (${res.status})`}`);
}

// ── Railway GraphQL ──────────────────────────────────────────────
export async function railway(query: string, variables: any) {
  const token = secrets.get('RAILWAY_API_TOKEN');
  if (!token) throw new Error('RAILWAY_API_TOKEN not configured');
  const res = await fetch('https://backboard.railway.com/graphql/v2', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Railway: ${data.errors?.[0]?.message || data.message || `request failed (${res.status})`}`);
  if (data.errors?.length) throw new Error(`Railway: ${data.errors[0].message}`);
  return data.data;
}

export function godaddyHeaders() {
  const key = secrets.get('GODADDY_API_KEY');
  const secret = secrets.get('GODADDY_API_SECRET');
  if (!key || !secret) throw new Error('GODADDY_API_KEY / GODADDY_API_SECRET not configured');
  return { Authorization: `sso-key ${key}:${secret}`, 'Content-Type': 'application/json' };
}

// ── GitHub ───────────────────────────────────────────────────────
export async function createGitHubRepo(accessToken: string, slug: string, description: string) {
  const res = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28' },
    body: JSON.stringify({ name: slug, description, private: true, auto_init: true }),
  });
  if (!res.ok) await providerError(res, 'GitHub');
  return await res.json();
}

export async function pushFilesToGitHub(accessToken: string, owner: string, repo: string, branch: string, files: Record<string, string>) {
  const headers = { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28' };
  const refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, { headers });
  if (!refRes.ok) await providerError(refRes, 'GitHub');
  const ref = await refRes.json();
  const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits/${ref.object.sha}`, { headers });
  if (!commitRes.ok) await providerError(commitRes, 'GitHub');
  const commit = await commitRes.json();
  const treeEntries = Object.entries(files).map(([path, content]) => ({ path, mode: '100644', type: 'blob', content }));
  const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, { method: 'POST', headers, body: JSON.stringify({ base_tree: commit.tree.sha, tree: treeEntries }) });
  if (!treeRes.ok) await providerError(treeRes, 'GitHub');
  const tree = await treeRes.json();
  const newCommitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, { method: 'POST', headers, body: JSON.stringify({ message: 'Initial commit — Strategic Minds AI provisioner', tree: tree.sha, parents: [ref.object.sha] }) });
  if (!newCommitRes.ok) await providerError(newCommitRes, 'GitHub');
  const newCommit = await newCommitRes.json();
  const updateRefRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, { method: 'PATCH', headers, body: JSON.stringify({ sha: newCommit.sha }) });
  if (!updateRefRes.ok) await providerError(updateRefRes, 'GitHub');
  return { commit_sha: newCommit.sha, file_count: Object.keys(files).length };
}

// ── Vercel ────────────────────────────────────────────────────────
export async function createVercelProject(slug: string, githubRepo: string) {
  const token = secrets.get('VERCEL_API_TOKEN');
  if (!token) throw new Error('VERCEL_API_TOKEN not configured');
  const res = await fetch('https://api.vercel.com/v11/projects', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: slug, gitRepository: { type: 'github', repo: githubRepo } }),
  });
  if (!res.ok) await providerError(res, 'Vercel');
  return await res.json();
}

export async function getVercelDeployments(projectId: string) {
  const token = secrets.get('VERCEL_API_TOKEN');
  const res = await fetch(`https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=1`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return [];
  const data = await res.json();
  return data.deployments || [];
}

export async function addVercelDomain(projectId: string, domain: string) {
  const token = secrets.get('VERCEL_API_TOKEN');
  const res = await fetch(`https://api.vercel.com/v9/projects/${projectId}/domains`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: domain }),
  });
  if (!res.ok) await providerError(res, 'Vercel');
  return await res.json();
}

export async function setVercelEnvVars(projectId: string, envVars: Record<string, string>) {
  const token = secrets.get('VERCEL_API_TOKEN');
  const results = [];
  for (const [key, value] of Object.entries(envVars)) {
    const res = await fetch(`https://api.vercel.com/v10/projects/${projectId}/env`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value, target: ['production', 'preview', 'development'], type: 'plain' }),
    });
    results.push({ key, ok: res.ok });
  }
  return results;
}

// ── Supabase ──────────────────────────────────────────────────────
export async function listSupabaseOrgs(accessToken: string) {
  const res = await fetch('https://api.supabase.com/v1/organizations', { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) await providerError(res, 'Supabase');
  return await res.json();
}

export async function createSupabaseProject(accessToken: string, name: string, orgId: string, region: string) {
  const dbPassword = crypto.randomUUID().replace(/-/g, '').slice(0, 16) + 'A1!';
  const res = await fetch('https://api.supabase.com/v1/projects', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30), organization_id: orgId, plan: 'free', region, db_pass: dbPassword, kps_enabled: true }),
  });
  if (!res.ok) await providerError(res, 'Supabase');
  return await res.json();
}

// ── File generators ───────────────────────────────────────────────
export function generateStaticFiles(html: string, name: string): Record<string, string> {
  const slug = slugify(name);
  return {
    'index.html': html,
    'vercel.json': JSON.stringify({ name: slug, public: true, cleanUrls: true }, null, 2),
    'README.md': `# ${name}\n\nGenerated by Strategic Minds AI.\n`,
    '.gitignore': '.vercel\nnode_modules\n',
  };
}

export function generateViteFiles(projectName: string): Record<string, string> {
  const slug = slugify(projectName);
  return {
    'index.html': `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1.0" />\n<title>${projectName}</title>\n</head>\n<body>\n<div id="root"></div>\n<script type="module" src="/src/main.jsx"></script>\n</body>\n</html>`,
    'package.json': JSON.stringify({ name: slug, private: true, version: '0.0.1', type: 'module', scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' }, dependencies: { react: '^18.2.0', 'react-dom': '^18.2.0', 'react-router-dom': '^6.26.0', '@supabase/supabase-js': '^2.45.0' }, devDependencies: { '@vitejs/plugin-react': '^4.2.0', vite: '^5.0.0', tailwindcss: '^3.4.0', postcss: '^8.4.0', autoprefixer: '^10.4.0' } }, null, 2),
    'vite.config.js': `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\n\nexport default defineConfig({\n  plugins: [react()],\n})`,
    'tailwind.config.js': `/** @type {import('tailwindcss').Config} */\nexport default {\n  content: ['./index.html', './src/**/*.{js,jsx}'],\n  theme: { extend: { colors: { primary: '#0066ff' } } },\n  plugins: [],\n}`,
    'postcss.config.js': `export default {\n  plugins: { tailwindcss: {}, autoprefixer: {} },\n}`,
    'src/main.jsx': `import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport App from './App.jsx'\nimport './index.css'\n\nReactDOM.createRoot(document.getElementById('root')).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>,\n)`,
    'src/App.jsx': `import React from 'react'\nimport { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'\nimport { AuthProvider } from './lib/AuthContext'\nimport ProtectedRoute from './components/ProtectedRoute'\nimport Login from './pages/Login'\n\nfunction Dashboard() {\n  return (\n    <div className="min-h-screen bg-gray-50 text-gray-900">\n      <header className="border-b border-gray-200 bg-white px-6 py-4">\n        <span className="text-lg font-bold text-blue-600">${projectName}</span>\n      </header>\n      <main className="mx-auto max-w-5xl px-6 py-16 text-center">\n        <h1 className="text-4xl font-bold">${projectName}</h1>\n        <p className="mt-4 text-lg text-gray-600">Provisioned by Strategic Minds AI — auth ready</p>\n      </main>\n    </div>\n  )\n}\n\nexport default function App() {\n  return (\n    <AuthProvider>\n      <Router>\n        <Routes>\n          <Route path="/login" element={<Login />} />\n          <Route element={<ProtectedRoute />}>\n            <Route path="/" element={<Dashboard />} />\n          </Route>\n          <Route path="*" element={<Navigate to="/" replace />} />\n        </Routes>\n      </Router>\n    </AuthProvider>\n  )\n}`,
    'src/index.css': `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n`,
    'README.md': `# ${projectName}\n\nProvisioned by Strategic Minds AI.\n\n## Auth\n\nThis app ships with Supabase auth wired in. Set these env vars in Vercel:\n\n- \`VITE_SUPABASE_URL\`\n- \`VITE_SUPABASE_ANON_KEY\`\n\nA \`profiles\` table with a \`role\` column (default 'user') is expected.\n`,
    '.gitignore': 'node_modules\ndist\n.env\n',
    ...viteAuthFiles(),
  };
}

export function generateBackendFiles(projectName: string): Record<string, string> {
  const slug = slugify(projectName);
  return {
    'package.json': JSON.stringify({ name: slug, private: true, version: '1.0.0', type: 'module', scripts: { start: 'node server.js', dev: 'node --watch server.js' }, dependencies: { express: '^4.19.0', cors: '^2.8.5', '@supabase/supabase-js': '^2.45.0' } }, null, 2),
    'server.js': `import express from 'express';\nimport cors from 'cors';\nimport { requireAuth, requireAdmin } from './src/lib/auth.js';\n\nconst app = express();\napp.use(cors());\napp.use(express.json());\n\n// Public routes\napp.get('/health', (req, res) => res.json({ ok: true, service: '${projectName}' }));\napp.get('/', (req, res) => res.json({ name: '${projectName}', status: 'running' }));\n\n// Protected routes — require a valid Supabase JWT\napp.get('/api/me', requireAuth, (req, res) => res.json({ user: req.user }));\napp.get('/api/admin', requireAdmin, (req, res) => res.json({ user: req.user, admin: true }));\n\nconst port = process.env.PORT || 3000;\napp.listen(port, () => console.log(\`Server running on port \${port}\`));\n`,
    'README.md': `# ${projectName} — Backend API\n\nProvisioned by Strategic Minds AI.\n\n## Auth\n\nSupabase JWT verification middleware is included. Set these env vars in Railway:\n\n- \`SUPABASE_URL\`\n- \`SUPABASE_ANON_KEY\`\n\nRoutes:\n- \`GET /health\` — public\n- \`GET /api/me\` — requires valid Supabase JWT (Bearer token)\n- \`GET /api/admin\` — requires admin role in profiles table\n\n## Deploy\nRailway auto-detects Node.js. The PORT env var is provided automatically.\n`,
    '.gitignore': 'node_modules\n.env\n',
    ...backendAuthFiles(),
  };
}

export function resolveFiles(body: any, projectName: string): Record<string, string> {
  const stackType = body.stack_type || 'static_site';
  if (body.custom_html) return generateStaticFiles(body.custom_html, projectName);
  if (stackType === 'backend_api' || stackType === 'fullstack') return generateBackendFiles(projectName);
  return generateViteFiles(projectName);
}