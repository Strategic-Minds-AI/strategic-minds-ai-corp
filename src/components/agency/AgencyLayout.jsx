import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import AgencyHeader from '@/components/layout/header';
import AgencyFooter from '@/components/layout/footer';

export default function AgencyLayout() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [pathname, hash]);
  return <div className="agency-site-backdrop min-h-screen bg-background font-body text-muted-foreground"><a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-background focus:p-4">Skip to content</a><AgencyHeader /><div id="main-content" tabIndex={-1} className=""><Outlet /></div><AgencyFooter /></div>;
}