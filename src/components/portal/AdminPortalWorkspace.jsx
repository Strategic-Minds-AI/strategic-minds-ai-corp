import { useState } from 'react';
import AdminClientInvite from './AdminClientInvite';
import AdminProjectForm from './AdminProjectForm';
import PortalProjectDetail from './PortalProjectDetail';
import SiteProvisioner from './SiteProvisioner';
import ClientInfrastructure from './ClientInfrastructure';
import AdminCommerce from '@/components/commerce/AdminCommerce';
import CrmPanel from './CrmPanel';
import AdminPortalMenu from './AdminPortalMenu';
import AdminAssistant from './AdminAssistant';
import ChatGPTConnection from './ChatGPTConnection';

export default function AdminPortalWorkspace({ projects, requests, clients, selectedId, onSelectProject, onRefresh }) {
  const [active, setActive] = useState('chatgpt');
  const selected = projects.find(p => p.id === selectedId);
  return <div className={`grid items-start gap-6 ${active === 'chatgpt' ? 'lg:grid-cols-[220px_minmax(0,1fr)]' : 'lg:grid-cols-[190px_minmax(0,1fr)_280px] xl:grid-cols-[220px_minmax(0,1fr)_320px]'}`}>
    <div className="lg:sticky lg:top-28"><AdminPortalMenu active={active} onSelect={setActive} /></div>
    <div className="min-w-0">
      {active === 'chatgpt' && <ChatGPTConnection />}
      {active === 'crm' && <CrmPanel />}
      {active === 'clients' && <div className="grid gap-5"><AdminClientInvite onDone={onRefresh} /><AdminProjectForm clients={clients} onDone={onRefresh} /></div>}
      {active === 'commerce' && <AdminCommerce clients={clients} onDone={onRefresh} />}
      {active === 'infrastructure' && <ClientInfrastructure clients={clients} />}
      {active === 'provisioning' && <SiteProvisioner clients={clients} />}
      {active === 'projects' && <div className="space-y-6"><section aria-label="Projects"><h2 className="mb-4 text-xl">Projects</h2>{projects.length === 0 ? <p className="text-sm text-muted-foreground">No projects yet. Create one under Clients & projects.</p> : <div className="grid gap-2">{projects.map(project => <button key={project.id} type="button" onClick={() => onSelectProject(project.id)} className={`w-full rounded border p-4 text-left hover:border-primary ${selectedId === project.id ? 'border-primary bg-muted' : 'border-border bg-card'}`}><strong className="block">{project.title}</strong><span className="text-sm text-muted-foreground">{project.status || 'Planning'} · {clients.find(c => c.id === project.client_id)?.email || 'Client'}</span></button>)}</div>}</section><section aria-label="Project details">{selected ? <PortalProjectDetail key={selected.id} project={selected} requests={requests.filter(r => r.project_id === selected.id)} admin onDone={onRefresh} /> : <div className="rounded border border-border bg-card p-8 text-sm text-muted-foreground">{projects.length ? 'Select a project to see its progress and requests.' : 'Project details will appear here.'}</div>}</section></div>}
    </div>
    {active !== 'chatgpt' && <AdminAssistant />}
  </div>;
}