import { createClientFromRequest } from '../../shared/ownedClient.ts';

export default async function(req) {
  try {
    if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const body = await req.json();
    if (!['listContacts', 'saveContact', 'listCalendar', 'createCall'].includes(body.action)) return Response.json({ error: 'Unknown action' }, { status: 400 });
    const contactsAction = ['listContacts', 'saveContact'].includes(body.action);
    const { accessToken } = await base44.asServiceRole.connectors.getConnection(contactsAction ? 'google_contacts' : 'googlecalendar');
    let url, options = { headers: { Authorization: `Bearer ${accessToken}` } };
    if (body.action === 'listContacts') {
      url = 'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers&pageSize=50';
    } else if (body.action === 'saveContact') {
      const contact = await base44.entities.CrmContact.get(String(body.contactId || ''));
      if (!contact || !contact.email) return Response.json({ error: 'Contact not found' }, { status: 404 });
      if (contact.google_resource_name) return Response.json({ resourceName: contact.google_resource_name });
      url = 'https://people.googleapis.com/v1/people:createContact';
      options = { method: 'POST', headers: { ...options.headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ names: [{ givenName: contact.name }], emailAddresses: [{ value: contact.email }], ...(contact.phone ? { phoneNumbers: [{ value: contact.phone }] } : {}) }) };
    } else if (body.action === 'listCalendar') {
      url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(new Date().toISOString())}&maxResults=100&singleEvents=true&orderBy=startTime`;
    } else {
      const contact = await base44.entities.CrmContact.get(String(body.contactId || ''));
      const start = new Date(body.start);
      if (!contact || !contact.email || !Number.isFinite(start.getTime()) || start.getTime() < Date.now()) return Response.json({ error: 'Choose a contact and future time' }, { status: 400 });
      const end = new Date(start.getTime() + 30 * 60 * 1000);
      url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all';
      options = { method: 'POST', headers: { ...options.headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ summary: `Strategy call with ${contact.name}`, description: `Strategy call. Reach us at +1 772-209-0266.${contact.phone ? ` Contact: ${contact.phone}` : ''}`, start: { dateTime: start.toISOString() }, end: { dateTime: end.toISOString() }, attendees: [{ email: contact.email }] }) };
    }
    const response = await fetch(url, options);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message || 'Google request failed');
    if (body.action === 'saveContact') await base44.entities.CrmContact.update(body.contactId, { google_resource_name: result.resourceName });
    if (body.action === 'createCall') await base44.entities.CrmContact.update(body.contactId, { calendar_event_id: result.id, status: 'contacted' });
    if (body.action === 'listContacts') return Response.json({ contacts: (result.connections || []).filter(p => p.emailAddresses?.[0]?.value).map(p => ({ name: p.names?.[0]?.displayName || p.emailAddresses[0].value, email: p.emailAddresses[0].value, phone: p.phoneNumbers?.[0]?.value || '', resourceName: p.resourceName })) });
    if (body.action === 'listCalendar') return Response.json({ events: (result.items || []).map(e => ({ id: e.id, title: e.summary, start: e.start?.dateTime || e.start?.date, url: e.htmlLink })) });
    return Response.json({ ok: true, id: result.id, resourceName: result.resourceName });
  } catch (error) {
    console.error('CRM Google request failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}