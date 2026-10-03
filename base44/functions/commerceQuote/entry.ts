import { createClientFromRequest } from '../../shared/ownedClient.ts';

export default async function(req) {
  try {
    if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
    const base44 = createClientFromRequest(req);
    const { itemId, name, email, message } = await req.json();
    const item = typeof itemId === 'string' ? await base44.entities.CatalogItem.get(itemId) : null;
    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const cleanMessage = typeof message === 'string' ? message.trim() : '';
    if (!item?.active || item.kind !== 'quote' || cleanName.length < 2 || cleanName.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || cleanEmail.length > 254 || cleanMessage.length < 10 || cleanMessage.length > 3000) return Response.json({ error: 'Please enter your name, email and project details.' }, { status: 400 });
    await base44.asServiceRole.entities.CatalogQuote.create({ catalog_item_id: item.id, item_title: item.title, name: cleanName, email: cleanEmail, message: cleanMessage, status: 'new' });
    return Response.json({ ok: true });
  } catch (error) { console.error('Catalog quote failed:', error.message); return Response.json({ error: 'Could not send your request.' }, { status: 500 }); }
}