// Owned runtime: pair, pause, resume, revoke operator devices.
import { createClientFromRequest } from '../../shared/ownedClient.ts';
import { hashToken, publicDevice } from '../../shared/operatorActions.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const client = createClientFromRequest(req);
    const user = await client.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Administrator access required' }, { status: 403 });

    const body = await req.json();
    const op = body.operation;

    if (op === 'list') {
      const res = await client.entities.OperatorDevice.filter({ created_by_id: user.id }, { sort: '-created_date', limit: 50 });
      return Response.json({ devices: (res.items || []).map(publicDevice) });
    }

    if (op === 'create') {
      const name = String(body.name || '').trim();
      if (!name || name.length > 80) return Response.json({ error: 'Enter a device name up to 80 characters.' }, { status: 400 });
      const existingRes = await client.entities.OperatorDevice.filter({ created_by_id: user.id, revoked: false }, { sort: '-created_date', limit: 10 });
      if ((existingRes.items || []).length >= 10) return Response.json({ error: 'Revoke an unused device before pairing another (10-device limit).' }, { status: 400 });
      const token = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(v => v.toString(16).padStart(2, '0')).join('');
      const device = await client.entities.OperatorDevice.create({
        name,
        token_hash: await hashToken(token),
        expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
        enabled: true,
        revoked: false,
      });
      return Response.json({ device: publicDevice(device), token });
    }

    if (!['pause', 'resume', 'revoke'].includes(op)) return Response.json({ error: 'Unknown operation' }, { status: 400 });

    const device = await client.entities.OperatorDevice.get(String(body.device_id || ''));
    if (!device || device.created_by_id !== user.id) return Response.json({ error: 'Device not found' }, { status: 404 });
    if (device.revoked) return Response.json({ error: 'This pairing is revoked. Create a new pairing.' }, { status: 409 });

    const updated = await client.entities.OperatorDevice.update(device.id,
      op === 'revoke' ? { enabled: false, revoked: true, token_hash: '' } : { enabled: op === 'resume' }
    );
    if (op !== 'resume') {
      await client.entities.ComputerCommand.updateMany(
        { device_id: device.id, status: 'queued' },
        { $set: { status: 'cancelled', result: 'Stopped by device owner.', finished_at: new Date().toISOString() } }
      );
    }
    return Response.json({ device: publicDevice(updated) });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}