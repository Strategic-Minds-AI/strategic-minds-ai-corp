import AdminClientInvite from './AdminClientInvite';
import AdminProjectForm from './AdminProjectForm';
import PortalProjectDetail from './PortalProjectDetail';
import SiteProvisioner from './SiteProvisioner';
import ClientInfrastructure from './ClientInfrastructure';
import AdminCommerce from '@/components/commerce/AdminCommerce';
import ClientMirror from './ClientMirror';
import CrmPanel from './CrmPanel';
import ChatGPTConnection from './ChatGPTConnection';
import AdminIngestion from './AdminIngestion';
import GoogleWorkspacePanel from './GoogleWorkspacePanel';
import AdminPhoneLink from '@/components/portal/phone/AdminPhoneLink';
import DomainOperations from './DomainOperations';
import PerformanceDashboard from './PerformanceDashboard';
import BlogEditorialCalendar from './BlogEditorialCalendar';

export default function AdminPortalWorkspace({ projects, requests, clients, selectedId, onSelectProject, onRefresh, active }) {
  const selected = projects.find(p => p.id === selectedId);
  return <div className="min-w-0">
      {active === 'dashboard' && <PerformanceDashboard />}
      {active === 'blog' && <BlogEditorialCalendar />}
      {active === 'domains' && <DomainOperations />}
      {active === 'chatgpt' && <ChatGPTConnection />}
      {active === 'phone' && <AdminPhoneLink />}
      {active === 'ingestion' && <AdminIngestion projects={projects}/>}
      {active === 'google-workspace' && <GoogleWorkspacePanel />}
      {active === 'crm' && <CrmPanel />}
      {active === 'clients' && <div className="grid gap-5"><AdminClientInvite onDone={onRefresh} /><AdminProjectForm clients={clients} onDone={onRefresh} /></div>}
      {active === 'commerce' && <AdminCommerce clients={clients} onDone={onRefresh} />}
      {active === 'mirror' && <ClientMirror clients={clients} />}
      {active === 'infrastructure' && <ClientInfrastructure clients={clients} />}
      {active === 'provisioning' && <SiteProvisioner clients={clients} />}
      {active === 'projects' && <div className="space-y-6"><section aria-label="Projects"><h2 className="mb-4 text-xl">Projects</h2>{projects.length === 0 ? <p className="text-sm text-muted-foreground">No projects yet. Create one under Clients & projects.</p> : <div className="grid gap-2">{projects.map(project => <button key={project.id} type="button" onClick={() => onSelectProject(project.id)} className={`w-full rounded border p-4 text-left hover:border-primary ${selectedId === project.id ? 'border-primary bg-muted' : 'border-border bg-card'}`}><strong className="block">{project.title}</strong><span className="text-sm text-muted-foreground">{project.status || 'Planning'} · {clients.find(c => c.id === project.client_id)?.email || 'Client'}</span></button>)}</div>}</section><section aria-label="Project details">{selected ? <PortalProjectDetail key={selected.id} project={selected} requests={requests.filter(r => r.project_id === selected.id)} admin onDone={onRefresh} /> : <div className="rounded border border-border bg-card p-8 text-sm text-muted-foreground">{projects.length ? 'Select a project to see its progress and requests.' : 'Project details will appear here.'}</div>}</section></div>}
  </div>;
}