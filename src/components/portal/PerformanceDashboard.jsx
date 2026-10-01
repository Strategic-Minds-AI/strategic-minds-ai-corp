import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { TrendingUp, Users, FileText, DollarSign, MousePointerClick, Eye } from 'lucide-react';

const PIE_COLORS = ['#2196f3', '#1565c0', '#42a5f5', '#90caf9', '#64b5f6', '#bbdefb'];

export default function PerformanceDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const res = await base44.functions.invoke('dashboardMetrics', {});
      setData(res.data);
      setError('');
    } catch (e) { setError(e.response?.data?.error || e.message || 'Could not load dashboard.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  if (loading) return <p role="status">Loading dashboard…</p>;
  if (error) return <p role="alert" className="text-sm text-destructive">{error} <button className="underline" onClick={refresh}>Retry</button></p>;
  if (!data) return null;

  const totalLeads = (data.leads.by_type || []).reduce((s, r) => s + (r.count || 0), 0);
  const totalCrm = (data.crm.by_status || []).reduce((s, r) => s + (r.count || 0), 0);
  const totalRevenue = (data.commerce.by_status || []).reduce((s, r) => s + (r.sum_amount_cents || 0), 0) / 100;
  const totalOrders = (data.commerce.by_status || []).reduce((s, r) => s + (r.count || 0), 0);
  const totalGscClicks = (data.traffic || []).reduce((s, t) => s + (t.gsc_clicks || 0), 0);
  const totalGscImpressions = (data.traffic || []).reduce((s, t) => s + (t.gsc_impressions || 0), 0);
  const totalGa4Users = (data.traffic || []).reduce((s, t) => s + (t.ga4_users || 0), 0);

  const kpis = [
    { label: 'Total Leads', value: totalLeads, icon: TrendingUp, sub: `${(data.leads.by_type || []).length} form types` },
    { label: 'CRM Contacts', value: totalCrm, icon: Users, sub: `${(data.crm.by_status || []).filter(r => r.status === 'new').reduce((s, r) => s + r.count, 0)} new` },
    { label: 'Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, sub: `${totalOrders} orders` },
    { label: 'Blog Posts', value: data.content?.posts || 0, icon: FileText, sub: `${data.content?.projects || 0} case studies` },
  ];

  const leadTrendData = (data.leads.trend || []).map(r => ({ date: new Date(r.created_date).toLocaleDateString('en', { month: 'short', day: 'numeric' }), leads: r.count }));
  const crmPieData = (data.crm.by_status || []).map(r => ({ name: r.status, value: r.count }));
  const commerceData = (data.commerce.by_status || []).map(r => ({ name: r.status, count: r.count, revenue: (r.sum_amount_cents || 0) / 100 }));

  return <div className="space-y-6">
    <div>
      <h2 className="mb-1 text-xl">Performance Dashboard</h2>
      <p className="text-sm text-muted-foreground">Key growth metrics across leads, CRM, traffic, and revenue. <button onClick={refresh} className="text-primary underline">Refresh</button></p>
    </div>

    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map(k => <div key={k.label} className="rounded-lg border border-border bg-card p-5">
        <div className="mb-2 flex items-center justify-between"><span className="text-xs text-muted-foreground">{k.label}</span><k.icon size={18} className="text-primary" /></div>
        <p className="text-2xl font-bold text-foreground">{k.value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{k.sub}</p>
      </div>)}
    </div>

    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="mb-4 text-sm font-medium">Leads (last 30 days)</h3>
        {leadTrendData.length > 0 ? <ResponsiveContainer width="100%" height={220}><LineChart data={leadTrendData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} allowDecimals={false} /><Tooltip contentStyle={{ fontSize: 12 }} /><Line type="monotone" dataKey="leads" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer> : <p className="py-8 text-center text-sm text-muted-foreground">No leads in the last 30 days.</p>}
      </div>
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="mb-4 text-sm font-medium">CRM Contacts by Status</h3>
        {crmPieData.length > 0 ? <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={crmPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={{ fontSize: 11 }}>{crmPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}</Pie><Tooltip contentStyle={{ fontSize: 12 }} /><Legend wrapperStyle={{ fontSize: 11 }} /></PieChart></ResponsiveContainer> : <p className="py-8 text-center text-sm text-muted-foreground">No CRM contacts yet.</p>}
      </div>
    </div>

    {(data.traffic || []).length > 0 && <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="mb-4 text-sm font-medium">Traffic &amp; SEO (latest snapshot per domain)</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded bg-muted p-4"><p className="flex items-center gap-1.5 text-xs text-muted-foreground"><MousePointerClick size={14}/> GSC Clicks</p><p className="text-xl font-bold">{totalGscClicks.toLocaleString()}</p></div>
        <div className="rounded bg-muted p-4"><p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Eye size={14}/> GSC Impressions</p><p className="text-xl font-bold">{totalGscImpressions.toLocaleString()}</p></div>
        <div className="rounded bg-muted p-4"><p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Users size={14}/> GA4 Users</p><p className="text-xl font-bold">{totalGa4Users.toLocaleString()}</p></div>
        <div className="rounded bg-muted p-4"><p className="text-xs text-muted-foreground">Domains Tracked</p><p className="text-xl font-bold">{(data.traffic || []).length}</p></div>
      </div>
      {(data.traffic || []).map(t => <div key={t.domain} className="mt-3 flex flex-wrap gap-4 border-t border-border pt-3 text-xs text-muted-foreground"><strong className="text-foreground">{t.domain}</strong><span>Clicks: {t.gsc_clicks || 0}</span><span>Impr: {t.gsc_impressions || 0}</span><span>Users: {t.ga4_users || 0}</span><span>Sessions: {t.ga4_sessions || 0}</span><span>Position: {(t.gsc_position || 0).toFixed(1)}</span></div>)}
    </div>}

    {commerceData.length > 0 && <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="mb-4 text-sm font-medium">Orders by Status</h3>
      <ResponsiveContainer width="100%" height={200}><BarChart data={commerceData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} allowDecimals={false} /><Tooltip contentStyle={{ fontSize: 12 }} /><Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
    </div>}
  </div>;
}