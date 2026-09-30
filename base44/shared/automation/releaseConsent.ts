import { setVariable } from './github.ts';
export async function authorizeLiveRelease(get, user) {
  if (user?.role !== 'admin') { const error = new Error('Admin approval required.'); error.status = 403; throw error; }
  const approval = { version: 1, mode: 'automatic_live_after_verified_checks', approved_by: user.id, approved_at: new Date().toISOString(), no_per_release_approval_required: true, bypass_checks_allowed: false, paid_execution_allowed: false, scope: 'Strategic-Minds-AI/strategic-minds-ai-corp' };
  await setVariable(get, 'BENCHMARK_LIVE_RELEASE_APPROVAL', JSON.stringify(approval));
  return approval;
}