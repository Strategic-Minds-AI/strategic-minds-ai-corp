import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import AdminChatSidebar from './AdminChatSidebar';
import AdminChatConversation from './AdminChatConversation';
import AdminChatSettings from './AdminChatSettings';
import AdminPortalWorkspace from './AdminPortalWorkspace';
import AdminAccountOverview from './AdminAccountOverview';
import AdminAccountBar from './AdminAccountBar';
import AdminViewClose from './AdminViewClose';
import AdminVault from '@/components/portal/vault/AdminVault';
import ApexDiscovery from '@/components/portal/apex/ApexDiscovery';
import BenchmarkWorkspace from '@/components/portal/benchmark/BenchmarkWorkspace';
import useAdminChatHistory from '@/components/portal/chat/useAdminChatHistory';
import useAdminChatSender from '@/components/portal/chat/useAdminChatSender';
import AdminChatSyncStatus from '@/components/portal/chat/AdminChatSyncStatus';

export default function AdminChatWorkspace(props) {
  const { user } = useAuth();
  const history = useAdminChatHistory(user?.id);
  const chats = history.chats;
  const [selectedId, setSelectedId] = useState(null);
  const location = useLocation();
  const urlParams = new URLSearchParams(window.location.search);
  const initialView = urlParams.get('view');
  const [view, setView] = useState(['dashboard','clients','projects','crm','commerce','blog','insider','domains','phone','comms','discovery','infrastructure','provisioning','google-workspace','vault','settings','bootstrap','ingestion','mirror','benchmarks','chatgpt'].includes(initialView) ? initialView : 'chat');
  const [draft, setDraft] = useState(location.state?.draft || '');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [projectId, setProjectId] = useState('');
  const [quickTask, setQuickTask] = useState(null);
  const [mode, setMode] = useState(null);
  const [executionMode, setExecutionMode] = useState('plan');
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  async function addFiles(files) {
    if (!files.length) return;
    if (attachments.length + files.length > 5 || files.some(file => file.size > 20 * 1024 * 1024)) { setError('Attach up to five files, each under 20 MB.'); return; }
    setUploading(true); setError('');
    try {
      const uploaded = await Promise.all(files.map(async file => {
        const result = await base44.integrations.Core.UploadPrivateFile({ file });
        return { name: file.name, file_uri: result.file_uri };
      }));
      setAttachments(previous => [...previous, ...uploaded]);
    } catch (error) { setError(error.message || 'Could not upload those files.'); }
    finally { setUploading(false); }
  }
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const openAccount = account => setView(['vercel', 'supabase', 'railway', 'github'].includes(account) ? `account:${account}` : account);
  const current = chats.find(c => c.id === selectedId);
  const newChat = () => { setSelectedId(null); setDraft(''); setQuickTask(null); setError(''); setView('chat'); };
  const select = id => { setSelectedId(id); setQuickTask(null); setError(''); setView('chat'); };
  const remove = async id => { try { await history.remove(id); if (selectedId === id) setSelectedId(null); } catch (failure) { setError(failure.message); } };
  const clear = async () => { try { await history.clear(); setSelectedId(null); } catch (failure) { setError(failure.message); } };
  const startQuickTask = (task, contextId = projectId) => {
    const project = props.projects.find(p => p.id === contextId);
    const notes = project ? [project.progress_note, ...props.requests.filter(r => r.project_id === project.id).flatMap(r => [r.message, r.reply])].filter(Boolean).join('\n\n').slice(0, 3000) : '';
    setSelectedId(null); setView('chat'); setError(''); setQuickTask(task);
    setDraft(task === 'notes' ? `Summarize these client notes for ${project?.title || 'the selected project'}. Identify decisions, open questions and next actions. Do not invent facts.\n\n${notes || '[Paste client notes here before sending]'}` : `Create a reusable, practical project outline template for ${project?.title || 'the selected project'}, with objectives, scope, milestones, deliverables, responsibilities, risks and next steps. ${project?.progress_note ? `Project context: ${project.progress_note.slice(0, 1200)}` : ''}`);
  };
  const send = useAdminChatSender({ history, chats, selectedId, setSelectedId, draft, setDraft, sending, setSending, setError, uploading, attachments, setAttachments, mode, setMode, executionMode, quickTask, setQuickTask, projectId });
  return <main className="fixed inset-0 z-50 flex overflow-hidden bg-background font-body text-foreground">
    <AdminChatSidebar chats={chats} selectedId={selectedId} view={view} onView={setView} onNew={newChat} onSelect={select} onDelete={remove} onQuickTask={startQuickTask} onSettings={() => setView('settings')} projects={props.projects} collapsed={sidebarCollapsed} onCollapse={setSidebarCollapsed}/>
    <div className="flex min-w-0 flex-1 flex-col"><AdminChatSyncStatus loading={history.loading} busy={history.busy} error={history.error} onRetry={history.retry}/>
    {view === 'chat' ? <AdminChatConversation blocked={!history.ready || history.busy} chat={current} draft={draft} onDraft={setDraft} onSend={send} sending={sending} error={error} projects={props.projects} projectId={projectId} onProject={id => { setProjectId(id); if (quickTask) startQuickTask(quickTask, id); }} quickTask={quickTask} onAccount={openAccount} mode={mode} onMode={setMode} attachments={attachments} onFiles={addFiles} onRemoveFile={index => setAttachments(previous => previous.filter((_, i) => i !== index))} uploading={uploading} executionMode={executionMode} onExecutionMode={setExecutionMode}/> : view.startsWith('account:') ? <div className="min-w-0 flex-1 overflow-y-auto bg-background"><header className="sticky top-0 z-10 flex min-h-16 items-center border-b border-border bg-background px-5 py-2 pl-16"><AdminAccountBar active={view.split(':')[1]} onSelect={openAccount}/><AdminViewClose onClick={() => setView('chat')}/></header><AdminAccountOverview key={view} provider={view.split(':')[1]}/></div> : view === 'settings' ? <AdminChatSettings chats={chats} historyBusy={history.busy || history.loading} onClear={clear} onBack={() => setView('chatgpt')} onClose={() => setView('chat')} onVault={() => setView('vault')}/> : <div className="min-w-0 flex-1 overflow-y-auto bg-background"><header className="sticky top-0 z-10 flex min-h-16 flex-wrap items-center gap-3 border-b border-border bg-background px-5 py-2 pl-16"><AdminAccountBar active={view} onSelect={openAccount}/><span className="text-xs font-medium capitalize text-muted-foreground">{view === 'chatgpt' ? 'MCP connection' : view.replace('-', ' ')}</span><AdminViewClose onClick={() => setView('chat')}/></header><div className="p-5 md:p-8">{props.loadError && <p role="alert" className="mb-5 text-sm text-destructive">{props.loadError} <button type="button" onClick={props.onRefresh} className="underline">Retry</button></p>}{view === 'benchmarks' ? <BenchmarkWorkspace projects={props.projects} onDraft={prompt => { newChat(); setMode(null); setAttachments([]); setExecutionMode('plan'); setDraft(prompt); }}/> : view === 'discovery' ? <ApexDiscovery/> : view === 'vault' ? <AdminVault onOpen={setView} onDraft={prompt => { newChat(); setExecutionMode('build'); setDraft(prompt); }}/>: <AdminPortalWorkspace {...props} active={view}/>}</div></div>}
    </div>
  </main>;
}