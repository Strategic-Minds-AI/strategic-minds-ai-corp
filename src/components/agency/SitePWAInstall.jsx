import { useState, useEffect } from 'react';
import { Download, Share, Smartphone, X, Check } from 'lucide-react';

export default function SitePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || '';
    const ios = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    setIsIOS(ios);
    setIsMobile(/Mobi|Android|iPhone|iPad|iPod/i.test(ua) || window.innerWidth < 768);

    const onPrompt = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      setJustInstalled(true);
      setTimeout(() => setJustInstalled(false), 4000);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);

    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    setInstalled(standalone);

    // Register the site service worker for offline PWA support
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/site-sw.js').catch(() => {});
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed && !justInstalled) return null;

  const handleInstall = async () => {
    if (isIOS || (!deferredPrompt && !canInstall)) {
      setShowIOSHelp(true);
      return;
    }
    if (deferredPrompt) {
      setInstalling(true);
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setInstalling(false);
      if (outcome === 'accepted') {
        setJustInstalled(true);
        setTimeout(() => setJustInstalled(false), 4000);
      }
    } else {
      setShowIOSHelp(true);
    }
  };

  const canInstall = !!deferredPrompt;
  const label = justInstalled ? 'Installed' : isIOS ? 'Add to Home Screen' : canInstall ? 'Install the App' : 'Get the App';

  return (
    <section className="agency-container px-6 md:px-10 xl:px-16 py-12 md:py-16">
      <div className="xa-card overflow-hidden rounded-2xl border border-blue-100 dark:border-blue-900/40" style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 40%, #BFDBFE 100%)' }}>
        <div className="relative flex flex-col items-center gap-6 px-6 py-10 md:flex-row md:items-center md:gap-8 md:px-12 md:py-12">
          {/* Brand mark */}
          <div className="flex shrink-0 items-center gap-3 md:gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0066FF] to-[#004CE6] shadow-lg shadow-blue-500/30 md:h-16 md:w-16">
              <Smartphone className="h-7 w-7 text-white md:h-8 md:w-8" strokeWidth={2.2} />
            </div>
            <div className="md:hidden">
              <p className="font-heading text-lg font-bold text-[#0033B2]">Strategic Minds AI</p>
              <p className="text-xs font-medium text-blue-700/80">Strategy First. Intelligence Applied.</p>
            </div>
          </div>

          {/* Copy */}
          <div className="flex-1 text-center md:text-left">
            <h3 className="hidden font-heading text-xl font-bold text-[#0033B2] md:block md:text-2xl">
              Install the Strategic Minds App
            </h3>
            <p className="mt-1 hidden text-sm text-blue-800/80 md:block">
              Fast, offline-ready access to AI strategy, automation tools, and business insights — right from your home screen.
            </p>
            <p className="text-sm font-medium text-blue-900/90 md:hidden">
              Get offline-ready access to AI strategy and tools, right from your home screen.
            </p>
          </div>

          {/* Rectangular branded download button */}
          <div className="flex w-full flex-col items-center gap-3 md:w-auto md:flex-row">
            <button
              onClick={handleInstall}
              disabled={installing}
              className="xa-btn-primary group flex w-full items-center justify-center gap-2.5 rounded-xl px-7 py-4 text-base font-bold shadow-lg shadow-blue-600/30 transition-all hover:shadow-xl hover:shadow-blue-600/40 disabled:opacity-60 md:w-auto md:px-8"
              style={{ minWidth: '200px' }}
            >
              {justInstalled ? (
                <>
                  <Check className="h-5 w-5" strokeWidth={2.5} />
                  {label}
                </>
              ) : installing ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Installing…
                </>
              ) : (
                <>
                  <Download className="h-5 w-5 transition-transform group-hover:translate-y-0.5" strokeWidth={2.2} />
                  {label}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* iOS help modal */}
      {showIOSHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowIOSHelp(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h4 className="font-heading text-lg font-bold text-foreground">Install on iPhone / iPad</h4>
              <button aria-label="Close" onClick={() => setShowIOSHelp(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">1</span>
                <span>Tap the <Share className="inline h-4 w-4 text-blue-600" /> <strong>Share</strong> button in Safari's bottom toolbar.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">2</span>
                <span>Scroll down and select <strong>“Add to Home Screen”</strong>.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">3</span>
                <span>Tap <strong>“Add”</strong> — the Strategic Minds app appears on your home screen.</span>
              </li>
            </ol>
            <button
              onClick={() => setShowIOSHelp(false)}
              className="xa-btn-primary mt-5 w-full rounded-xl py-3"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </section>
  );
}