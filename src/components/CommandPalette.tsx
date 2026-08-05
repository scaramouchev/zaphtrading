import { useState, useEffect, useRef } from 'react';
import { Search, TrendingUp, Bell, Settings, Layout, Activity, ArrowRight } from 'lucide-react';
import { useMarketStore } from '@/store/useMarketStore';

interface CommandPaletteProps {
  onClose: () => void;
}

interface CommandItem {
  id: string;
  label: string;
  category: string;
  icon: typeof TrendingUp;
  action: () => void;
}

export function CommandPalette({ onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const tickers = useMarketStore((s) => s.tickers);
  const setActiveSymbol = useMarketStore((s) => s.setActiveSymbol);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const tickerCommands: CommandItem[] = tickers.slice(0, 8).map((t) => ({
    id: `ticker-${t.symbol}`,
    label: `${t.symbol} — $${t.price.toFixed(6)}`,
    category: 'Assets',
    icon: TrendingUp,
    action: () => {
      setActiveSymbol(t.symbol);
      onClose();
    },
  }));

  const navCommands: CommandItem[] = [
    { id: 'nav-alerts', label: 'View Alerts', category: 'Navigation', icon: Bell, action: onClose },
    { id: 'nav-settings', label: 'Open Settings', category: 'Navigation', icon: Settings, action: onClose },
    { id: 'nav-workspace', label: 'Switch Workspace', category: 'Navigation', icon: Layout, action: onClose },
    { id: 'nav-activity', label: 'Activity Feed', category: 'Navigation', icon: Activity, action: onClose },
  ];

  const allCommands = [...tickerCommands, ...navCommands];
  const filtered = allCommands.filter((c) =>
    query ? c.label.toLowerCase().includes(query.toLowerCase()) || c.category.toLowerCase().includes(query.toLowerCase()) : true,
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      filtered[selectedIndex]?.action();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl glass rounded-2xl shadow-premium overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-glass-border">
          <Search className="w-4 h-4 text-brand-ash" strokeWidth={1.5} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search assets, commands, or navigate..."
            className="bg-transparent text-sm text-brand-silver placeholder-brand-ash/40 outline-none w-full font-sans"
          />
          <kbd className="text-[9px] font-mono text-brand-ash px-1.5 py-0.5 rounded border border-glass-border">
            ESC
          </kbd>
        </div>

        <div className="max-h-[400px] overflow-y-auto py-2">
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-brand-ash font-mono">
              No results found for "{query}"
            </div>
          )}
          {filtered.map((cmd, i) => {
            const Icon = cmd.icon;
            return (
              <button
                key={cmd.id}
                onClick={() => cmd.action()}
                onMouseEnter={() => setSelectedIndex(i)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 transition-smooth ${
                  i === selectedIndex ? 'bg-[rgba(41,151,255,0.08)]' : 'hover:bg-glass-hover'
                }`}
              >
                <Icon className="w-4 h-4 text-brand-ash" strokeWidth={1.5} />
                <div className="flex-1 text-left">
                  <span className="text-sm text-brand-silver">{cmd.label}</span>
                </div>
                <span className="text-[9px] font-mono text-brand-ash uppercase tracking-wider">
                  {cmd.category}
                </span>
                {i === selectedIndex && <ArrowRight className="w-3.5 h-3.5 text-brand-blue" strokeWidth={1.5} />}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-glass-border text-[9px] font-mono text-brand-ash">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-glass-border">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-glass-border">↵</kbd>
              Select
            </span>
          </div>
          <span>Zaphonx Command Palette</span>
        </div>
      </div>
    </div>
  );
}
