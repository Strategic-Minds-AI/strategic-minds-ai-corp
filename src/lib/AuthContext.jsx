import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { supabaseAuth, getSession, getUser, signOut, onAuthStateChange } from '@/lib/supabaseAuthClient';

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
    let unsubscribe = null;

    (async () => {
      try {
        const session = await getSession();
        if (session) {
          const u = await getUser();
          setUser(u);
          setIsAuthenticated(true);
        }
      } catch {
        /* not authenticated */
      } finally {
        setIsLoadingAuth(false);
        setAuthChecked(true);
      }

      // Subscribe to Supabase auth state changes
      const { data } = onAuthStateChange(async (event, session) => {
        if (!session || event === 'SIGNED_OUT') {
          setUser(null);
          setIsAuthenticated(false);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const u = await getUser();
          setUser(u);
          setIsAuthenticated(true);
        }
      });
      unsubscribe = data?.unsubscribe;
    })();

    return () => {
      if (unsubscribe) unsubscribe();
    };
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