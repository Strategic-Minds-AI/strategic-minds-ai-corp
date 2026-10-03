import { createClientFromRequest } from '../../shared/ownedClient.ts';

export default async function(req) {
  try {
    if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in required' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const { orderId, clientId } = await req.json();
    const order = typeof orderId === 'string' ? await base44.entities.CommerceOrder.get(orderId) : null;
    const client = typeof clientId === 'string' ? await base44.entities.User.get(clientId) : null;
    if (!order || order.status !== 'paid_awaiting_approval' || !client || client.role !== 'user' || client.email?.toLowerCase() !== order.customer_email) return Response.json({ error: 'Choose the registered client matching the paid order email.' }, { status: 400 });
    // An already linked project is reused if approval is retried after a partial save.
    let projectId = order.project_id;
    if (!projectId) {
      const project = await base44.entities.ClientProject.create({ title: order.item_title, client_id: client.id, status: 'Planning', progress_note: 'Purchase approved. Provisioning awaits setup.' });
      projectId = project.id;
      await base44.entities.CommerceOrder.update(order.id, { project_id: projectId });
    }
    await base44.entities.CommerceOrder.update(order.id, { status: 'approved', client_id: client.id });
    return Response.json({ project_id: projectId });
  } catch (error) { console.error('Order approval failed:', error.message); return Response.json({ error: 'Could not approve this order.' }, { status: 500 }); }
}