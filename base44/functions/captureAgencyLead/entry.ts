import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

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
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('supabase');
    const keysResponse = await fetch('https://api.supabase.com/v1/projects/jadlpbokfdkonvnfxjzs/api-keys', { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!keysResponse.ok) throw new Error('Could not access lead storage');
    const keys = await keysResponse.json();
    const key = keys.find((item) => item.name === 'service_role')?.api_key;
    if (!key) throw new Error('Lead storage key unavailable');
    const response = await fetch('https://jadlpbokfdkonvnfxjzs.supabase.co/rest/v1/agency_leads?on_conflict=id', {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'resolution=ignore-duplicates,return=minimal' },
      body: JSON.stringify({ id, form_type, name, email, message }),
    });
    if (!response.ok) throw new Error('Could not save submission');
    return Response.json({ ok: true });
  } catch (error) {
    console.error('Lead submission failed:', error.message);
    return Response.json({ error: 'We could not save your details. Please try again.' }, { status: 500 });
  }
}