import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, AlertTriangle, Sparkles, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Helmet } from 'react-helmet';
import { toast } from 'sonner';
import PageHero from '@/components/agency/PageHero';
import OnboardingStats from '@/components/onboarding/OnboardingStats';
import OnboardingPipeline from '@/components/onboarding/OnboardingPipeline';
import OnboardingClientDetail from '@/components/onboarding/OnboardingClientDetail';
import AddClientModal from '@/components/onboarding/AddClientModal';

export default function ClientOnboarding() {
  const [selectedClient, setSelectedClient] = useState(null);
  const [showAddClient, setShowAddClient] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['onboarding-clients'],
    queryFn: async () => { const r = await base44.entities.OnboardingClient.filter({}, { sort: '-created_at', limit: 200 }); return r.items || []; }
  });
  const { data: tasks = [] } = useQuery({
    queryKey: ['onboarding-tasks'],
    queryFn: async () => { const r = await base44.entities.ClientTask.filter({}, { sort: 'created_at', limit: 500 }); return r.items || []; }
  });
  const { data: checklistItems = [] } = useQuery({
    queryKey: ['onboarding-checklist-items'],
    queryFn: async () => { const r = await base44.entities.OnboardingChecklistItem.filter({}, { sort: 'sort_order', limit: 100 }); return r.items || []; }
  });
  const { data: stats } = useQuery({
    queryKey: ['onboarding-stats'],
    queryFn: async () => { const res = await base44.functions.invoke('onboardingWorkspace', { action: 'dashboardStats' }); return res.data; }
  });

  const createClientMutation = useMutation({
    mutationFn: (data) => base44.entities.OnboardingClient.create(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-clients'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-stats'] });
      setShowAddClient(false);
      toast.success(`${created.company_name} added to pipeline`);
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.OnboardingClient.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-clients'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-stats'] });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ClientTask.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['onboarding-tasks'] }),
  });

  const initChecklistMutation = useMutation({
    mutationFn: async ({ clientId, clientName }) => {
      const existingTasks = tasks.filter(t => t.client_id === clientId);
      if (existingTasks.length > 0) { toast.info('Checklist already initialized'); return; }
      const today = new Date();
      const newTasks = checklistItems.map(item => ({
        client_id: clientId, client_name: clientName, checklist_item_id: item.id,
        title: item.title, category: item.category, status: 'Not Started',
        due_date: new Date(today.getTime() + (item.default_due_days || 0) * 86400000).toISOString().split('T')[0],
        assigned_to: '',
      }));
      await base44.entities.ClientTask.bulkCreate(newTasks);
      toast.success('Onboarding checklist initialized');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['onboarding-tasks'] }),
  });

  async function seedChecklist() {
    setSeeding(true);
    try {
      const res = await base44.functions.invoke('onboardingWorkspace', { action: 'seedChecklist' });
      if (res.data?.error) throw new Error(res.data.error);
      queryClient.invalidateQueries({ queryKey: ['onboarding-checklist-items'] });
      toast.success(res.data?.message || 'Master checklist seeded');
    } catch (e) { toast.error(e.message); }
    finally { setSeeding(false); }
  }

  useEffect(() => {
    if (selectedClient) {
      const updated = clients.find(c => c.id === selectedClient.id);
      if (updated) setSelectedClient(updated);
    }
  }, [clients, selectedClient]);

  const stuckCount = stats?.stuckClients?.length || 0;

  return (
    <>
      <Helmet>
        <title>Client Onboarding — Strategic Minds AI</title>
        <meta name="theme-color" content="#0066ff" />
      </Helmet>
      <main className="relative">
        <PageHero
          eyebrow="CLIENT ONBOARDING SYSTEM"
          title={<>Professional Client <span className="text-primary">Onboarding</span> Pipeline</>}
          description="Track every client from first contact to active engagement — with Google Workspace integration, AI-powered guidance, and automated checklists."
          note="Google Drive · Google Contacts · Google Calendar · AI Assistant"
          ctaLabel="Add New Client"
          ctaHref="#pipeline"
          secondaryLabel="Seed Checklist Template"
          secondaryHref="#seed"
        />

        <section id="pipeline" className="agency-container py-12 space-y-6">
          {/* Stats */}
          {stats && <OnboardingStats stats={stats} />}

          {/* Stuck client alerts */}
          {stuckCount > 0 && !selectedClient && (
            <div className="flex items-start gap-3 bg-destructive/5 border border-destructive/20 rounded-xl p-4">
              <AlertTriangle size={18} className="text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{stuckCount} client{stuckCount > 1 ? 's' : ''} need attention</p>
                <p className="text-xs text-muted-foreground mt-0.5">Been in the same stage for 7+ days: {stats.stuckClients.map(c => c.company_name).join(', ')}</p>
              </div>
            </div>
          )}

          {/* Action bar */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">Onboarding Pipeline</h2>
              {checklistItems.length === 0 && (
                <Button variant="outline" size="sm" id="seed" onClick={seedChecklist} disabled={seeding} className="text-xs gap-1.5">
                  {seeding ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} className="text-chart-2" />} Seed Master Checklist
                </Button>
              )}
            </div>
            <Button onClick={() => setShowAddClient(true)} className="gap-2">
              <Plus size={16} /> Add Client
            </Button>
          </div>

          {/* Pipeline or Detail */}
          {loadingClients ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : selectedClient ? (
            <OnboardingClientDetail
              client={selectedClient}
              tasks={tasks}
              onBack={() => setSelectedClient(null)}
              onUpdateStatus={(id, status) => updateClientMutation.mutate({ id, data: { onboarding_status: status } })}
              onToggleTask={(id, status) => updateTaskMutation.mutate({ id, data: { status, completed_date: status === 'Completed' ? new Date().toISOString().split('T')[0] : null } })}
              onInitChecklist={(clientId, clientName) => initChecklistMutation.mutate({ clientId, clientName })}
              onClientUpdated={() => queryClient.invalidateQueries({ queryKey: ['onboarding-clients'] })}
            />
          ) : (
            <OnboardingPipeline clients={clients} tasks={tasks} onSelectClient={setSelectedClient} />
          )}

          {/* AI feature callout */}
          {!selectedClient && (
            <div className="mt-8 bg-gradient-to-br from-primary/5 to-card border border-primary/20 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0"><Sparkles size={20} /></div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">AI-Powered Onboarding Assistance</h3>
                  <p className="text-sm text-muted-foreground max-w-2xl">Click any client to access the AI onboarding assistant. Get strategic recommendations, risk assessments, and next-step guidance tailored to each client's context — powered by Strategic Minds AI.</p>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      <AddClientModal open={showAddClient} onClose={() => setShowAddClient(false)} onAdd={(data) => createClientMutation.mutate(data)} />
    </>
  );
}