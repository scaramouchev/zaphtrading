import { memo } from 'react';
import { TopBar } from '@/components/TopBar';
import { LeftSidebar } from '@/components/LeftSidebar';
import { RightSidebar } from '@/components/RightSidebar';
import { ChartCanvas } from '@/components/ChartCanvas';
import { OrderBookView } from '@/components/OrderBookView';
import { DataPanels } from '@/components/DataPanels';
import { CommandPalette } from '@/components/CommandPalette';
import { NotificationCenter } from '@/components/NotificationCenter';
import type {
  Candle,
  ExecutionLog,
  GatekeeperReport,
  OrderBook,
  Position,
  PredictiveSignal,
  SystemDiagnostics,
  TickerCandidate,
} from '@/types';

interface TerminalShellProps {
  portfolioValue: number;
  prevPortfolioValue: number;
  positions: Position[];
  logs: ExecutionLog[];
  tickers: TickerCandidate[];
  candles: Candle[];
  orderBook: OrderBook;
  diagnostics: SystemDiagnostics;
  gatekeeper: GatekeeperReport;
  signal: PredictiveSignal;
  activeSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  rpcLatencyMs: number;
  ingestionRate: number;
  onOpenNotifications: () => void;
  onOpenCommandPalette: () => void;
  onSignOut: () => void;
  showCommandPalette: boolean;
  onCloseCommandPalette: () => void;
  showNotifications: boolean;
  onCloseNotifications: () => void;
}

function TerminalShellInner(props: TerminalShellProps) {
  const {
    portfolioValue,
    prevPortfolioValue,
    positions,
    logs,
    tickers,
    candles,
    orderBook,
    diagnostics,
    gatekeeper,
    signal,
    activeSymbol,
    onSelectSymbol,
    rpcLatencyMs,
    ingestionRate,
    onOpenNotifications,
    onOpenCommandPalette,
    onSignOut,
    showCommandPalette,
    onCloseCommandPalette,
    showNotifications,
    onCloseNotifications,
  } = props;

  const delta = portfolioValue - prevPortfolioValue;
  const deltaPositive = delta >= 0;
  const activeTicker = tickers.find((t) => t.symbol === activeSymbol) ?? tickers[0];

  return (
    <>
      <div className="h-screen w-screen flex flex-col bg-brand-onyx overflow-hidden">
        <TopBar
          portfolioValue={portfolioValue}
          prevPortfolioValue={prevPortfolioValue}
          rpcLatencyMs={rpcLatencyMs}
          ingestionRate={ingestionRate}
          onOpenNotifications={onOpenNotifications}
          onOpenCommandPalette={onOpenCommandPalette}
          onSignOut={onSignOut}
        />

        <div className="flex-1 flex overflow-hidden">
          <LeftSidebar
            tickers={tickers}
            selectedSymbol={activeSymbol}
            onSelect={onSelectSymbol}
          />

          <main className="flex-1 flex flex-col min-w-0 bg-brand-onyx">
            {/* Symbol header bar */}
            <div className="flex items-center justify-between px-5 py-2.5 border-b border-glass-border">
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold text-brand-silver">{activeSymbol}</span>
                <span className="text-[10px] font-mono text-brand-ash uppercase tracking-wider">
                  {activeTicker?.network ?? 'SOL'} / USDC
                </span>
              </div>
              <div className="flex items-center gap-4">
                <MetricBadge label="24h Vol" value={(activeTicker?.volume24h ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 })} />
                <MetricBadge label="Liquidity" value={(activeTicker?.liquidity ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 })} />
                <div className="flex items-center gap-1">
                  {['1m', '5m', '15m', '1H', '4H'].map((tf, i) => (
                    <button
                      key={tf}
                      className={`text-[9px] font-mono px-2 py-1 rounded-md tracking-wider transition-smooth ${
                        i === 0
                          ? 'bg-[rgba(41,151,255,0.1)] text-brand-blue border border-brand-blue/20'
                          : 'text-brand-ash hover:text-brand-silver border border-transparent'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Chart + data panels */}
              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex-1 overflow-hidden p-4">
                  <div className="glass-card h-full p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-semibold tracking-wider text-brand-silver">
                        MARKET EXECUTION CANVAS ({activeSymbol})
                      </h3>
                      <span className="text-[10px] font-mono text-brand-ash">
                        REAL-TIME CORE VECTOR PIPELINE
                      </span>
                    </div>
                    <div className="flex-1 min-h-0">
                      <ChartCanvas candles={candles} height={280} />
                    </div>
                  </div>
                </div>
                <div className="h-[40%] overflow-hidden">
                  <DataPanels positions={positions} logs={logs} diagnostics={diagnostics} />
                </div>
              </div>

              {/* Order book */}
              <div className="w-[180px] shrink-0 border-l border-glass-border bg-brand-obsidian/40 backdrop-blur-xl">
                <div className="px-3 py-2.5 border-b border-glass-border">
                  <span className="text-[10px] font-mono text-brand-ash uppercase tracking-widest">
                    Order Book
                  </span>
                </div>
                <div className="h-[calc(100%-37px)]">
                  <OrderBookView book={orderBook} />
                </div>
              </div>
            </div>
          </main>

          <RightSidebar gatekeeper={gatekeeper} signal={signal} selectedSymbol={activeSymbol} />
        </div>
      </div>

      {showCommandPalette && <CommandPalette onClose={onCloseCommandPalette} />}
      {showNotifications && <NotificationCenter onClose={onCloseNotifications} />}
    </>
  );
}

function MetricBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[9px] font-mono text-brand-ash uppercase">{label}</span>
      <span className="text-[10px] font-mono text-brand-silver tabular-nums">{value}</span>
    </div>
  );
}

export const TerminalShell = memo(TerminalShellInner);
