import { useState } from 'react';
import VaultCopy from '@/components/portal/vault/VaultCopy';
const pools = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789', '!@#$%*-_=+'];
function randomIndex(size) { const limit = Math.floor(256 / size) * size; let byte; do { byte = crypto.getRandomValues(new Uint8Array(1))[0]; } while (byte >= limit); return byte % size; }
function password() {
  const all = pools.join(''); const chars = pools.map(pool => pool[randomIndex(pool.length)]);
  while (chars.length < 24) chars.push(all[randomIndex(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) { const j = randomIndex(i + 1); [chars[i], chars[j]] = [chars[j], chars[i]]; }
  return chars.join('');
}
export default function VaultGenerators() {
  const [client, setClient] = useState(''); const [system, setSystem] = useState('');
  const [generated, setGenerated] = useState(null); const [reveal, setReveal] = useState(false);
  function generate(event) {
    event.preventDefault(); const suffix = Array.from(crypto.getRandomValues(new Uint8Array(3)), byte => byte.toString(16).padStart(2, '0')).join('');
    const slug = [client, system].join('-').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'client-system';
    setGenerated({ name: `${client.trim() || 'Client'} · ${system.trim() || 'System'}`, username: `${slug}-${suffix}`, password: password() }); setReveal(false);
  }
  return <section className="space-y-5"><h2 className="mb-0 text-xl">Client names & temporary passwords</h2><p className="text-sm text-muted-foreground">Generated values stay only on this screen—not in chat or saved records. Set first-login password change or expiry in the client’s actual system; generating a password does not create an account or expire it.</p><form onSubmit={generate} className="grid gap-4 sm:grid-cols-2"><label className="text-sm">Client name<input value={client} maxLength={80} onChange={e => setClient(e.target.value)} className="agency-input"/></label><label className="text-sm">System name<input value={system} maxLength={80} onChange={e => setSystem(e.target.value)} className="agency-input"/></label><button className="agency-button sm:col-span-2" type="submit">Generate names & password</button></form>
    {generated && <div className="space-y-4 rounded-lg border border-border bg-muted p-5"><p className="mb-0 text-sm text-foreground">{generated.name}</p><label className="block text-xs">Suggested account or project name<input readOnly value={generated.username} className="agency-input font-mono"/></label><VaultCopy value={generated.username} label="Copy name"/><label className="block text-xs">24-character password<input type={reveal ? 'text' : 'password'} readOnly autoComplete="off" value={generated.password} className="agency-input font-mono"/></label><div className="flex flex-wrap items-center gap-3"><button type="button" aria-pressed={reveal} onClick={() => setReveal(!reveal)} className="text-xs text-primary underline">{reveal ? 'Hide' : 'Reveal'}</button><VaultCopy value={generated.password} label="Copy password"/><button type="button" onClick={() => setGenerated(null)} className="text-xs text-destructive underline">Clear</button></div></div>}
  </section>;
}