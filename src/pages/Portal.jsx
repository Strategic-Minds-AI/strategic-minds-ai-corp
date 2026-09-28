import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import AdminClientInvite from '@/components/portal/AdminClientInvite';
import AdminProjectForm from '@/components/portal/AdminProjectForm';
import PortalProjectDetail from '@/components/portal/PortalProjectDetail';
import SiteProvisioner from '@/components/portal/SiteProvisioner';
import ClientInfrastructure from '@/components/portal/ClientInfrastructure';
import AdminCommerce from '@/components/commerce/AdminCommerce';

export default function Portal() {
  const { user } = useAuth();
  const admin = user?.role === 'admin';
  const [projects, setProjects] = useState([]);
  const [requests, setRequests] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    try {
      const [p, r, u] = await Promise.all([
        base44.entities.ClientProject.list('-created_date', 100),
        base44.entities.ProjectRequest.list('-created_date', 500),
        admin ? base44.entities.User.list() : Promise.resolve([]),
      ]);
      setProjects(p); setRequests(r); setClients(u.filter(x => x.role === 'user')); setError('');
    } catch (e) { setError(e.message || 'Could not load your portal.'); }
    finally { setLoading(false); }
  }, [admin]);
  useEffect(() => { refresh(); }, [refresh]);
  const selected = projects.find(p => p.id === selectedId);
  return <main className="container max-w-6xl pb-24 pt-32 text-foreground">
    <div className="mb-8"><p className="agency-eyebrow">Strategic Minds AI</p><h1 className="mb-2">{admin ? 'Admin portal' : 'Client portal'}</h1><p className="text-muted-foreground">{admin ? 'Manage clients, projects and requests.' : 'Follow your projects and reach your team.'}</p></div>
    {error && <p role="alert" className="mb-6 text-destructive">{error} <button type="button" className="underline" onClick={refresh}>Retry</button></p>}
    {loading ? <p role="status">Loading your portal…</p> : <>
      {admin && <><div className="mb-8 grid gap-5 md:grid-cols-2"><AdminClientInvite onDone={refresh} /><AdminProjectForm clients={clients} onDone={refresh} /></div><AdminCommerce clients={clients} onDone={refresh} /><ClientInfrastructure clients={clients} /><SiteProvisioner clients={clients} /></>}
      <div className="grid gap-6 md:grid-cols-[minmax(200px,1fr)_minmax(0,2fr)]">
        <section aria-label="Projects"><h2 className="mb-4 text-xl">Projects</h2>{projects.length === 0 ? <p className="text-sm text-muted-foreground">{admin ? 'No projects yet. Create one above.' : 'No projects are assigned to you yet.'}</p> : <div className="space-y-2">{projects.map(project => <button key={project.id} type="button" onClick={() => setSelectedId(project.id)} className={`w-full rounded border p-4 text-left hover:border-primary ${selectedId === project.id ? 'border-primary bg-muted' : 'border-border bg-card'}`}><strong className="block">{project.title}</strong><span className="text-sm text-muted-foreground">{project.status || 'Planning'}{admin && ` · ${clients.find(c => c.id === project.client_id)?.email || 'Client'}`}</span></button>)}</div>}</section>
        <section aria-label="Project details">{selected ? <PortalProjectDetail key={selected.id} project={selected} requests={requests.filter(r => r.project_id === selected.id)} admin={admin} onDone={refresh} /> : <div className="rounded border border-border bg-card p-8 text-sm text-muted-foreground">{projects.length ? 'Select a project to see its progress and requests.' : 'Project details will appear here.'}</div>}</section>
      </div>
    </>}
  </main>;
}