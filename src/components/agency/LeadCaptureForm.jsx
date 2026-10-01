import { useId } from 'react';
import { ArrowUpRight, Loader2, CheckCircle2, Download } from 'lucide-react';
import useLeadSubmission from '@/components/agency/useLeadSubmission';
import downloadChecklist from '@/components/agency/checklistDownload';

export default function LeadCaptureForm({ formType = 'newsletter' }) {
  const prefix = useId();
  const isGuide = formType === 'newsletter';
  const { submit, pending, error, success } = useLeadSubmission(formType, isGuide ? downloadChecklist : undefined);
  if (success) return <div role="status" className="space-y-5 border border-border bg-card p-8"><CheckCircle2 className="text-primary" size={28} /><h3 className="mb-0 font-display text-2xl font-normal">{isGuide ? 'Your insider playbook is ready.' : 'Thank you for reaching out.'}</h3><p className="text-sm leading-relaxed">{isGuide ? 'Your details are saved and your PDF download has started. It includes seven insider secrets with worked examples, ready-to-use AI prompts, fillable worksheets, and a 30-day plan. The background image loads from the web, so the download may take a few seconds. Save it in a compatible PDF reader to keep your notes.' : 'Your inquiry has been saved. We look forward to learning more about your business.'}</p>{isGuide && <button onClick={downloadChecklist} className="agency-button"><Download size={16} /> Download playbook again</button>}</div>;
  return <form onSubmit={submit} className="space-y-5" aria-busy={pending}>
    <div className={isGuide ? 'grid gap-5 sm:grid-cols-2' : 'grid gap-5'}>
      <div><label htmlFor={`${prefix}-name`} className="text-xs font-medium text-foreground">Full name</label><input id={`${prefix}-name`} className="agency-input" name="name" autoComplete="name" placeholder="Alex Morgan" required maxLength={120} disabled={pending} /></div>
      <div><label htmlFor={`${prefix}-email`} className="text-xs font-medium text-foreground">Email address</label><input id={`${prefix}-email`} className="agency-input" name="email" type="email" autoComplete="email" placeholder="alex@company.com" required maxLength={254} disabled={pending} /></div>
    </div>
    {!isGuide && <div><label htmlFor={`${prefix}-message`} className="text-xs font-medium text-foreground">What would you like to achieve?</label><textarea id={`${prefix}-message`} className="agency-input min-h-36 resize-y" name="message" placeholder="Tell us about your business and what you have in mind." required minLength={6} maxLength={5000} disabled={pending} /></div>}
    <div className="hidden" aria-hidden="true"><label>Leave this empty<input name="company_url" tabIndex={-1} autoComplete="off" /></label></div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <button type="submit" disabled={pending} className="agency-button w-full justify-between">{pending ? 'Saving your details…' : isGuide ? 'Get the free insider playbook' : 'Send your inquiry'}{pending ? <Loader2 className="animate-spin" size={17} /> : <ArrowUpRight size={17} />}</button>
    <p className="text-[10px] leading-relaxed text-muted-foreground">{isGuide ? 'Free 13-page PDF playbook with real insider tactics. No account required. We use your full name and email to record your resource request.' : 'Your details are used to respond to this inquiry. Please don’t include passwords or confidential information.'}</p>
  </form>;
}