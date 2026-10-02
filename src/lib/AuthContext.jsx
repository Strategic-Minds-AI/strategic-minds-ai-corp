import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { getSession, getUser, signOut, onAuthStateChange } from '@/lib/supabaseAuthClient';

// ──────────────────────────────────────────────────────────────
// AuthContext — backed by Supabase Auth.
// The base44 import is retained for entity SDK compatibility;
// all authentication state and logic uses Supabase.
// ──────────────────────────────────────────────────────────────

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    let active = true;
    let unsubscribe = null;
    let revision = 0;
    const restore = async (session, initializationError) => {
      const current = ++revision;
      setIsLoadingAuth(true);
      try {
        if (initializationError) throw initializationError;
        // Bridge the Supabase access token to the Base44 SDK so that
        // base44.functions.invoke sends it in the Authorization header.
        // Backend functions validate it via getSupabaseUser() instead of
        // base44.auth.me(), which no longer recognizes Supabase sessions.
        if (session?.access_token) base44.setToken(session.access_token);
        const u = session ? await getUser() : null;
        if (active && current === revision) {
          setUser(u);
          setIsAuthenticated(Boolean(u));
          setAuthError(null);
        }
      } catch (error) {
        if (active && current === revision) {
          setUser(null);
          setIsAuthenticated(false);
          setAuthError({ message: error.message || 'Your sign-in session could not be restored.' });
        }
      } finally {
        if (active && current === revision) {
          setIsLoadingAuth(false);
          setAuthChecked(true);
        }
      }
    };
    (async () => {
      try {
        // Subscribe before restoration so the returned Google session is not missed.
        const { data } = await onAuthStateChange((event, session) => {
          if (event !== 'INITIAL_SESSION') {
            // Keep the Base44 SDK token in sync with session refreshes.
            if (session?.access_token) base44.setToken(session.access_token);
            setTimeout(() => { if (active) restore(session); }, 0);
          }
        });
        if (!active) { data?.subscription?.unsubscribe(); return; }
        unsubscribe = () => data?.subscription?.unsubscribe();
        const session = await getSession();
        if (active) await restore(session);
      } catch (error) {
        if (active) await restore(null, error);
      }
    })();
    return () => { active = false; unsubscribe?.(); };
  }, []);

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const u = await getUser();
      if (u) {
        setUser(u);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const checkAppState = async () => {
    await checkUserAuth();
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    signOut();
    if (shouldRedirect) {
      window.location.href = '/login';
    }
  };

  const navigateToLogin = () => {
    const currentPath = window.location.pathname + window.location.search;
    window.location.href = `/login?returnTo=${encodeURIComponent(currentPath)}`;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        authChecked,
        logout,
        navigateToLogin,
        checkUserAuth,
        checkAppState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};