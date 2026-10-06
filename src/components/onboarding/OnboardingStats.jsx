import { motion } from 'framer-motion';
import { TrendingUp, Users, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function OnboardingStats({ stats }) {
  const cards = [
    { label: 'Total Clients', value: stats.total || 0, icon: <Users size={20} />, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Active Onboardings', value: stats.active || 0, icon: <TrendingUp size={20} />, color: 'text-chart-2', bg: 'bg-chart-2/10' },
    { label: 'Pipeline Value', value: `$${(stats.pipelineValue || 0).toLocaleString()}`, icon: <TrendingUp size={20} />, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Need Attention', value: stats.stuckClients?.length || 0, icon: <AlertTriangle size={20} />, color: stats.stuckClients?.length > 0 ? 'text-destructive' : 'text-muted-foreground', bg: stats.stuckClients?.length > 0 ? 'bg-destructive/10' : 'bg-muted' },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-card border border-border rounded-xl p-4 hover:border-primary/20 transition-colors"
        >
          <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center ${card.color} mb-3`}>{card.icon}</div>
          <div className="text-2xl font-bold tracking-tight text-foreground">{card.value}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{card.label}</div>
        </motion.div>
      ))}
    </div>
  );
}