import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import ClientOrderHistory from './ClientOrderHistory';
import PortalProjectDetail from './PortalProjectDetail';
import { Users, Eye, ArrowLeft } from 'lucide-react';

export default function ClientMirror({ clients }) {
  const [clientId, setClientId] = useState('');
  const [projects, setProjects] = useState([]);
  const [requests, setRequests] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!clientId) { setProjects([]); setRequests([]); setOrders([]); return; }
    setLoading(true); setError(''); setSelectedProjectId(null);
    (async () => {
      try {
        const [projs, reqs, ords] = await Promise.all([
          base44.entities.ClientProject.filter({ client_id: clientId }, { sort: '-created_date', limit: 50 }),
          base44.entities.ProjectRequest.filter({ client_id: clientId }, { sort: '-created_date', limit: 200 }),
          base44.entities.CommerceOrder.filter({ client_id: clientId }, { sort: '-created_date', limit: 50 }),
        ]);
        setProjects(projs); setRequests(reqs); setOrders(ords);
      } catch (e) { setError(e.message || 'Could not load client data.'); }
      finally { setLoading(false); }
    })();
  }, [clientId]);

  const client = clients.find(c => c.id === clientId);
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return <div className="space-y-5">
    <div className="rounded border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-primary"><Eye size={18} /> Client Mirror — preview what your client sees</div>
      <label className="block text-sm">Select a client to preview their portal</label>
      <select value={clientId} onChange={e => setClientId(e.target.value)} className="agency-input">
        <option value="">Choose a client…</option>
        {clients.map(c => <option key={c.id} value={c.id}>{c.email || c.full_name || c.id}</option>)}
      </select>
    </div>

    {!clientId ? <div className="rounded border border-dashed border-border bg-muted p-12 text-center text-sm text-muted-foreground"><Users size={32} className="mx-auto mb-3 text-muted-foreground" />Select a client above to see exactly what they see when they log in — their projects, orders and progress updates.</div> : loading ? <p role="status" className="text-sm">Loading client portal preview…</p> : error ? <p role="alert" className="text-sm text-destructive">{error}</p> : <div className="rounded border-2 border-primary/30 bg-background p-6">
      <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
        <div>
          <p className="agency-eyebrow">Strategic Minds AI</p>
          <h2 className="text-xl">Client portal — {client?.email || 'Client'}</h2>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">Mirror view</span>
      </div>

      {orders.length > 0 && <ClientOrderHistory />}

      <div className="grid gap-6 md:grid-cols-[minmax(200px,1fr)_minmax(0,2fr)]">
        <section aria-label="Projects">
          <h3 className="mb-4 text-lg">Projects</h3>
          {projects.length === 0 ? <p className="text-sm text-muted-foreground">No projects are assigned to this client yet.</p> : <div className="space-y-2">{projects.map(project => <button key={project.id} type="button" onClick={() => setSelectedProjectId(project.id)} className={`w-full rounded border p-4 text-left hover:border-primary ${selectedProjectId === project.id ? 'border-primary bg-muted' : 'border-border bg-card'}`}><strong className="block">{project.title}</strong><span className="text-sm text-muted-foreground">{project.status || 'Planning'}</span></button>)}</div>}
        </section>
        <section aria-label="Project details">
          {selectedProject ? <PortalProjectDetail key={selectedProject.id} project={selectedProject} requests={requests.filter(r => r.project_id === selectedProject.id)} admin={false} onDone={() => {}} /> : <div className="rounded border border-border bg-card p-8 text-sm text-muted-foreground">{projects.length ? 'Select a project to see its progress and requests.' : 'Project details will appear here.'}</div>}
        </section>
      </div>
    </div>}
  </div>;
}