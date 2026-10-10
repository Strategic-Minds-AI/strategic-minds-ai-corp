// Shared cron handler — routes to Base44 backend functions.
// Each cron file imports this and passes its route config.
const CRON_SECRET = process.env.CRON_SECRET || process.env.WORKER_SECRET;

export async function handleCron(req: Request, fn: string, payload: any): Promise<Response> {
  const auth = req.headers.get('authorization');
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized cron' }, { status: 401 });
  }
  try {
    const { base44 } = await import('../../src/api/base44Client.js');
    const result = await base44.functions.invoke(fn, payload);
    return Response.json({ ok: true, function: fn, result: result.data });
  } catch (error: any) {
    return Response.json({ ok: false, function: fn, error: error.message }, { status: 500 });
  }
}