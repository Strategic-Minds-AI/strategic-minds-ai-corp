import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';
import {
  getSession as getSupabaseSession,
  getUser as getSupabaseUser,
  isSupabaseAuthConfigured,
  onAuthStateChange as onSupabaseAuthStateChange,
  signOut as signOutSupabase,
} from '@/lib/supabaseAuthClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authProvider, setAuthProvider] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    let mounted = true;
    checkAppState();

    const authListener = isSupabaseAuthConfigured
      ? onSupabaseAuthStateChange(async (event, session) => {
          if (!mounted) return;

          if (session?.user) {
            const currentUser = await getSupabaseUser();
            if (!mounted || !currentUser) return;
            setUser(currentUser);
            setAuthProvider('supabase');
            setIsAuthenticated(true);
            setIsLoadingAuth(false);
            setAuthChecked(true);
            setAuthError(null);
            return;
          }

          if (event === 'SIGNED_OUT') {
            setUser(null);
            setAuthProvider(null);
            setIsAuthenticated(false);
            setAuthChecked(true);
          }
        })
      : null;

    return () => {
      mounted = false;
      authListener?.data?.subscription?.unsubscribe?.();
    };
  }, []);

  const useSupabaseSessionIfAvailable = async () => {
    if (!isSupabaseAuthConfigured) return false;

    try {
      const session = await getSupabaseSession();
      if (!session?.user) return false;

      const currentUser = await getSupabaseUser();
      if (!currentUser) return false;

      setUser(currentUser);
      setAuthProvider('supabase');
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      setIsLoadingPublicSettings(false);
      setAuthChecked(true);
      setAuthError(null);
      setAppPublicSettings({
        id: 'supabase-auth',
        public_settings: { auth_required: true },
      });
      return true;
    } catch (error) {
      console.warn('Supabase session check failed; falling back to Base44.', error);
      return false;
    }
  };

  const checkBase44State = async () => {
    const appClient = createAxiosClient({
      baseURL: '/api/apps/public',
      headers: { 'X-App-Id': appParams.appId },
      token: appParams.token,
      interceptResponses: true,
    });

    try {
      const publicSettings = await appClient.get(
        `/prod/public-settings/by-id/${appParams.appId}`
      );
      setAppPublicSettings(publicSettings);

      if (appParams.token) {
        await checkBase44User();
      } else {
        setUser(null);
        setAuthProvider(null);
        setIsLoadingAuth(false);
        setIsAuthenticated(false);
        setAuthChecked(true);
      }
      setIsLoadingPublicSettings(false);
    } catch (appError) {
      console.error('Base44 app state check failed:', appError);
      const reason = appError.status === 403
        ? appError.data?.extra_data?.reason
        : null;

      setAuthError({
        type: reason || 'unknown',
        message:
          reason === 'auth_required'
            ? 'Authentication required'
            : reason === 'user_not_registered'
              ? 'User not registered for this app'
              : appError.message || 'Failed to load app',
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const checkAppState = async () => {
    setIsLoadingPublicSettings(true);
    setIsLoadingAuth(true);
    setAuthError(null);

    const hasSupabaseSession = await useSupabaseSessionIfAvailable();
    if (hasSupabaseSession) return;

    await checkBase44State();
  };

  const checkBase44User = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    setAuthProvider('base44');
    setIsAuthenticated(true);
    setIsLoadingAuth(false);
    setAuthChecked(true);
    setAuthError(null);
  };

  const checkUserAuth = async () => {
    setIsLoadingAuth(true);

    const hasSupabaseSession = await useSupabaseSessionIfAvailable();
    if (hasSupabaseSession) return;

    try {
      await checkBase44User();
    } catch (error) {
      console.error('User auth check failed:', error);
      setUser(null);
      setAuthProvider(null);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);
      if (error.status === 401 || error.status === 403) {
        setAuthError({ type: 'auth_required', message: 'Authentication required' });
      }
    }
  };

  const logout = async (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);

    if (authProvider === 'supabase') {
      await signOutSupabase();
      setAuthProvider(null);
      if (shouldRedirect) window.location.assign('/');
      return;
    }

    setAuthProvider(null);
    if (shouldRedirect) {
      base44.auth.logout(window.location.href);
    } else {
      base44.auth.logout();
    }
  };

  const navigateToLogin = () => {
    if (isSupabaseAuthConfigured) {
      const current =
        window.location.pathname + window.location.search + window.location.hash;
      window.location.assign(`/login?returnTo=${encodeURIComponent(current)}`);
      return;
    }
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authProvider,
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
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
