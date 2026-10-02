import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// ============================================================
// AUTH BRIDGE — lets the Railway backend service resolve who a
// caller is and fetch connector tokens, without moving auth off Base44.
//
// GET/POST with Authorization: Bearer <base44-token>
//   → { user: { id, email, role, full_name } }
// If header x-connector: <integration_type> is present, also returns
//   connectorToken for that connector (admin only).
// ============================================================

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const connectorType = req.headers.get('x-connector');
    let connectorToken: string | null = null;

    if (connectorType) {
      if (user.role !== 'admin') return Response.json({ error: 'Admin only for connector tokens' }, { status: 403 });
      try {
        const conn = await base44.asServiceRole.connectors.getConnection(connectorType);
        connectorToken = conn.accessToken;
      } catch (e: any) {
        return Response.json({ error: `Connector ${connectorType} not connected: ${e.message}` }, { status: 400 });
      }
    }

    return Response.json({
      user: { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
      connectorToken,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}