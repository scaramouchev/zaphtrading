import { lazy, Suspense, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { AuthStoreSyncer } from '@/components/AuthStoreSyncer';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { AppLoadingSkeleton } from '@/components/shared/Skeleton';
import { useAuthStore } from '@/store/useAuthStore';
import { useMarketStore } from '@/store/useMarketStore';
import { usePortfolio } from '@/hooks/usePortfolio';
import { genExecutionLogs } from '@/mockData';
import type { ExecutionLog } from '@/types';
import { authService } from '@/services/authService';
import { api } from '@/services/api';
import { logError } from '@/lib/errors';

// Lazy-load the terminal shell and auth portal to split the initial bundle.
const TerminalShell = lazy(() =>
  import('@/components/TerminalShell').then((m) => ({ default: m.TerminalShell })),
);
const ZaphonxPortal = lazy(() =>
  import('@/components/ZaphonxPortal').then((m) => ({ default: m.ZaphonxPortal })),
);

function App() {
  const { isInitialized, isAuthenticated, user } = useAuth();
  const market = useMarketStore();
  const { positions, portfolioValue, prevPortfolioValue, loadPositions } = usePortfolio();
  const [logs, setLogs] = useState<ExecutionLog[]>(() => genExecutionLogs(30));
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Load market + portfolio after authentication
  useEffect(() => {
    if (!isAuthenticated) return;
    market.initialize();
    loadPositions();
  }, [isAuthenticated, market, loadPositions]);

  // Simulated execution log stream
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      setLogs((prev) => [...genExecutionLogs(1), ...prev].slice(0, 40));
    }, 4000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette((v) => !v);
      }
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
        setShowNotifications(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await authService.signOut();
      await api.audit.log('SIGN_OUT', 'user', user?.id);
    } catch (err) {
      logError(err, { source: 'App.signOut' });
    }
  }, [user?.id]);

  // Never render protected content before auth is initialized
  if (!isInitialized) {
    return (
      <ErrorBoundary>
        <AppLoadingSkeleton />
      </ErrorBoundary>
    );
  }

  if (!isAuthenticated) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<AppLoadingSkeleton />}>
          <ZaphonxPortal />
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <AuthStoreSyncer />
      <Suspense fallback={<AppLoadingSkeleton />}>
        <TerminalShell
          portfolioValue={portfolioValue}
          prevPortfolioValue={prevPortfolioValue}
          positions={positions}
          logs={logs}
          tickers={market.tickers}
          candles={market.candles}
          orderBook={market.orderBook}
          diagnostics={market.diagnostics}
          gatekeeper={market.gatekeeper}
          signal={market.signal}
          activeSymbol={market.activeSymbol}
          onSelectSymbol={market.setActiveSymbol}
          rpcLatencyMs={market.diagnostics.rpcLatencyMs}
          ingestionRate={market.diagnostics.ingestionRate}
          onOpenNotifications={() => setShowNotifications(true)}
          onOpenCommandPalette={() => setShowCommandPalette(true)}
          onSignOut={handleSignOut}
          showCommandPalette={showCommandPalette}
          onCloseCommandPalette={() => setShowCommandPalette(false)}
          showNotifications={showNotifications}
          onCloseNotifications={() => setShowNotifications(false)}
        />
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
