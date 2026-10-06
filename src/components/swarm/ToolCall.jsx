import { Wrench, Check, Loader2, AlertCircle } from 'lucide-react';
export default function ToolCall({ tool }) {
  const failed = ['failed','error'].includes(tool.status) || /error|failed/i.test(typeof tool.results === 'string' ? tool.results : JSON.stringify(tool.results || '')) || tool.results?.success === false;
  const active = ['pending','running','in_progress'].includes(tool.status);
  const projection = tool.display_projection;
  const label = projection ? (failed ? projection.error_label : active ? projection.active_label : projection.label) : null;
  const Icon = failed ? AlertCircle : active ? Loader2 : Check;
  return <div className="my-2 rounded-md border bg-background p-2.5 text-xs text-muted-foreground">
    <div className="flex items-center gap-2"><Wrench size={12}/><span className="min-w-0 flex-1 truncate">{label || tool.name || 'Tool call'}</span><Icon size={12} className={active ? 'animate-spin text-accent' : failed ? 'text-destructive' : 'text-primary'}/><span>{failed ? 'Failed' : active ? 'Working' : 'Finished'}</span></div>
    {!(projection?.hide_details && projection?.details_redacted) && <details className="mt-2"><summary className="cursor-pointer text-[10px]">Details</summary><pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-all font-mono text-[10px]">{tool.arguments_string || ''}{tool.results ? '\n' + (typeof tool.results === 'string' ? tool.results : JSON.stringify(tool.results, null, 2)) : ''}</pre></details>}
  </div>;
}