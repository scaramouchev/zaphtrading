import { useState } from 'react';
import { Bell, Check, Archive, Pin, Trash2, X, TrendingUp, Shield, AlertTriangle, Cpu, FileText } from 'lucide-react';

interface NotificationItem {
  id: string;
  category: 'Market' | 'Portfolio' | 'Security' | 'System' | 'Reports';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  isPinned: boolean;
}

interface NotificationCenterProps {
  onClose: () => void;
}

const CATEGORY_CONFIG: Record<NotificationItem['category'], { icon: typeof TrendingUp; color: string }> = {
  Market: { icon: TrendingUp, color: 'text-brand-mint' },
  Portfolio: { icon: FileText, color: 'text-brand-blue' },
  Security: { icon: Shield, color: 'text-yellow-500/80' },
  System: { icon: Cpu, color: 'text-brand-ash' },
  Reports: { icon: AlertTriangle, color: 'text-brand-coral' },
};

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  { id: '1', category: 'Market', title: 'Breakout Signal Detected', message: 'WIFHAT holder velocity exceeded 3.5σ threshold. Breakout probability at 89.4%.', timestamp: '2m ago', isRead: false, isPinned: true },
  { id: '2', category: 'Security', title: 'Gatekeeper Review Required', message: 'Token BONK flagged for unrenounced ownership. Manual review recommended.', timestamp: '8m ago', isRead: false, isPinned: false },
  { id: '3', category: 'Portfolio', title: 'Position Update', message: 'MOON position reached +12.8% unrealized PnL. Trailing stop activated.', timestamp: '15m ago', isRead: true, isPinned: false },
  { id: '4', category: 'System', title: 'Model Drift Warning', message: 'XGBoost log-loss exceeded 0.35 threshold. Shadow training initiated.', timestamp: '32m ago', isRead: true, isPinned: false },
  { id: '5', category: 'Reports', title: 'Daily Performance Report Ready', message: 'Your portfolio performance report for today is available for download.', timestamp: '1h ago', isRead: true, isPinned: false },
  { id: '6', category: 'Market', title: 'Whale Wallet Detected', message: 'Whale_Alpha_04 executed SWAP_IN on ZEX. Token prioritized for analysis.', timestamp: '2h ago', isRead: true, isPinned: false },
];

export function NotificationCenter({ onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState<'All' | NotificationItem['category']>('All');

  const filtered = filter === 'All' ? notifications : notifications.filter((n) => n.category === filter);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const togglePin = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n)));
  };

  const archive = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex justify-end bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md h-full glass border-l border-glass-border shadow-premium flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-glass-border">
          <div className="flex items-center gap-3">
            <Bell className="w-4 h-4 text-brand-blue" strokeWidth={1.5} />
            <h2 className="text-sm font-semibold text-brand-silver tracking-wide">Notifications</h2>
            {unreadCount > 0 && (
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-brand-blue/15 text-brand-blue">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllRead}
              className="text-[10px] font-mono text-brand-ash hover:text-brand-silver transition-smooth px-2 py-1 rounded-md hover:bg-glass-hover"
            >
              MARK ALL READ
            </button>
            <button onClick={onClose} className="text-brand-ash hover:text-brand-silver transition-smooth">
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-glass-border overflow-x-auto">
          {(['All', 'Market', 'Portfolio', 'Security', 'System', 'Reports'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`text-[9px] font-mono px-2.5 py-1 rounded-md tracking-wider whitespace-nowrap transition-smooth ${
                filter === cat
                  ? 'bg-[rgba(41,151,255,0.1)] text-brand-blue'
                  : 'text-brand-ash hover:text-brand-silver'
              }`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <Bell className="w-8 h-8 text-brand-ash/30 mb-3" strokeWidth={1} />
              <p className="text-sm text-brand-ash font-mono">No notifications</p>
              <p className="text-[10px] text-brand-ash/50 mt-1">You're all caught up</p>
            </div>
          )}
          {filtered.map((n) => {
            const config = CATEGORY_CONFIG[n.category];
            const Icon = config.icon;
            return (
              <div
                key={n.id}
                className={`px-5 py-3.5 border-b border-glass-border/30 transition-smooth hover:bg-glass-hover group ${
                  !n.isRead ? 'bg-[rgba(41,151,255,0.03)]' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${config.color}`}>
                    <Icon className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-brand-silver truncate">{n.title}</span>
                      <span className="text-[9px] font-mono text-brand-ash/50 shrink-0">{n.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-brand-ash mt-1 leading-relaxed">{n.message}</p>
                    <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!n.isRead && (
                        <button
                          onClick={() => markRead(n.id)}
                          className="text-[9px] font-mono text-brand-ash hover:text-brand-mint flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-glass-hover"
                        >
                          <Check className="w-3 h-3" strokeWidth={1.5} />
                          Read
                        </button>
                      )}
                      <button
                        onClick={() => togglePin(n.id)}
                        className={`text-[9px] font-mono flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-glass-hover ${
                          n.isPinned ? 'text-brand-blue' : 'text-brand-ash hover:text-brand-silver'
                        }`}
                      >
                        <Pin className="w-3 h-3" strokeWidth={1.5} />
                        {n.isPinned ? 'Pinned' : 'Pin'}
                      </button>
                      <button
                        onClick={() => archive(n.id)}
                        className="text-[9px] font-mono text-brand-ash hover:text-brand-silver flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-glass-hover"
                      >
                        <Archive className="w-3 h-3" strokeWidth={1.5} />
                        Archive
                      </button>
                      <button
                        onClick={() => archive(n.id)}
                        className="text-[9px] font-mono text-brand-ash hover:text-brand-coral flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-glass-hover"
                      >
                        <Trash2 className="w-3 h-3" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                  {!n.isRead && <div className="w-1.5 h-1.5 rounded-full bg-brand-blue shrink-0 mt-1.5" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-glass-border text-[9px] font-mono text-brand-ash flex items-center justify-between">
          <span>{filtered.length} notification{filtered.length !== 1 ? 's' : ''}</span>
          <span>Auto-refresh enabled</span>
        </div>
      </div>
    </div>
  );
}
