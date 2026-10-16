# Website Factory Safe Bidirectional Sync Contract
Status: DESIGN/DRAFT. No live watcher, scheduler, webhook or automatic two-way sync is installed by this file.

## Endpoints
- GitHub is canonical for code and configuration, never synchronized blindly from Drive.
- Approved Google Drive is canonical for approved source packets, brand decisions and QA evidence.
- Local authorized Strategic Minds OS folder is the editable staging mirror.
- Supabase is canonical for structured state/queues/receipts; never copy database dumps to Drive.
- Vercel and Railway are runtime read-back/evidence providers, not writable file-sync peers.

## Reconciliation cycle (reuse existing X1 five-minute supervisor, subject to verified config)
1. Restore canonical manifest; verify access, project identity and sync lease.
2. Read local and Drive item IDs, revisions, SHA-256 hashes, updated times and last synced SHA.
3. Classify for each item: IN_SYNC, LOCAL_AHEAD, CLOUD_AHEAD, CONFLICT, UNTRACKED, MISSING, UNAUTHORIZED.
4. One-side delta: copy nonsecret approved document as an immutable version, and verify by re-reading content and checksum.
5. Both-side deltas: quarantine conflict, preserve both versions, request resolution; never last-write-wins silently.
6. Unapproved new cloud file, privacy conflict or binary ambiguity: HOLD, do not propagate.
7. No deletes, renames, unapproved permission changes, production merges or deployments from sync.
8. Append receipt with item ID, source revision, destination revision, hashes, action, actor, validation, rollback pointer, timestamp.
9. Escalate repeated failures; do not spawn new independent schedules or workers.

## Gate before activating
Verify local filesystem path, Drive account/folder ID, connector permissions, whether Drive Desktop/rclone is already configured, service identity, existing X1 heartbeat, scope of synced extensions and conflict owner.
Perform bidirectional dry-run with one harmless test file each direction, independently read back both. Only then enable the existing verified scheduler path. Never imply two-way live sync before these pass.
