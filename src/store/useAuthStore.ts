/**
 * Auth store — client state only.
 *
 * This store mirrors the AuthProvider context for components that cannot
 * reach the context tree (e.g. Zustand middleware, utility functions).
 * Business logic (signIn, signOut, session management) lives in
 * AuthProvider and authService. This store only reflects the latest
 * values pushed from AuthProvider via syncFromContext().
 *
 * Wallet / exchange connection state is kept here because it is
 * client-session-only and does not require backend persistence.
 */
import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import type { UserProfile } from '@/services/api';

interface AuthStoreState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  profile: UserProfile | null;

  // Connection state (in-memory only — not persisted)
  solanaPublicKey: string | null;
  evmPublicKey: string | null;
  connectedExchanges: string[];

  // Loading / error state for forms
  isLoading: boolean;
  error: string | null;

  // Internal: called by AuthProvider to keep the store in sync
  _sync: (partial: Partial<AuthStoreState>) => void;

  connectWallet: (chain: 'SOLANA' | 'EVM', address: string) => void;
  integrateExchange: (exchange: string) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  isInitialized: false,
  profile: null,
  solanaPublicKey: null,
  evmPublicKey: null,
  connectedExchanges: [],
  isLoading: false,
  error: null,

  _sync: (partial) => set(partial),

  connectWallet: (chain, address) =>
    set((state) => ({
      solanaPublicKey: chain === 'SOLANA' ? address : state.solanaPublicKey,
      evmPublicKey: chain === 'EVM' ? address : state.evmPublicKey,
    })),

  integrateExchange: (exchange) =>
    set((state) => ({
      connectedExchanges: state.connectedExchanges.includes(exchange)
        ? state.connectedExchanges
        : [...state.connectedExchanges, exchange],
    })),

  clearError: () => set({ error: null }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
