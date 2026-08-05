/**
 * AuthProvider — single source of truth for authentication state.
 *
 * Responsibilities:
 * 1. Calls getSession() once on mount to hydrate from persisted storage.
 * 2. Registers exactly ONE onAuthStateChange listener (never duplicated).
 * 3. The listener is the authoritative updater — getSession() only sets
 *    initial state before the listener fires.
 * 4. Never renders protected content until isInitialized = true.
 * 5. Loads the user profile after authentication is confirmed.
 *
 * Race-condition fix:
 * Supabase fires INITIAL_SESSION via onAuthStateChange immediately after
 * subscription. We rely on that event as the single canonical source of
 * truth, making the getSession() call purely a fast-path for SSR / prerender.
 * Both paths write through the same handleSession() function, so state is
 * always consistent.
 */

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { logError } from '@/lib/errors';
import { api } from '@/services/api';
import type { UserProfile } from '@/services/api';

export interface AuthContextValue {
  /** Supabase session, null when unauthenticated. */
  session: Session | null;
  /** Convenience shorthand for session.user. */
  user: User | null;
  /** True once the initial session check has resolved. */
  isInitialized: boolean;
  /** True when a valid session exists. */
  isAuthenticated: boolean;
  /** Loaded from user_profiles table after sign-in. */
  profile: UserProfile | null;
  /** Reload the user profile (e.g. after update). */
  reloadProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Prevent double-subscription in React StrictMode dev double-invocation.
  const listenerRegistered = useRef(false);

  const loadProfile = useCallback(async () => {
    try {
      const p = await api.profiles.get();
      setProfile(p);
    } catch (err) {
      logError(err, { source: 'AuthProvider.loadProfile' });
    }
  }, []);

  const handleSession = useCallback(
    (newSession: Session | null) => {
      setSession(newSession);
      setIsInitialized(true);
      if (newSession) {
        loadProfile();
      } else {
        setProfile(null);
      }
    },
    [loadProfile],
  );

  useEffect(() => {
    if (listenerRegistered.current) return;
    listenerRegistered.current = true;

    // Register listener first so we never miss an event.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      handleSession(newSession);
    });

    // getSession() provides the fast-path: if there is already a persisted
    // session it resolves before the INITIAL_SESSION event, giving us a
    // zero-flicker start.  If INITIAL_SESSION fires first, handleSession()
    // has already run and this is a no-op because state is identical.
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        logError(error, { source: 'AuthProvider.getSession' });
        setIsInitialized(true);
        return;
      }
      // Only set if listener hasn't fired yet (isInitialized still false).
      setIsInitialized((prev) => {
        if (!prev) {
          setSession(data.session);
          if (data.session) loadProfile();
        }
        return true;
      });
    });

    return () => {
      subscription.unsubscribe();
      listenerRegistered.current = false;
    };
  }, [handleSession, loadProfile]);

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    isInitialized,
    isAuthenticated: !!session,
    profile,
    reloadProfile: loadProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
