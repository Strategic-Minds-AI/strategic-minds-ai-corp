// Owned runtime: enqueue due scheduled operator tasks.
import { createClientFromRequest } from '../../shared/ownedClient.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const client = createClientFromRequest(req);
    const user = await client.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Administrator access required' }, { status: 403 });

    const res = await client.entities.OperatorSchedule.filter({ enabled: true }, { sort: 'created_date', limit: 50 });
    const schedules = res.items || [];
    const now = new Date(), minute = now.getUTCMinutes(), hour = now.getUTCHours();
    const slot = new Date(Math.floor(now.getTime() / 300000) * 300000).toISOString();
    let enqueued = 0;

    for (const item of schedules) {
      const due = (item.cron === '*/15 * * * *' && minute % 15 < 5) || (item.cron === '0 * * * *' && minute < 5) || (item.cron === '0 9 * * *' && hour === 9 && minute < 5);
      if (!due) continue;
      const existsRes = await client.entities.OperatorTask.filter({ schedule_id: item.id, schedule_slot: slot }, { sort: '-created_date', limit: 1 });
      if ((existsRes.items || []).length) continue;
      await client.entities.OperatorTask.create({
        title: item.title,
        instructions: item.instructions,
        target: item.target,
        status: 'queued',
        source: 'schedule',
        schedule_id: item.id,
        schedule_slot: slot,
        ...(item.account_id ? { account_id: item.account_id } : {}),
      });
      await client.entities.OperatorSchedule.update(item.id, { last_enqueued_at: now.toISOString() });
      enqueued++;
    }
    return Response.json({ enqueued, checked: schedules.length, note: 'Queue only. No computer or browser actions are executed.' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}