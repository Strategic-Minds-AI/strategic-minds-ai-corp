import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const CATEGORY_ICONS = { Admin: '📋', Discovery: '🔍', Setup: '⚙️', Communication: '💬', Delivery: '🚀' };
const CATEGORIES = ['Admin', 'Discovery', 'Setup', 'Communication', 'Delivery'];

export default function OnboardingChecklist({ tasks, onToggleTask }) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        <p className="text-3xl mb-3">📋</p>
        <p>No checklist yet.</p>
        <p className="text-xs mt-1">Click "Initialize Checklist" to auto-generate from your master template.</p>
      </div>
    );
  }
  return (
    <div className="space-y-5">
      {CATEGORIES.map(cat => {
        const catTasks = tasks.filter(t => t.category === cat);
        if (catTasks.length === 0) return null;
        const completed = catTasks.filter(t => t.status === 'Completed').length;
        return (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-sm">{CATEGORY_ICONS[cat]}</span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{cat}</span>
              <span className="text-[11px] text-muted-foreground ml-auto">{completed}/{catTasks.length}</span>
            </div>
            <div className="space-y-0.5">
              {catTasks.map(task => (
                <motion.div key={task.id} layout className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group">
                  <button
                    onClick={() => onToggleTask(task.id, task.status === 'Completed' ? 'Not Started' : 'Completed')}
                    className={`w-5 h-5 rounded-md border flex-shrink-0 flex items-center justify-center transition-all ${task.status === 'Completed' ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30 hover:border-primary'}`}
                  >
                    {task.status === 'Completed' && <Check className="w-3 h-3" />}
                  </button>
                  <span className={`text-sm flex-1 transition-colors ${task.status === 'Completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{task.title}</span>
                  {task.due_date && <span className="text-[11px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">{task.due_date}</span>}
                  {task.google_action_completed && <span className="w-1.5 h-1.5 rounded-full bg-chart-2" title="Google action triggered" />}
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}