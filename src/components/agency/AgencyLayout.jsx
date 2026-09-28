import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import AgencyHeader from '@/components/agency/AgencyHeader';
import AgencyFooter from '@/components/agency/AgencyFooter';

export default function AgencyLayout() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [pathname, hash]);
  return <div className="min-h-screen bg-background font-body text-muted-foreground"><a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-background focus:p-4">Skip to content</a><AgencyHeader /><div id="main-content" tabIndex={-1}><Outlet /></div><AgencyFooter /></div>;
}