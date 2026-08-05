/**
 * usePortfolio — business logic for loading and managing positions.
 *
 * Components call this hook; the hook calls the service; the service
 * calls the API client. The store is only updated via setters.
 */
import { useCallback } from 'react';
import { api } from '@/services/api';
import type { Position as DBPosition } from '@/services/api';
import type { Position as UIPosition } from '@/types';
import { usePortfolioStore } from '@/store/usePortfolioStore';
import { getErrorMessage, logError } from '@/lib/errors';

function dbToUIPosition(db: DBPosition): UIPosition {
  return {
    id: db.id,
    symbol: db.token_symbol,
    network: db.network as UIPosition['network'],
    entryPrice: Number(db.entry_price),
    currentPrice: Number(db.current_price),
    size: Number(db.size),
    pnlPct: Number(db.pnl_pct),
    pnlUsd: Number(db.pnl_usd),
    highestPrice: Number(db.highest_price),
    stopLoss: Number(db.stop_loss),
    ageMinutes: Number(db.age_minutes),
    status: db.status as UIPosition['status'],
  };
}

export function usePortfolio() {
  const store = usePortfolioStore();

  const loadPositions = useCallback(async () => {
    store.setLoading(true);
    store.clearError();
    try {
      const dbPositions = await api.positions.list();
      store.setPositions(dbPositions.map(dbToUIPosition));
    } catch (err) {
      const msg = getErrorMessage(err);
      store.setError(msg);
      logError(err, { source: 'usePortfolio.loadPositions' });
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  const closePosition = useCallback(
    async (id: string) => {
      try {
        await api.positions.close(id);
        await api.audit.log('POSITION_CLOSE', 'position', id);
        await loadPositions();
      } catch (err) {
        logError(err, { source: 'usePortfolio.closePosition' });
        store.setError(getErrorMessage(err));
      }
    },
    [loadPositions, store],
  );

  const removePosition = useCallback(
    async (id: string) => {
      try {
        await api.positions.remove(id);
        await loadPositions();
      } catch (err) {
        logError(err, { source: 'usePortfolio.removePosition' });
        store.setError(getErrorMessage(err));
      }
    },
    [loadPositions, store],
  );

  return {
    positions: store.positions,
    portfolioValue: store.portfolioValue,
    prevPortfolioValue: store.prevPortfolioValue,
    isLoading: store.isLoading,
    error: store.error,
    loadPositions,
    closePosition,
    removePosition,
  };
}
