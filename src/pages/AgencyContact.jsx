import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import LeadCaptureForm from '@/components/agency/LeadCaptureForm';

export default function AgencyContact() {
  useEffect(() => { document.title = 'Start a conversation — Strategic Minds AI'; }, []);
  return <main className="agency-container py-14 lg:py-24"><Link to="/" className="mb-12 inline-flex items-center gap-2 text-xs text-muted-foreground"><ArrowLeft size={14} /> Back to home</Link><div className="grid gap-12 lg:grid-cols-2 lg:gap-24"><div><p className="agency-eyebrow mb-6">LET'S FIND YOUR NEXT MOVE</p><h1 className="mb-8 font-display text-4xl font-normal leading-tight tracking-tight md:text-5xl">Better starts with<br /><em className="text-primary">a conversation.</em></h1><p className="max-w-md text-sm leading-relaxed">Tell us where you are, where you want to go, and what stands in the way. We'll start with the questions that matter.</p><div className="mt-10 border-t border-border pt-6 text-xs leading-loose">AI strategy & advisory<br />Intelligent automation & agents<br />Data intelligence & custom AI systems</div></div><div className="border border-border bg-card p-6 md:p-9"><LeadCaptureForm formType="contact" /></div></div></main>;
}