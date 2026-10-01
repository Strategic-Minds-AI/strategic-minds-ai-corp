import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';

export default function SandboxHealthBadge({ sandbox }) {
  const status = sandbox.health_status || 'unknown';
  const lastBeat = sandbox.last_heartbeat_at;

  const config = {
    healthy: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-500/10', label: 'Healthy' },
    degraded: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-500/10', label: 'Degraded' },
    offline: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Offline' },
    unknown: { icon: HelpCircle, color: 'text-muted-foreground', bg: 'bg-muted', label: 'No heartbeat' },
  };

  const { icon: Icon, color, bg, label } = config[status] || config.unknown;

  const ageText = (() => {
    if (!lastBeat) return 'never';
    const ageMin = Math.floor((Date.now() - new Date(lastBeat).getTime()) / 60000);
    if (ageMin < 1) return 'just now';
    if (ageMin < 60) return `${ageMin}m ago`;
    const ageHr = Math.floor(ageMin / 60);
    return `${ageHr}h ago`;
  })();

  return (
    <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${bg} ${color}`}>
      <Icon size={11} className={status === 'healthy' ? 'animate-pulse' : ''} />
      <span>{label}</span>
      <span className="font-normal normal-case opacity-70">· {ageText}</span>
    </div>
  );
}