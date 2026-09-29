import GoogleDriveRecent from './GoogleDriveRecent';
import GooglePersonalCalendar from './GooglePersonalCalendar';
export default function GoogleWorkspacePanel() {
  return <div className="mx-auto max-w-4xl space-y-5"><div><h1 className="mb-2 text-2xl">Google Workspace</h1><p className="text-sm text-muted-foreground">Agency files use the shared Drive connection. Calendar uses your own Google account.</p></div><GoogleDriveRecent/><GooglePersonalCalendar/></div>;
}