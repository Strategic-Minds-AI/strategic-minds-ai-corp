export default function AccountConnectionNotice({ error, setupUrl, onRetry }) {
  return <div role="alert" className="space-y-3 rounded-lg border border-border bg-muted p-4 text-sm">
    <p className="text-destructive">{error}</p>
    <div className="flex flex-wrap items-center gap-4">
      {setupUrl && <a href={setupUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-4">Open Vercel connection settings</a>}
      <button type="button" onClick={onRetry} className="text-primary underline underline-offset-4">Retry</button>
    </div>
  </div>;
}