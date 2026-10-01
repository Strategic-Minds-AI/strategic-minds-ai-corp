import { useState } from 'react';
import { Download, X, Share } from 'lucide-react';
import usePWAInstall from './usePWAInstall';

export default function InsiderInstallBar() {
  const { canInstall, installed, isIOS, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  if (installed || dismissed) return null;

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSHelp(true);
    } else if (canInstall) {
      await promptInstall();
    } else {
      setShowIOSHelp(true);
    }
  };

  return (
    <div className="sticky top-0 z-30 border-b border-blue-100 bg-blue-50 px-4 py-2.5 dark:border-blue-900/50 dark:bg-blue-950/60">
      <div className="mx-auto flex max-w-md items-center gap-3">
        <Download size={18} className="shrink-0 text-blue-600 dark:text-blue-400" />
        <p className="flex-1 text-xs font-medium text-blue-900 dark:text-blue-100">
          {canInstall ? 'Install the Insider app for offline access.' : isIOS ? 'Add to Home Screen for the full app experience.' : 'Install for offline access and updates.'}
        </p>
        <button onClick={handleInstall} className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700">
          Install
        </button>
        <button aria-label="Dismiss" onClick={() => setDismissed(true)} className="text-blue-400 hover:text-blue-600">
          <X size={16} />
        </button>
      </div>
      {showIOSHelp && (
        <div className="mx-auto mt-2 max-w-md rounded-lg bg-white p-3 text-xs text-slate-600 shadow-md dark:bg-slate-800 dark:text-slate-300">
          <p className="mb-1 font-semibold text-slate-900 dark:text-white">How to install on iPhone/iPad:</p>
          <ol className="ml-4 list-decimal space-y-0.5">
            <li>Tap the <Share size={12} className="inline" /> Share button in Safari's toolbar</li>
            <li>Scroll down and tap "Add to Home Screen"</li>
            <li>Tap "Add" — the Insider app appears on your home screen</li>
          </ol>
          <button onClick={() => setShowIOSHelp(false)} className="mt-2 text-blue-600 font-medium">Got it</button>
        </div>
      )}
    </div>
  );
}