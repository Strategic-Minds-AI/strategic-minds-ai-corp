import { FileText, ListChecks } from 'lucide-react';
export default function AdminChatQuickTasks({ onChoose }) {
  return <div className="mt-5 border-t border-border pt-4"><p className="px-3 pb-2 text-xs font-semibold text-muted-foreground">Quick tasks</p>
    <button type="button" onClick={() => onChoose('notes')} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-consoleAccent hover:text-primary-foreground"><FileText size={16}/> Summarize client notes</button>
    <button type="button" onClick={() => onChoose('outline')} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-consoleAccent hover:text-primary-foreground"><ListChecks size={16}/> Project outline template</button>
  </div>;
}