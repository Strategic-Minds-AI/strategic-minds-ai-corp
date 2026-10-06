import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, Plus, Github, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import IdeaCard from '@/components/idea/IdeaCard';
import IdeaComposer from '@/components/idea/IdeaComposer';
import { createSwarm } from '@/components/swarm/swarmActions';

const CATEGORY_AGENTS = {
  feature: { preset: 'engineering', agents: ['orchestrator', 'coder', 'architect'] },
  refactor: { preset: 'engineering', agents: ['coder', 'code-reviewer', 'architect'] },
  bugfix: { preset: 'engineering', agents: ['coder', 'debugger', 'test-engineer'] },
  research: { preset: 'research', agents: ['orchestrator', 'researcher', 'analyst'] },
  infrastructure: { preset: 'engineering', agents: ['devops-lead', 'architect', 'coder'] },
  content: { preset: 'general', agents: ['writer', 'doc-writer'] },
  growth: { preset: 'general', agents: ['analyst', 'planner'] },
  security: { preset: 'engineering', agents: ['security-auditor', 'coder'] },
};

const FILTERS = ['proposed', 'approved', 'building', 'completed', 'rejected', 'all'];

export default function IdeaEngine() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ideas, setIdeas] = useState([]);
  const [filter, setFilter] = useState('proposed');
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [githubConnected, setGithubConnected] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [counts, setCounts] = useState({ proposed: 0, approved: 0, completed: 0 });

  const loadIdeas = useCallback(async () => {
    setLoading(true);
    try {
      const query = filter === 'all' ? {} : { status: filter };
      const { items } = await base44.entities.Idea.filter(query, { sort: '-created_at', limit: 100 });
      setIdeas(items);
    } catch { toast({ title: 'Failed to load ideas', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [filter]);

  const loadCounts = useCallback(async () => {
    try {
      const [proposed, approved, completed] = await Promise.all([
        base44.entities.Idea.count({ status: 'proposed' }),
        base44.entities.Idea.count({ status: 'approved' }),
        base44.entities.Idea.count({ status: 'completed' }),
      ]);
      setCounts({ proposed, approved, completed });
    } catch {}
  }, []);

  const checkGithub = useCallback(async () => {
    try {
      const res = await base44.functions.invoke('scanGithubRepos', { scan: false });
      if (res.data?.connected) setGithubConnected(true);
    } catch { setGithubConnected(false); }
  }, []);

  useEffect(() => { loadIdeas(); loadCounts(); }, [loadIdeas]);
  useEffect(() => { checkGithub(); }, [checkGithub]);

  const handleApprove = async (idea) => {
    const mapping = CATEGORY_AGENTS[idea.category] || CATEGORY_AGENTS.feature;
    try {
      const run = await createSwarm({
        prompt: `${idea.title}\n\n${idea.description}\n\nRationale: ${idea.rationale || ''}`,
        selected: mapping.agents, preset: mapping.preset, runtime: 'native', concurrency: 3,
      }, () => {});
      await base44.entities.Idea.update(idea.id, { status: 'building', swarm_run_id: run.id });
      toast({ title: 'Swarm dispatched', description: `${mapping.agents.length} agents working on: ${idea.title}` });
      loadIdeas(); loadCounts();
    } catch (e) {
      toast({ title: 'Failed to dispatch swarm', description: e.message, variant: 'destructive' });
    }
  };

  const handleReject = async (id) => {
    await base44.entities.Idea.update(id, { status: 'rejected' });
    loadIdeas(); loadCounts();
  };

  const handleCreate = async (data) => {
    await base44.entities.Idea.create(data);
    toast({ title: 'Idea proposed' });
    setComposing(false);
    loadIdeas(); loadCounts();
  };

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await base44.functions.invoke('scanGithubRepos', { scan: true });
      toast({ title: `Scanned ${res.data?.repoCount || 0} repos`, description: `${res.data?.ideasCreated || 0} ideas generated` });
      loadIdeas(); loadCounts();
    } catch {
      toast({ title: 'GitHub scan failed', description: 'Connect your GitHub account in the vault first', variant: 'destructive' });
    } finally { setScanning(false); }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-heading">Idea Engine</h1>
              <p className="text-xs text-muted-foreground">Proactive intelligence — approve ideas, dispatch swarms</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setComposing(c => !c)} className="gap-1.5">
              <Plus className="h-4 w-4" /> New Idea
            </Button>
            {githubConnected ? (
              <Button size="sm" onClick={handleScan} disabled={scanning} className="gap-1.5">
                {scanning ? <Sparkles className="h-4 w-4 animate-pulse" /> : <Github className="h-4 w-4" />}
                {scanning ? 'Scanning...' : 'Scan GitHub'}
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => navigate('/admin/vault')} className="gap-1.5">
                <Github className="h-4 w-4" /> Connect GitHub
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          {[
            { label: 'Proposed', value: counts.proposed, color: 'text-foreground' },
            { label: 'Approved', value: counts.approved, color: 'text-emerald-400' },
            { label: 'Completed', value: counts.completed, color: 'text-blue-400' },
          ].map(s => (
            <div key={s.label} className="flex-1 rounded-lg border border-border bg-card p-3">
              <div className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>

        {composing && <div className="mb-4"><IdeaComposer onCreate={handleCreate} onClose={() => setComposing(false)} /></div>}

        <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors whitespace-nowrap ${filter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Loading ideas...</div>
        ) : ideas.length === 0 ? (
          <div className="text-center py-16">
            <Lightbulb className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No ideas yet. Propose one or scan your GitHub repos.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ideas.map(idea => (
              <IdeaCard key={idea.id} idea={idea} onApprove={handleApprove} onReject={handleReject} onView={() => navigate('/swarm-nexus')} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}