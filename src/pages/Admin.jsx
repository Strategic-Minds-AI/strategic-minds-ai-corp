import { Link } from 'react-router-dom';
import { Vault, LayoutGrid, Settings2, ArrowUpRight } from 'lucide-react';
import AdminShell from '@/components/portal/AdminShell';
import { useAuth } from '@/lib/AuthContext';
const tools = [
  { title: 'Secure vault', description: 'Save passwords, API keys, account details and private notes in your encrypted vault.', to: '/admin/vault', icon: Vault, action: 'Open vault' },
  { title: 'Business tools', description: 'Manage your clients, projects, CRM, orders, content and connected systems.', to: '/portal?view=dashboard', icon: LayoutGrid, action: 'Open business tools' },
  { title: 'Supabase setup', description: 'Open the existing account configuration console and review setup results.', to: '/portal?view=bootstrap', icon: Settings2, action: 'Open setup console' },
];
export default function Admin() {
  const { user } = useAuth();
  return <AdminShell><div className="mb-8"><p className="agency-eyebrow mb-2">ADMINISTRATION</p><h1 className="mb-3">Admin dashboard</h1><p className="text-muted-foreground">Signed in as {user?.email}. Your vault and management tools are here.</p></div><div className="grid gap-5 lg:grid-cols-3">{tools.map(tool => <Link key={tool.to} to={tool.to} className="flex flex-col rounded-xl border border-border bg-card p-6 hover:border-primary"><tool.icon size={30} className="mb-6 text-primary" aria-hidden="true"/><h2 className="mb-3 text-xl">{tool.title}</h2><p className="mb-7 text-sm leading-relaxed text-muted-foreground">{tool.description}</p><span className="mt-auto flex items-center justify-between text-sm font-semibold text-primary">{tool.action}<ArrowUpRight size={18}/></span></Link>)}</div></AdminShell>;
}