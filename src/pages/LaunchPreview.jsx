import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function LaunchPreview() {
  const { campaignId } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke('dominanceEngine', { action: 'getStatus', campaign_id: campaignId });
        if (res.data?.error) throw new Error(res.data.error);
        setCampaign(res.data);
      } catch (e) {
        setError(e.message);
      }
      setLoading(false);
    })();
  }, [campaignId]);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (error || !campaign) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8 text-center">
      <AlertCircle className="h-10 w-10 text-destructive" />
      <p className="text-sm text-muted-foreground">{error || 'Campaign not found'}</p>
      <Link to="/mass-launch" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Back to Mass Launch</Link>
    </div>
  );

  const html = campaign.generated_html || '';

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex min-h-12 items-center gap-3 border-b border-border bg-background px-4 py-2">
        <Link to="/mass-launch" className="rounded-lg p-2 text-foreground hover:bg-muted"><ArrowLeft size={18} /></Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{campaign.business_name || campaign.keyword}</p>
          <p className="truncate text-xs text-muted-foreground">{campaign.city}, {campaign.state} · {campaign.domain || 'No domain'}</p>
        </div>
        {campaign.vercel_deployment_url && (
          <a href={campaign.vercel_deployment_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted">
            <ExternalLink size={14} /> Live URL
          </a>
        )}
      </header>
      {html ? (
        <iframe srcDoc={html} title={`${campaign.business_name || campaign.keyword} preview`} className="flex-1 border-0" sandbox="allow-same-origin allow-scripts allow-forms allow-popups" />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No HTML generated yet for this campaign. The content flood phase may still be running.</p>
          <p className="text-xs text-muted-foreground">Current phase: {campaign.phase} · {campaign.current_step_description || ''}</p>
        </div>
      )}
    </div>
  );
}