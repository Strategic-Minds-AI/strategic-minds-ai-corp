import React from 'react';
import { Check, X, ArrowRight, TrendingUp, Clock, AlertTriangle, GitBranch, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CATEGORY_COLORS = {
  feature: 'text-emerald-400',
  refactor: 'text-blue-400',
  bugfix: 'text-red-400',
  research: 'text-purple-400',
  infrastructure: 'text-amber-400',
  content: 'text-cyan-400',
  growth: 'text-pink-400',
  security: 'text-orange-400',
};

const SOURCE_ICONS = { github: GitBranch, manual: Lightbulb, web: Lightbulb, metrics: Lightbulb, agent: Lightbulb };

export default function IdeaCard({ idea, onApprove, onReject, onView }) {
  const priority = idea.impact_score - idea.effort_score - idea.risk_score;
  const SourceIcon = SOURCE_ICONS[idea.source] || Lightbulb;
  const isProposed = idea.status === 'proposed';

  return (
    <div className="rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <SourceIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <h3 className="font-semibold text-sm truncate">{idea.title}</h3>
        </div>
        <span className={`text-xs font-mono font-bold shrink-0 ${priority > 0 ? 'text-emerald-400' : 'text-muted-foreground'}`}>
          {priority > 0 ? '+' : ''}{priority}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-3" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {idea.description}
      </p>
      <div className="flex items-center gap-3 mb-3 text-xs flex-wrap">
        <span className={`font-semibold ${CATEGORY_COLORS[idea.category]}`}>{idea.category}</span>
        <span className="flex items-center gap-1 text-muted-foreground"><TrendingUp className="h-3 w-3" />{idea.impact_score}</span>
        <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" />{idea.effort_score}</span>
        <span className="flex items-center gap-1 text-muted-foreground"><AlertTriangle className="h-3 w-3" />{idea.risk_score}</span>
        {idea.source_ref && <span className="text-muted-foreground/70 font-mono truncate">{idea.source_ref}</span>}
      </div>
      <div className="flex gap-2 items-center">
        {isProposed ? (
          <>
            <Button size="sm" onClick={() => onApprove(idea)} className="gap-1.5">
              <Check className="h-3.5 w-3.5" /> Approve & Build
            </Button>
            <Button size="sm" variant="outline" onClick={() => onReject(idea.id)} className="gap-1.5">
              <X className="h-3.5 w-3.5" /> Reject
            </Button>
          </>
        ) : (
          <span className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">{idea.status}</span>
        )}
        {idea.swarm_run_id && (
          <Button size="sm" variant="ghost" onClick={() => onView(idea.swarm_run_id)} className="gap-1.5 ml-auto">
            View Swarm <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}