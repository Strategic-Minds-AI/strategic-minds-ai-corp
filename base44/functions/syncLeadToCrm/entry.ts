import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const SOURCE_MAP = {
  contact: 'Website contact form',
  quotation: 'Website quotation form',
  newsletter: 'Newsletter signup',
  newsletter_v2: 'Newsletter signup',
  pricing: 'Pricing inquiry',
  search: 'Site search',
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const leadId = body.lead_id || body.entity_id;
    if (!leadId) return Response.json({ error: 'lead_id required' }, { status: 400 });

    let lead;
    try { lead = await base44.asServiceRole.entities.Lead.get(leadId); }
    catch { return Response.json({ ok: true, skipped: 'lead not found' }); }
    if (!lead) return Response.json({ ok: true, skipped: 'lead not found' });

    const name = (lead.name || '').trim();
    const email = (lead.email || '').trim().toLowerCase();
    if (!name || !email) return Response.json({ ok: true, skipped: 'no contact info' });

    const existing = await base44.asServiceRole.entities.CrmContact.filter({ source_id: leadId });
    if (existing.length > 0) return Response.json({ ok: true, skipped: 'already exists' });

    const source = SOURCE_MAP[lead.form_type] || `Website ${lead.form_type} form`;
    const noteParts = [
      lead.message, lead.service && `Service: ${lead.service}`,
      lead.website && `Website: ${lead.website}`, lead.phone && `Phone: ${lead.phone}`,
      lead.query && `Search query: ${lead.query}`, lead.plan_title && `Plan: ${lead.plan_title}`,
    ].filter(Boolean);
    const notes = noteParts.join('\n');

    await base44.asServiceRole.entities.CrmContact.create({
      name, email,
      phone: lead.phone || '',
      notes,
      source,
      source_id: leadId,
      status: 'new',
      follow_up_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      follow_up_subject: 'Following up from Strategic Minds AI',
      follow_up_body: `Hi ${name.split(' ')[0]},\n\nThank you for your interest in Strategic Minds AI. I wanted to follow up and see if a short strategy conversation would be helpful. You can reach us directly at +1 772-209-0266, or reply with a good time to connect.\n\nBest,\nStrategic Minds AI`,
      follow_up_status: 'paused',
    });

    return Response.json({ ok: true, created: true });
  } catch (error) {
    console.error('syncLeadToCrm failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}