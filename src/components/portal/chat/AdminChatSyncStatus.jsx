export default function AdminChatSyncStatus({ loading, busy, error, onRetry }) {
  return <div className="border-b border-border bg-background px-5 py-2 pl-16 text-xs text-muted-foreground" role={error ? 'alert' : 'status'}>
    {loading ? 'Loading and synchronizing your conversation history…' : busy ? 'Saving conversation history…' : error ? <>{error} <button type="button" onClick={onRetry} className="ml-2 text-primary underline">Retry synchronization</button></> : 'Conversation history is saved to your account and synchronized across devices.'}
  </div>;
}