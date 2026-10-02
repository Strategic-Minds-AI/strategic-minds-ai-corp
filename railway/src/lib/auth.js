// Auth bridge: validates the Base44 access token by calling the
// published app's authContext function. Auth stays on Base44;
// this service only resolves who the caller is.
//
// The frontend forwards its Base44 token as: Authorization: Bearer <token>
// This middleware calls the Base44 function to get { id, role, email }.

const BASE44_APP_URL = process.env.BASE44_APP_URL || 'https://strategic-ai-consulting.base44.app';

const cache = new Map(); // token -> { user, expires }

export async function resolveUser(req) {
  const auth = req.headers.get('authorization') || req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);

  // cache for 60s
  const cached = cache.get(token);
  if (cached && cached.expires > Date.now()) return cached.user;

  try {
    const res = await fetch(`${BASE44_APP_URL}/functions/authContext`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const user = data.user || null;
    if (user) cache.set(token, { user, expires: Date.now() + 60000 });
    return user;
  } catch {
    return null;
  }
}

export async function requireUser(req, res) {
  const user = await resolveUser(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  return user;
}

export async function requireAdmin(req, res) {
  const user = await resolveUser(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Admin only' });
    return null;
  }
  return user;
}