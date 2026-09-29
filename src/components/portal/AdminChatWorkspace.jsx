import { useEffect, useState } from 'react';
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
import { runChatAction } from './adminChatActions';

export default function AdminChatWorkspace(props) {
  const { user } = useAuth();
  const key = `strategic-admin-chats-${user?.id}`;
  const [chats, setChats] = useState(() => { try { const saved = JSON.parse(localStorage.getItem(key)); return Array.isArray(saved) ? saved : []; } catch { return []; } });
  const [selectedId, setSelectedId] = useState(null);
  const [view, setView] = useState('chat');
  const [draft, setDraft] = useState('');
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
  useEffect(() => { localStorage.setItem(key, JSON.stringify(chats)); }, [chats, key]);
  const current = chats.find(c => c.id === selectedId);
  const newChat = () => { setSelectedId(null); setDraft(''); setQuickTask(null); setError(''); setView('chat'); };
  const select = id => { setSelectedId(id); setQuickTask(null); setError(''); setView('chat'); };
  const remove = id => { setChats(prev => prev.filter(c => c.id !== id)); if (selectedId === id) setSelectedId(null); };
  const startQuickTask = (task, contextId = projectId) => {
    const project = props.projects.find(p => p.id === contextId);
    const notes = project ? [project.progress_note, ...props.requests.filter(r => r.project_id === project.id).flatMap(r => [r.message, r.reply])].filter(Boolean).join('\n\n').slice(0, 3000) : '';
    setSelectedId(null); setView('chat'); setError(''); setQuickTask(task);
    setDraft(task === 'notes' ? `Summarize these client notes for ${project?.title || 'the selected project'}. Identify decisions, open questions and next actions. Do not invent facts.\n\n${notes || '[Paste client notes here before sending]'}` : `Create a reusable, practical project outline template for ${project?.title || 'the selected project'}, with objectives, scope, milestones, deliverables, responsibilities, risks and next steps. ${project?.progress_note ? `Project context: ${project.progress_note.slice(0, 1200)}` : ''}`);
  };
  async function send(e) {
    e.preventDefault(); const text = draft.trim() || (attachments.length ? 'Please analyze these attachments.' : ''); if (!text || sending || uploading) return;
    if (executionMode === 'plan' && mode === 'image') { setError('Plan mode does not generate images. Switch to Build for an image draft.'); return; }
    if (quickTask && mode === 'image') { setError('Finish this project task before creating an image.'); return; }
    if (mode === 'image' && attachments.some(file => !/\.(png|jpe?g|webp)$/i.test(file.name))) { setError('Image creation can use photos as references; remove other attached files first.'); return; }
    if (quickTask && executionMode === 'build' && !projectId) { setError('Choose a project first so the output can be saved to its Drive folder.'); return; }
    if (quickTask === 'notes' && text.includes('[Paste client notes here before sending]')) { setError('Paste the notes before requesting a summary.'); return; }
    const task = executionMode === 'build' ? quickTask : null; const destination = projectId;
    const id = selectedId || crypto.randomUUID();
    const existing = chats.find(c => c.id === id);
    const files = attachments; const selectedMode = mode;
    const next = [...(existing?.messages || []), { role: 'user', content: text, ...(files.length ? { attachments: files } : {}) }];
    setSelectedId(id); setDraft(''); setError(''); setSending(true);
    setChats(prev => [{ id, title: existing?.title || text.slice(0, 42), messages: next }, ...prev.filter(c => c.id !== id)]);
    try {
      const answer = await runChatAction({ messages: next, mode: selectedMode, attachments: files, executionMode });
      setChats(prev => prev.map(c => c.id === id ? { ...c, messages: [...next, { role: 'assistant', ...answer }] } : c));
      setAttachments([]); setMode(null); setQuickTask(null);
      if (task) {
        try {
          const label = task === 'notes' ? 'Client notes summary' : 'Project outline';
          const name = `${label} ${new Date().toISOString().replace(/[:.]/g, '-')}.md`;
          const saved = await base44.functions.invoke('agencyDriveIngest', { action: 'saveProjectText', projectId: destination, name, content: `# ${label}\n\n${answer.content}`, approved: true });
          setChats(prev => prev.map(c => c.id === id ? { ...c, messages: [...next, { role: 'assistant', ...answer, savedUrl: saved.data.file.webViewLink }] } : c));
        } catch (saveError) { setError(`The answer is here, but Drive saving failed: ${saveError.response?.data?.error || saveError.message}`); }
      }
    } catch (err) { setDraft(text); setError(err.response?.data?.error || err.message || 'Could not send message. You can try again.'); }
    finally { setSending(false); }
  }
  return <main className="fixed inset-0 z-50 flex overflow-hidden bg-background font-body text-foreground">
    <AdminChatSidebar chats={chats} selectedId={selectedId} view={view} onView={setView} onNew={newChat} onSelect={select} onDelete={remove} onQuickTask={startQuickTask} onSettings={() => setView('settings')} projects={props.projects} collapsed={sidebarCollapsed} onCollapse={setSidebarCollapsed}/>
    {view === 'chat' ? <AdminChatConversation chat={current} draft={draft} onDraft={setDraft} onSend={send} sending={sending} error={error} projects={props.projects} projectId={projectId} onProject={id => { setProjectId(id); if (quickTask) startQuickTask(quickTask, id); }} quickTask={quickTask} onAccount={openAccount} mode={mode} onMode={setMode} attachments={attachments} onFiles={addFiles} onRemoveFile={index => setAttachments(previous => previous.filter((_, i) => i !== index))} uploading={uploading} executionMode={executionMode} onExecutionMode={setExecutionMode}/> : view.startsWith('account:') ? <div className="min-w-0 flex-1 overflow-y-auto bg-background"><header className="sticky top-0 z-10 flex min-h-16 items-center border-b border-border bg-background px-5 py-2 pl-16"><AdminAccountBar active={view.split(':')[1]} onSelect={openAccount}/><AdminViewClose onClick={() => setView('chat')}/></header><AdminAccountOverview key={view} provider={view.split(':')[1]}/></div> : view === 'settings' ? <AdminChatSettings chats={chats} onClear={() => { setChats([]); setSelectedId(null); }} onBack={() => setView('chatgpt')} onClose={() => setView('chat')} onVault={() => setView('vault')}/> : <div className="min-w-0 flex-1 overflow-y-auto bg-background"><header className="sticky top-0 z-10 flex min-h-16 flex-wrap items-center gap-3 border-b border-border bg-background px-5 py-2 pl-16"><AdminAccountBar active={view} onSelect={openAccount}/><span className="text-xs font-medium capitalize text-muted-foreground">{view === 'chatgpt' ? 'MCP connection' : view.replace('-', ' ')}</span><AdminViewClose onClick={() => setView('chat')}/></header><div className="p-5 md:p-8">{props.loadError && <p role="alert" className="mb-5 text-sm text-destructive">{props.loadError} <button type="button" onClick={props.onRefresh} className="underline">Retry</button></p>}{view === 'benchmarks' ? <BenchmarkWorkspace projects={props.projects} onDraft={prompt => { newChat(); setMode(null); setAttachments([]); setExecutionMode('plan'); setDraft(prompt); }}/> : view === 'discovery' ? <ApexDiscovery/> : view === 'vault' ? <AdminVault onOpen={setView} onDraft={prompt => { newChat(); setExecutionMode('build'); setDraft(prompt); }}/>: <AdminPortalWorkspace {...props} active={view}/>}</div></div>}
  </main>;
}