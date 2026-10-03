import { createClientFromRequest } from '../../shared/ownedClient.ts';

export default async function(req) {
  try {
    if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
    const raw = await req.text();
    if (raw.length > 10000) return Response.json({ error: 'Submission too large' }, { status: 413 });
    const body = JSON.parse(raw);
    if (body.company_url) return Response.json({ ok: true });
    const { id, form_type } = body;
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id || '') || !['newsletter', 'contact'].includes(form_type) || !name || name.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || message.length > 5000 || (form_type === 'contact' && message.length < 6)) {
      return Response.json({ error: 'Please check your name, email, and message.' }, { status: 400 });
    }
    // Intentionally public lead intake: insert-only, fixed project/table, no data is returned.
    const base44 = createClientFromRequest(req);
    const existingLead = await base44.asServiceRole.entities.Lead.get(id);
    if (!existingLead) await base44.asServiceRole.entities.Lead.create({ id, form_type, name, email, message });
    if (name && email) {
      try {
        const existing = await base44.asServiceRole.entities.CrmContact.filter({ source_id: id });
        if (!existing.length) await base44.asServiceRole.entities.CrmContact.create({
          name, email, notes: message || (form_type === 'newsletter' ? 'Newsletter signup' : ''), source: form_type === 'newsletter' ? 'Newsletter signup' : 'Website contact form', source_id: id, status: 'new',
          follow_up_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          follow_up_subject: 'Following up from Strategic Minds AI',
          follow_up_body: `Hi ${name.split(' ')[0]},\n\nThank you for reaching out to Strategic Minds AI. I wanted to follow up on your inquiry and see if a short strategy conversation would be helpful. You can reach us directly at +1 772-209-0266, or reply with a good time to connect.\n\nBest,\nStrategic Minds AI`,
          follow_up_status: 'paused',
        });
      } catch (crmError) { console.error('CRM intake failed:', crmError.message); }
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error('Lead submission failed:', error.message);
    return Response.json({ error: 'We could not save your details. Please try again.' }, { status: 500 });
  }
}