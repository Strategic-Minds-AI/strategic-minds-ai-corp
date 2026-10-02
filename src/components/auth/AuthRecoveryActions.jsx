import { safeReturnTo } from '@/lib/authReturnTo';
export default function AuthRecoveryActions() {
  const destination = encodeURIComponent(safeReturnTo());
  return <div className="mt-6 space-y-3"><a className="agency-button w-full" href={`/register?returnTo=${destination}`}>Create an account with email</a><a className="inline-flex min-h-12 w-full items-center justify-center rounded-sm border border-border px-4 text-sm font-medium text-primary" href={`/login?returnTo=${destination}`}>Sign in with email and password</a></div>;
}