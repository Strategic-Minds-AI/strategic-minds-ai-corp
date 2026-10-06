import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Zap, ExternalLink, Globe, Phone, Mail, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import OnboardingChecklist from './OnboardingChecklist';
import OnboardingProgress from './OnboardingProgress';
import GoogleWorkspacePanel from './GoogleWorkspacePanel';
import OnboardingAIAssistant from './OnboardingAIAssistant';

const STAGES = ['New Lead', 'Contract Sent', 'Contract Signed', 'Onboarding', 'Active'];

export default function OnboardingClientDetail({ client, tasks, onBack, onUpdateStatus, onToggleTask, onInitChecklist, onClientUpdated }) {
  const [tab, setTab] = useState('checklist');
  const clientTasks = tasks.filter(t => t.client_id === client.id);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
      <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-5 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Pipeline
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Header */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="min-w-0">
                <h2 className="text-2xl font-bold text-foreground tracking-tight">{client.company_name}</h2>
                <p className="text-muted-foreground text-sm mt-1">{client.contact_name} {client.contact_email && `· ${client.contact_email}`}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {client.contract_value > 0 && <span className="text-xs bg-primary/10 text-primary rounded-full px-3 py-1 font-semibold">${client.contract_value.toLocaleString()}</span>}
                  {client.service_type && <span className="text-xs bg-muted text-muted-foreground rounded-full px-3 py-1">{client.service_type}</span>}
                  {client.industry && <span className="text-xs bg-muted text-muted-foreground rounded-full px-3 py-1">{client.industry}</span>}
                  {client.assigned_to && <span className="text-xs bg-muted text-muted-foreground rounded-full px-3 py-1">→ {client.assigned_to}</span>}
                  {client.priority && <span className={`text-xs rounded-full px-3 py-1 font-medium ${client.priority === 'urgent' ? 'bg-destructive/10 text-destructive' : client.priority === 'high' ? 'bg-chart-3/10 text-chart-3' : 'bg-muted text-muted-foreground'}`}>{client.priority}</span>}
                </div>
                {(client.website || client.contact_phone || client.contact_email) && (
                  <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                    {client.website && <a href={client.website.startsWith('http') ? client.website : `https://${client.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary"><Globe size={12} />{client.website}</a>}
                    {client.contact_phone && <span className="flex items-center gap-1"><Phone size={12} />{client.contact_phone}</span>}
                    {client.contact_email && <span className="flex items-center gap-1"><Mail size={12} />{client.contact_email}</span>}
                  </div>
                )}
              </div>
              <Select value={client.onboarding_status} onValueChange={v => onUpdateStatus(client.id, v)}>
                <SelectTrigger className="w-44 bg-muted border-border flex-shrink-0"><SelectValue /></SelectTrigger>
                <SelectContent>{STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex gap-1.5">
              {STAGES.map(s => (
                <div key={s} className={`flex-1 h-1.5 rounded-full transition-colors ${STAGES.indexOf(s) <= STAGES.indexOf(client.onboarding_status) ? 'bg-primary' : 'bg-muted'}`} />
              ))}
            </div>
          </div>

          {/* AI Assistant */}
          <OnboardingAIAssistant client={client} />

          {/* Tabs + Checklist */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              {[{ id: 'checklist', label: 'Checklist', icon: '📋' }, { id: 'google', label: 'Google Workspace', icon: '🔗' }].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${tab === t.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
                  {t.icon} {t.label}
                </button>
              ))}
              {clientTasks.length === 0 && tab === 'checklist' && (
                <Button variant="outline" size="sm" onClick={() => onInitChecklist(client.id, client.company_name)} className="ml-auto text-xs gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> Initialize Checklist
                </Button>
              )}
            </div>
            {tab === 'checklist' && <OnboardingChecklist tasks={clientTasks} onToggleTask={onToggleTask} />}
            {tab === 'google' && <GoogleWorkspacePanel client={client} onClientUpdated={onClientUpdated} />}
          </div>
        </div>

        <div className="space-y-5">
          <OnboardingProgress tasks={clientTasks} />
          {client.google_drive_folder_url && (
            <a href={client.google_drive_folder_url} target="_blank" rel="noreferrer" className="block bg-chart-2/5 border border-chart-2/20 rounded-xl p-4 hover:border-chart-2/40 transition-colors">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground"><Building2 size={16} className="text-chart-2" /> Client Drive Folder</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">Open in Google Drive <ExternalLink size={11} /></p>
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}