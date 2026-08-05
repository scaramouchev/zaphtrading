import { useState, memo } from 'react';
import { Search, Zap } from 'lucide-react';
import type { TickerCandidate, Network } from '@/types';
import { formatCompact, formatPct, formatPrice } from '@/utils/format';

interface LeftSidebarProps {
  tickers: TickerCandidate[];
  selectedSymbol: string;
  onSelect: (symbol: string) => void;
}

const NETWORKS: (Network | 'ALL')[] = ['ALL', 'SOLANA', 'ETHEREUM', 'BASE', 'CEX'];

const NETWORK_LABELS: Record<string, string> = {
  ALL: 'ALL',
  SOLANA: 'SOL',
  ETHEREUM: 'ETH',
  BASE: 'BASE',
  CEX: 'CEX',
};

const NETWORK_COLORS: Record<Network, string> = {
  SOLANA: 'text-brand-mint',
  ETHEREUM: 'text-brand-blue',
  BASE: 'text-sky-400',
  CEX: 'text-amber-400',
};

function LeftSidebarInner({ tickers, selectedSymbol, onSelect }: LeftSidebarProps) {
  const [activeNet, setActiveNet] = useState<Network | 'ALL'>('ALL');
  const [search, setSearch] = useState('');

  const filtered = tickers.filter((t) => {
    if (activeNet !== 'ALL' && t.network !== activeNet) return false;
    if (search && !t.symbol.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <aside className="w-[24%] min-w-[280px] h-full border-r border-glass-border bg-brand-obsidian/60 backdrop-blur-xl flex flex-col shrink-0">
      {/* Network filter */}
      <div className="px-4 pt-4 pb-3 border-b border-glass-border">
        <span className="text-[10px] font-mono text-brand-ash uppercase tracking-widest mb-2.5 block">
          Network Filter
        </span>
        <div className="flex gap-1.5">
          {NETWORKS.map((net) => (
            <button
              key={net}
              onClick={() => setActiveNet(net)}
              className={`flex-1 text-[9px] font-mono py-1.5 rounded-lg tracking-wider transition-smooth ${
                activeNet === net
                  ? 'bg-[rgba(41,151,255,0.1)] text-brand-blue border border-brand-blue/30'
                  : 'text-brand-ash border border-glass-border hover:text-brand-silver hover:border-glass-hover'
              }`}
            >
              {NETWORK_LABELS[net]}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-glass-border">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl glass-input">
          <Search className="w-3.5 h-3.5 text-brand-ash" strokeWidth={1.5} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ticker..."
            className="bg-transparent text-xs font-mono text-brand-silver placeholder-brand-ash/40 outline-none w-full"
          />
        </div>
      </div>

      {/* Section header */}
      <div className="px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-brand-blue" strokeWidth={1.5} />
          <span className="text-[10px] font-mono text-brand-ash uppercase tracking-widest">
            Predictive Stream
          </span>
        </div>
        <span className="text-[9px] font-mono text-brand-ash/60">{filtered.length} assets</span>
      </div>

      {/* Ticker list */}
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {filtered.map((t) => {
          const isSelected = t.symbol === selectedSymbol;
          const isPositive = t.changePct >= 0;
          return (
            <button
              key={t.id}
              onClick={() => onSelect(t.symbol)}
              className={`w-full text-left px-3 py-2.5 rounded-xl mb-1 transition-smooth group ${
                isSelected
                  ? 'bg-[rgba(41,151,255,0.06)] border border-brand-blue/20'
                  : 'border border-transparent hover:bg-glass-hover hover:border-glass-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-[8px] font-mono ${NETWORK_COLORS[t.network]}`}>
                    {NETWORK_LABELS[t.network]}
                  </span>
                  <span className="text-sm font-medium text-brand-silver tracking-wide">
                    {t.symbol}
                  </span>
                  {t.flagged && <span className="w-1.5 h-1.5 rounded-full bg-brand-coral" />}
                </div>
                <span
                  className={`text-xs font-mono tabular-nums ${isPositive ? 'text-brand-mint' : 'text-brand-coral'}`}
                >
                  {formatPct(t.changePct)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] font-mono text-brand-ash tabular-nums">
                  ${formatPrice(t.price)}
                </span>
                <span className="text-[9px] font-mono text-brand-ash/60 tabular-nums">
                  V/L {t.vlr.toFixed(1)}
                </span>
              </div>
              <div className="mt-1.5 h-1 rounded-full bg-glass-border overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    t.holderVelocity > 2 ? 'bg-brand-mint/60' : t.holderVelocity < 0 ? 'bg-brand-coral/60' : 'bg-brand-ash/30'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, (t.holderVelocity + 2) / 8 * 100))}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[8px] font-mono text-brand-ash/50">
                  {formatCompact(t.volume24h)} vol
                </span>
                <span className="text-[8px] font-mono text-brand-ash/50">
                  σ {t.holderVelocity.toFixed(1)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

export const LeftSidebar = memo(LeftSidebarInner);
