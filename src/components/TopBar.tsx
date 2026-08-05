import { memo } from 'react';
import { Activity, Radio, Power, Bell, Command } from 'lucide-react';
import { formatUsd } from '@/utils/format';
import { useUIStore } from '@/store/useUIStore';
import { useAuthStore } from '@/store/useAuthStore';

interface TopBarProps {
  portfolioValue: number;
  prevPortfolioValue: number;
  rpcLatencyMs: number;
  ingestionRate: number;
  onOpenNotifications: () => void;
  onOpenCommandPalette: () => void;
  onSignOut: () => void;
}

function TopBarInner({
  portfolioValue,
  prevPortfolioValue,
  rpcLatencyMs,
  ingestionRate,
  onOpenNotifications,
  onOpenCommandPalette,
  onSignOut,
}: TopBarProps) {
  const { isBotRunning, toggleBotStatus } = useUIStore();
  const userEmail = useAuthStore((s) => s.user?.email);
  const delta = portfolioValue - prevPortfolioValue;
  const deltaPositive = delta >= 0;

  return (
    <header className="flex items-center justify-between px-8 h-16 border-b border-glass-border glass shrink-0 z-50">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl border border-glass-border flex items-center justify-center bg-[rgba(41,151,255,0.05)]">
            <Activity className="w-4 h-4 text-brand-blue" strokeWidth={1.5} />
          </div>
          <span className="text-lg font-bold tracking-widest text-brand-silver">ZAPHONX</span>
        </div>
        <nav className="flex gap-1">
          {['SOL', 'ETH', 'BASE', 'MEME'].map((sym) => (
            <button
              key={sym}
              className="px-3 py-1 text-[10px] font-mono tracking-wider text-brand-ash hover:text-brand-silver rounded-lg hover:bg-glass-hover transition-smooth"
            >
              [{sym}]
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-brand-mint" strokeWidth={1.5} />
          <span className="text-[10px] font-mono text-brand-ash uppercase tracking-wider hidden sm:inline">
            Ingestion
          </span>
          <span className="text-xs font-mono text-brand-silver tabular-nums">
            {ingestionRate.toFixed(0)} f/s
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-brand-ash uppercase tracking-wider hidden md:inline">RPC</span>
          <span className="text-xs font-mono text-brand-silver tabular-nums">{rpcLatencyMs}ms</span>
          <div className={`w-1.5 h-1.5 rounded-full ${rpcLatencyMs < 5 ? 'bg-brand-mint' : 'bg-yellow-500/70'}`} />
        </div>

        <div className="flex items-center gap-3 pl-6 border-l border-glass-border">
          <span className="text-[10px] font-mono text-brand-ash uppercase tracking-wider hidden lg:inline">
            Portfolio
          </span>
          <span className="text-xl font-semibold text-brand-silver tabular-nums">
            {formatUsd(portfolioValue)}
          </span>
          <span className={`text-xs font-mono tabular-nums ${deltaPositive ? 'text-brand-mint' : 'text-brand-coral'}`}>
            {deltaPositive ? '▲' : '▼'} {Math.abs(delta).toFixed(2)}
          </span>
        </div>

        <div className="flex items-center gap-2 pl-6 border-l border-glass-border">
          <div className={`w-1.5 h-1.5 rounded-full ${isBotRunning ? 'bg-brand-mint animate-pulse-soft' : 'bg-brand-ash'}`} />
          <span className={`text-[10px] font-mono uppercase tracking-widest ${isBotRunning ? 'text-brand-mint' : 'text-brand-ash'}`}>
            {isBotRunning ? 'Active' : 'Standby'}
          </span>
        </div>

        <button
          onClick={toggleBotStatus}
          className={`px-5 py-2 rounded-full text-[10px] font-bold tracking-widest transition-smooth ${
            isBotRunning
              ? 'bg-brand-coral text-white shadow-glowCoral hover:bg-[#e53026]'
              : 'bg-transparent text-brand-ash border border-glass-border hover:bg-brand-silver hover:text-brand-onyx'
          }`}
        >
          {isBotRunning ? 'HALT SYSTEM' : 'ENGAGE BOT'}
        </button>

        <button
          onClick={onOpenNotifications}
          className="px-3 py-2 rounded-lg text-brand-ash hover:text-brand-silver transition-smooth relative"
          title="Notifications"
          aria-label="Open notifications"
        >
          <Bell className="w-4 h-4" strokeWidth={1.5} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand-blue" />
        </button>

        <button
          onClick={onOpenCommandPalette}
          className="px-3 py-2 rounded-lg text-brand-ash hover:text-brand-silver transition-smooth"
          title="Command Palette (Ctrl+K)"
          aria-label="Open command palette"
        >
          <Command className="w-4 h-4" strokeWidth={1.5} />
        </button>

        {userEmail && (
          <button
            onClick={onSignOut}
            className="px-3 py-2 rounded-lg text-[10px] font-mono text-brand-ash hover:text-brand-coral transition-smooth flex items-center gap-1.5"
            title="Sign out"
            aria-label="Sign out"
          >
            <Power className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        )}
      </div>
    </header>
  );
}

export const TopBar = memo(TopBarInner);
