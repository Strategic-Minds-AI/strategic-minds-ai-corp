export async function requireAgencyAdmin(base44) {
  let user;
  try { user = await base44.auth.me(); } catch { return { response: Response.json({ error: 'Admin sign-in required.' }, { status: 403 }) }; }
  if (!user || user.role !== 'admin') return { response: Response.json({ error: 'Admin access required.' }, { status: 403 }) };
  return { user };
}