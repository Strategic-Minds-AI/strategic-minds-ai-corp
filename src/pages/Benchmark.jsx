import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import BenchmarkWorkspace from '@/components/portal/benchmark/BenchmarkWorkspace';
export default function Benchmark() {
  const { user } = useAuth(); const [projects, setProjects] = useState([]); const [error, setError] = useState('');
  useEffect(() => {
    if (user?.role !== 'admin') return;
    base44.entities.ClientProject.list('-created_date', 100).then(setProjects).catch(failure => setError(failure.message || 'Could not load project destinations.'));
  }, [user?.role]);
  return <main className="fixed inset-0 z-50 overflow-y-auto bg-background font-body text-foreground"><header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-5 py-4"><Link to="/portal" className="text-xs text-primary underline">Back to admin</Link><Link to="/portal" aria-label="Close benchmark page" className="rounded-lg p-2 hover:bg-muted"><X size={20}/></Link></header><div className="p-5 md:p-8">{error && <p role="alert" className="mb-4 text-sm text-destructive">{error}</p>}<BenchmarkWorkspace projects={projects}/></div></main>;
}