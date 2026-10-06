import { motion } from 'framer-motion';
import { AlertTriangle, Clock } from 'lucide-react';

const STAGES = ['New Lead', 'Contract Sent', 'Contract Signed', 'Onboarding', 'Active'];

export default function OnboardingPipeline({ clients, tasks, onSelectClient }) {
  function getClientProgress(clientId) {
    const clientTasks = tasks.filter(t => t.client_id === clientId);
    if (clientTasks.length === 0) return 0;
    return Math.round((clientTasks.filter(t => t.status === 'Completed').length / clientTasks.length) * 100);
  }
  function getDaysInStatus(client) {
    return Math.floor((new Date() - new Date(client.updated_at || client.created_at)) / 86400000);
  }
  return (
    <div className="overflow-x-auto pb-4 -mx-4 px-4">
      <div className="flex gap-4 min-w-max">
        {STAGES.map(stage => {
          const stageClients = clients.filter(c => c.onboarding_status === stage);
          return (
            <div key={stage} className="w-72 flex-shrink-0">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stage}</span>
                <span className="text-xs bg-primary/10 text-primary rounded-full px-2.5 py-0.5 font-medium">{stageClients.length}</span>
              </div>
              <div className="space-y-2.5 min-h-[100px]">
                {stageClients.map(client => {
                  const progress = getClientProgress(client.id);
                  const days = getDaysInStatus(client);
                  const stuck = days > 7 && !['Active', 'Completed'].includes(stage);
                  return (
                    <motion.div
                      key={client.id}
                      layout
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => onSelectClient(client)}
                      className="bg-card border border-border hover:border-primary/30 rounded-xl p-4 cursor-pointer transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">{client.company_name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{client.contact_name}</p>
                        </div>
                        {client.contract_value > 0 && <span className="text-xs font-semibold text-primary whitespace-nowrap">${client.contract_value.toLocaleString()}</span>}
                      </div>
                      {progress > 0 && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Progress</span><span className="font-medium text-foreground">{progress}%</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <motion.div className="h-full bg-primary rounded-full" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.6 }} />
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <span className={`text-[11px] flex items-center gap-1 ${stuck ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                          {stuck && <AlertTriangle size={11} />}{days}d in stage
                        </span>
                        <div className="flex items-center gap-1.5">
                          {client.google_drive_folder_id && <span className="w-1.5 h-1.5 rounded-full bg-chart-2" title="Drive synced" />}
                          {client.google_contact_resource && <span className="w-1.5 h-1.5 rounded-full bg-chart-3" title="Contact synced" />}
                          {client.google_calendar_event_id && <span className="w-1.5 h-1.5 rounded-full bg-chart-4" title="Kickoff scheduled" />}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                {stageClients.length === 0 && <div className="border-2 border-dashed border-border rounded-xl p-6 text-center"><p className="text-xs text-muted-foreground">No clients</p></div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}