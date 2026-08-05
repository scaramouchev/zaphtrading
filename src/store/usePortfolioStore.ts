/**
 * Portfolio store — client state only.
 *
 * Business logic (API calls, audit logging) lives in the portfolio service
 * and hooks. This store only holds the current snapshot of positions and
 * portfolio value, plus loading/error flags.
 */
import { create } from 'zustand';
import type { Position as UIPosition } from '@/types';

interface PortfolioStoreState {
  positions: UIPosition[];
  portfolioValue: number;
  prevPortfolioValue: number;
  isLoading: boolean;
  error: string | null;

  setPositions: (positions: UIPosition[]) => void;
  setPortfolioValue: (value: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

export const usePortfolioStore = create<PortfolioStoreState>((set) => ({
  positions: [],
  portfolioValue: 1241894.22,
  prevPortfolioValue: 1241894.22,
  isLoading: false,
  error: null,

  setPositions: (positions) => set({ positions }),
  setPortfolioValue: (value) =>
    set((state) => ({
      prevPortfolioValue: state.portfolioValue,
      portfolioValue: value,
    })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  reset: () =>
    set({
      positions: [],
      portfolioValue: 0,
      prevPortfolioValue: 0,
      isLoading: false,
      error: null,
    }),
}));
