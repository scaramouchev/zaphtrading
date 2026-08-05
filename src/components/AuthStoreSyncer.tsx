/**
 * AuthStoreSyncer — bridges the React AuthContext to the global Zustand
 * auth store.  This is the only place that writes auth state into Zustand,
 * ensuring the store is always a faithful mirror of the context.
 *
 * Mount once near the top of the tree, inside both <AuthProvider> and
 * the Zustand provider boundary.
 */
import { useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useAuthStore } from '@/store/useAuthStore';

export function AuthStoreSyncer() {
  const { session, user, isInitialized, isAuthenticated, profile } = useAuth();
  const sync = useAuthStore((s) => s._sync);

  useEffect(() => {
    sync({ session, user, isInitialized, isAuthenticated, profile });
  }, [session, user, isInitialized, isAuthenticated, profile, sync]);

  return null;
}
