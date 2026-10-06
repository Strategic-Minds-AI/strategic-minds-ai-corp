import { motion } from 'framer-motion';

export default function OnboardingProgress({ tasks }) {
  const done = tasks.filter(t => t.status === 'Completed').length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="font-semibold text-sm mb-4 text-foreground">Progress</h3>
      <div className="flex items-end justify-between mb-2">
        <span className="text-muted-foreground text-sm">Completed</span>
        <span className="font-bold text-lg text-foreground">{done}/{total}</span>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden mb-3">
        <motion.div className="h-full bg-primary rounded-full" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
      </div>
      <p className={`text-xs font-semibold ${pct === 100 ? 'text-primary' : pct >= 50 ? 'text-chart-3' : 'text-muted-foreground'}`}>
        {pct === 100 ? 'Onboarding complete!' : pct >= 50 ? 'Halfway there' : 'Just getting started'}
      </p>
      {total > 0 && (
        <div className="mt-5 pt-4 border-t border-border space-y-2">
          {['Admin', 'Discovery', 'Setup', 'Communication', 'Delivery'].map(cat => {
            const catTasks = tasks.filter(t => t.category === cat);
            if (catTasks.length === 0) return null;
            const catDone = catTasks.filter(t => t.status === 'Completed').length;
            const catPct = Math.round((catDone / catTasks.length) * 100);
            return (
              <div key={cat} className="flex items-center gap-2 text-xs">
                <span className="w-20 text-muted-foreground truncate">{cat}</span>
                <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary/60 rounded-full" style={{ width: `${catPct}%` }} /></div>
                <span className="text-muted-foreground w-8 text-right">{catPct}%</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}