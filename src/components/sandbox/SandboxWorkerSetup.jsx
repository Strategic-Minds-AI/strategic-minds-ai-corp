import { useState } from 'react';
import { Terminal, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { API_BASE } from '@/lib/runtimeTransport';

export default function SandboxWorkerSetup({ sandbox }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!sandbox) return null;

  const workerCode = `// railwayWorker.js — deploy this to your Railway service
// Set environment variables:
//   SANDBOX_API_KEY = <your sk_sbx_... key>
//   API_URL = ${new URL(API_BASE, window.location.origin).href.replace(/\/$/, '')}
//   POLL_INTERVAL = 60000
//   MAX_CYCLES = 0  (0 = infinite)
//
// Start command: node railwayWorker.js

const SANDBOX_API_KEY = process.env.SANDBOX_API_KEY;
const APP_URL = (process.env.API_URL || process.env.APP_URL || '').replace(/\\/$/, '');
if (!APP_URL) throw new Error('NOT_CONFIGURED: API_URL');
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || '60000', 10);
const AUTH = \`\${APP_URL}/functions/sandboxAuth\`;

if (!SANDBOX_API_KEY?.startsWith('sk_sbx_')) { console.error('SANDBOX_API_KEY missing'); process.exit(1); }

let cycles = 0;
async function run() {
  cycles++;
  try {
    // Heartbeat
    await fetch(AUTH, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${SANDBOX_API_KEY}\` }, body: JSON.stringify({ action: 'heartbeat' }) });
    // Poll + execute
    const poll = await (await fetch(AUTH, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${SANDBOX_API_KEY}\` }, body: JSON.stringify({ action: 'poll' }) })).json();
    for (const t of (poll.tasks || [])) {
      await fetch(AUTH, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${SANDBOX_API_KEY}\` }, body: JSON.stringify({ action: 'execute', task_id: t.id, claim_token: t.claim_token }) });
    }
  } catch (e) { console.error('cycle', cycles, e.message); }
}
run();
setInterval(run, POLL_INTERVAL);
setInterval(() => {}, 1 << 30);`;

  const fullScript = `// Full worker script: base44/shared/sandbox/railwayWorker.js in the app repo`;

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <button onClick={() => setExpanded(!expanded)} className="flex w-full items-center gap-2 text-sm font-semibold text-foreground">
        <Terminal size={15} className="text-primary" />
        Worker Setup Instructions
        {expanded ? <ChevronUp size={15} className="ml-auto text-muted-foreground"/> : <ChevronDown size={15} className="ml-auto text-muted-foreground"/>}
      </button>

      {expanded && (
        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
            <p className="mb-2 font-semibold text-foreground">Railway Environment Variables for {sandbox.name}:</p>
            <ul className="space-y-1">
              <li><code className="text-foreground">SANDBOX_API_KEY</code> = <span className="text-primary">your sk_sbx_... key (from sandbox creation)</span></li>
              <li><code className="text-foreground">API_URL</code> = <code className="text-foreground">{new URL(API_BASE, window.location.origin).href.replace(/\/$/, '')}</code></li>
              <li><code className="text-foreground">POLL_INTERVAL</code> = <code className="text-foreground">60000</code> (60 seconds)</li>
              <li><code className="text-foreground">MAX_CYCLES</code> = <code className="text-foreground">0</code> (infinite)</li>
            </ul>
          </div>

          <div className="rounded-lg border border-border bg-background p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground">Minimal worker script (copy to Railway):</span>
              <button onClick={() => { navigator.clipboard.writeText(workerCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="rounded p-1 text-muted-foreground hover:text-foreground">
                {copied ? <Check size={12} className="text-green-600"/> : <Copy size={12}/>}
              </button>
            </div>
            <pre className="max-h-48 overflow-auto text-[10px] leading-relaxed text-foreground"><code>{workerCode}</code></pre>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Full worker script with error handling and graceful shutdown is at <code className="text-foreground">base44/shared/sandbox/railwayWorker.js</code> in the app repo. Deploy it to Railway as the service source or paste the minimal version above into Railway's inline editor.
          </p>
        </div>
      )}
    </div>
  );
}