import { useState } from 'react';
import { FolderOpen, Calendar, UserPlus, Loader2, CheckCircle2, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';

export default function GoogleWorkspacePanel({ client, onClientUpdated }) {
  const [provisioning, setProvisioning] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [kickoffTime, setKickoffTime] = useState('');
  const [error, setError] = useState('');

  async function provisionWorkspace() {
    setProvisioning(true); setError('');
    try {
      const res = await base44.functions.invoke('onboardingWorkspace', { action: 'provisionWorkspace', clientId: client.id });
      if (res.data?.error) throw new Error(res.data.error);
      onClientUpdated();
    } catch (e) { setError(e.message); }
    finally { setProvisioning(false); }
  }

  async function scheduleKickoff() {
    if (!kickoffTime) { setError('Select a date and time'); return; }
    setScheduling(true); setError('');
    try {
      const res = await base44.functions.invoke('onboardingWorkspace', { action: 'scheduleKickoff', clientId: client.id, start: new Date(kickoffTime).toISOString() });
      if (res.data?.error) throw new Error(res.data.error);
      onClientUpdated();
    } catch (e) { setError(e.message); }
    finally { setScheduling(false); }
  }

  async function syncContact() {
    setSyncing(true); setError('');
    try {
      const res = await base44.functions.invoke('onboardingWorkspace', { action: 'syncContact', clientId: client.id });
      if (res.data?.error) throw new Error(res.data.error);
      onClientUpdated();
    } catch (e) { setError(e.message); }
    finally { setSyncing(false); }
  }

  const integrations = [
    {
      name: 'Google Drive',
      icon: <FolderOpen size={18} />,
      desc: 'Client folder with sub-folders for contracts, briefs, assets',
      done: !!client.google_drive_folder_id,
      action: provisionWorkspace,
      loading: provisioning,
      label: client.google_drive_folder_id ? 'Folder Ready' : 'Create Folder',
      link: client.google_drive_folder_url,
      color: 'text-chart-2',
      bg: 'bg-chart-2/10',
    },
    {
      name: 'Google Contacts',
      icon: <UserPlus size={18} />,
      desc: 'Sync contact to your Google Contacts for easy access',
      done: !!client.google_contact_resource,
      action: syncContact,
      loading: syncing,
      label: client.google_contact_resource ? 'Contact Synced' : 'Sync Contact',
      color: 'text-chart-3',
      bg: 'bg-chart-3/10',
    },
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base font-semibold text-foreground">Google Workspace</span>
        <span className="text-[10px] bg-primary/10 text-primary rounded-full px-2 py-0.5 font-bold uppercase tracking-wider">Integrated</span>
      </div>

      {error && <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/5 rounded-lg p-3"><AlertCircle size={14} className="flex-shrink-0 mt-0.5" />{error}</div>}

      {integrations.map(int => (
        <div key={int.name} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/20 transition-colors">
          <div className={`w-9 h-9 rounded-lg ${int.bg} flex items-center justify-center ${int.color} flex-shrink-0`}>{int.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{int.name}</span>
              {int.done && <CheckCircle2 size={14} className="text-primary" />}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{int.desc}</p>
            <div className="flex items-center gap-2 mt-2">
              <Button size="sm" variant={int.done ? 'outline' : 'default'} onClick={int.action} disabled={int.loading || int.done} className="text-xs gap-1.5 h-8">
                {int.loading && <Loader2 size={12} className="animate-spin" />}
                {int.label}
              </Button>
              {int.link && <a href={int.link} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">Open <ExternalLink size={11} /></a>}
            </div>
          </div>
        </div>
      ))}

      {/* Google Calendar */}
      <div className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/20 transition-colors">
        <div className="w-9 h-9 rounded-lg bg-chart-4/10 flex items-center justify-center text-chart-4 flex-shrink-0"><Calendar size={18} /></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Google Calendar</span>
            {client.google_calendar_event_id && <CheckCircle2 size={14} className="text-primary" />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Schedule a kickoff call with calendar invite</p>
          {client.kickoff_scheduled_at ? (
            <p className="text-xs text-primary mt-2 font-medium">Scheduled: {new Date(client.kickoff_scheduled_at).toLocaleString()}</p>
          ) : (
            <div className="flex items-end gap-2 mt-2">
              <div className="flex-1">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Kickoff Date & Time</Label>
                <Input type="datetime-local" className="mt-1 h-8 text-xs bg-muted border-border" value={kickoffTime} onChange={e => setKickoffTime(e.target.value)} />
              </div>
              <Button size="sm" onClick={scheduleKickoff} disabled={scheduling || !kickoffTime} className="text-xs gap-1.5 h-8">
                {scheduling && <Loader2 size={12} className="animate-spin" />}Schedule
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}