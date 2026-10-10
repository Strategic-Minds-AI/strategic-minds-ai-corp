import { handleCron } from './_shared.ts';
export default function(req: Request) { return handleCron(req, 'enqueueOperatorSchedules', { action: 'enqueueAll' }); }