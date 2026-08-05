import { useState, memo } from 'react';
import { Layers, Clock, Cpu, FlaskConical } from 'lucide-react';
import type { ExecutionLog, Position, SystemDiagnostics } from '@/types';
import { formatBytes, formatCompact, formatPct, formatPrice, timeAgo } from '@/utils/format';

interface DataPanelsProps {
  positions: Position[];
  logs: ExecutionLog[];
  diagnostics: SystemDiagnostics;
}

type Tab = 'positions' | 'logs' | 'system' | 'sandbox';

function DataPanelsInner({ positions, logs, diagnostics }: DataPanelsProps) {
  const [tab, setTab] = useState<Tab>('positions');

  const tabs: { id: Tab; label: string; icon: typeof Layers }[] = [
    { id: 'positions', label: 'Open Positions', icon: Layers },
    { id: 'logs', label: 'Execution Logs', icon: Clock },
    { id: 'system', label: 'System Metrics', icon: Cpu },
    { id: 'sandbox', label: 'Strategy Sandbox', icon: FlaskConical },
  ];

  return (
    <div className="flex flex-col h-full border-t border-glass-border bg-brand-obsidian/40 backdrop-blur-xl">
      <div className="flex items-center border-b border-glass-border px-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider transition-smooth ${
                tab === t.id
                  ? 'text-brand-blue border-b-2 border-brand-blue'
                  : 'text-brand-ash hover:text-brand-silver border-b-2 border-transparent'
              }`}
            >
              <Icon className="w-3 h-3" strokeWidth={1.5} />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-auto">
        {tab === 'positions' && <PositionsGrid positions={positions} />}
        {tab === 'logs' && <LogsGrid logs={logs} />}
        {tab === 'system' && <SystemGrid diagnostics={diagnostics} />}
        {tab === 'sandbox' && <SandboxPanel />}
      </div>
    </div>
  );
}

export const DataPanels = memo(DataPanelsInner);

function PositionsGrid({ positions }: { positions: Position[] }) {
  return (
    <table className="w-full text-[10px] font-mono">
      <thead>
        <tr className="text-brand-ash uppercase tracking-wider border-b border-glass-border">
          <th className="text-left px-3 py-1.5 font-normal">ID</th>
          <th className="text-left px-3 py-1.5 font-normal">Symbol</th>
          <th className="text-left px-3 py-1.5 font-normal">Net</th>
          <th className="text-right px-3 py-1.5 font-normal">Entry</th>
          <th className="text-right px-3 py-1.5 font-normal">Current</th>
          <th className="text-right px-3 py-1.5 font-normal">Size</th>
          <th className="text-right px-3 py-1.5 font-normal">PnL %</th>
          <th className="text-right px-3 py-1.5 font-normal">PnL $</th>
          <th className="text-right px-3 py-1.5 font-normal">Peak</th>
          <th className="text-right px-3 py-1.5 font-normal">Stop</th>
          <th className="text-right px-3 py-1.5 font-normal">Age</th>
          <th className="text-center px-3 py-1.5 font-normal">Status</th>
        </tr>
      </thead>
      <tbody>
        {positions.map((p) => {
          const isPositive = p.pnlPct >= 0;
          return (
            <tr key={p.id} className="border-b border-glass-border/30 hover:bg-glass-hover transition-smooth">
              <td className="px-3 py-1.5 text-brand-ash">{p.id}</td>
              <td className="px-3 py-1.5 text-brand-silver font-medium">{p.symbol}</td>
              <td className="px-3 py-1.5 text-brand-ash">{p.network.slice(0, 3)}</td>
              <td className="px-3 py-1.5 text-right text-brand-silver/60 tabular-nums">${formatPrice(p.entryPrice)}</td>
              <td className="px-3 py-1.5 text-right text-brand-silver tabular-nums">${formatPrice(p.currentPrice)}</td>
              <td className="px-3 py-1.5 text-right text-brand-silver/60 tabular-nums">{p.size.toFixed(0)}</td>
              <td className={`px-3 py-1.5 text-right tabular-nums ${isPositive ? 'text-brand-mint' : 'text-brand-coral'}`}>
                {formatPct(p.pnlPct)}
              </td>
              <td className={`px-3 py-1.5 text-right tabular-nums ${isPositive ? 'text-brand-mint' : 'text-brand-coral'}`}>
                {isPositive ? '+' : ''}{p.pnlUsd.toFixed(2)}
              </td>
              <td className="px-3 py-1.5 text-right text-brand-ash tabular-nums">${formatPrice(p.highestPrice)}</td>
              <td className="px-3 py-1.5 text-right text-brand-ash tabular-nums">${formatPrice(p.stopLoss)}</td>
              <td className="px-3 py-1.5 text-right text-brand-ash tabular-nums">{p.ageMinutes.toFixed(0)}m</td>
              <td className="px-3 py-1.5 text-center">
                <span className={`text-[9px] px-2 py-0.5 rounded-md border ${
                  p.status === 'OPEN' ? 'border-glass-border text-brand-ash' :
                  p.status === 'TRAILING' ? 'border-brand-mint/30 text-brand-mint' :
                  'border-brand-coral/30 text-brand-coral'
                }`}>
                  {p.status}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function LogsGrid({ logs }: { logs: ExecutionLog[] }) {
  return (
    <table className="w-full text-[10px] font-mono">
      <thead>
        <tr className="text-brand-ash uppercase tracking-wider border-b border-glass-border">
          <th className="text-left px-3 py-1.5 font-normal">Time</th>
          <th className="text-left px-3 py-1.5 font-normal">Symbol</th>
          <th className="text-left px-3 py-1.5 font-normal">Action</th>
          <th className="text-right px-3 py-1.5 font-normal">Amount</th>
          <th className="text-right px-3 py-1.5 font-normal">Price</th>
          <th className="text-right px-3 py-1.5 font-normal">Tip</th>
          <th className="text-left px-3 py-1.5 font-normal">Relay</th>
          <th className="text-center px-3 py-1.5 font-normal">Status</th>
        </tr>
      </thead>
      <tbody>
        {logs.map((log) => (
          <tr key={log.id} className="border-b border-glass-border/30 hover:bg-glass-hover transition-smooth">
            <td className="px-3 py-1.5 text-brand-ash">{timeAgo(log.time)}</td>
            <td className="px-3 py-1.5 text-brand-silver">{log.symbol}</td>
            <td className={`px-3 py-1.5 ${log.action === 'BUY' ? 'text-brand-mint' : log.action === 'SELL' ? 'text-brand-coral' : 'text-brand-ash'}`}>
              {log.action}
            </td>
            <td className="px-3 py-1.5 text-right text-brand-silver/60 tabular-nums">{log.amount.toFixed(4)}</td>
            <td className="px-3 py-1.5 text-right text-brand-silver/60 tabular-nums">${formatPrice(log.price)}</td>
            <td className="px-3 py-1.5 text-right text-brand-ash tabular-nums">{log.tip.toFixed(4)}</td>
            <td className="px-3 py-1.5 text-brand-ash">{log.relay}</td>
            <td className="px-3 py-1.5 text-center">
              <span className={`text-[9px] px-2 py-0.5 rounded-md border ${
                log.status === 'CONFIRMED' ? 'border-brand-mint/30 text-brand-mint' :
                log.status === 'PENDING' ? 'border-yellow-500/30 text-yellow-500/80' :
                'border-brand-coral/30 text-brand-coral'
              }`}>
                {log.status}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SystemGrid({ diagnostics }: { diagnostics: SystemDiagnostics }) {
  const metrics = [
    { label: 'RPC Latency', value: `${diagnostics.rpcLatencyMs}ms`, max: 15, current: diagnostics.rpcLatencyMs },
    { label: 'FIFO Queue Depth', value: `${diagnostics.fifoQueueDepth}`, max: 500, current: diagnostics.fifoQueueDepth },
    { label: 'CPU Utilization', value: `${diagnostics.cpuPct.toFixed(1)}%`, max: 100, current: diagnostics.cpuPct },
    { label: 'RAM Allocation', value: formatBytes(diagnostics.ramBytes), max: 2e9, current: diagnostics.ramBytes },
    { label: 'Ingestion Rate', value: `${diagnostics.ingestionRate.toFixed(0)} f/s`, max: 12000, current: diagnostics.ingestionRate },
    { label: 'Model Log-Loss', value: diagnostics.modelLogLoss.toFixed(4), max: 0.5, current: diagnostics.modelLogLoss },
  ];

  return (
    <div className="p-4 grid grid-cols-3 gap-3">
      {metrics.map((m) => {
        const pct = Math.min(100, (m.current / m.max) * 100);
        const isWarning = m.label === 'Model Log-Loss' && m.current > 0.35;
        return (
          <div key={m.label} className="glass-card p-4">
            <div className="text-[9px] font-mono text-brand-ash uppercase tracking-wider mb-2">
              {m.label}
            </div>
            <div className={`text-lg font-mono tabular-nums mb-2.5 ${isWarning ? 'text-brand-coral' : 'text-brand-silver'}`}>
              {m.value}
            </div>
            <div className="h-1 rounded-full bg-glass-border overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isWarning ? 'bg-brand-coral/60' : pct > 75 ? 'bg-yellow-500/60' : 'bg-brand-mint/50'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {isWarning && (
              <div className="text-[8px] font-mono text-brand-coral mt-1.5 uppercase tracking-wider">
                Drift threshold exceeded
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SandboxPanel() {
  const [stopLoss, setStopLoss] = useState(15);
  const [trailing, setTrailing] = useState(8);
  const [maxAlloc, setMaxAlloc] = useState(2.5);
  const [slippage, setSlippage] = useState(5);

  return (
    <div className="p-4 grid grid-cols-2 gap-6">
      <div className="space-y-5">
        <div>
          <div className="text-[9px] font-mono text-brand-ash uppercase tracking-wider mb-2">
            Stop-Loss Threshold (%)
          </div>
          <input type="range" min="1" max="50" value={stopLoss} onChange={(e) => setStopLoss(Number(e.target.value))} className="w-full" />
          <div className="text-sm font-mono text-brand-silver tabular-nums mt-1">{stopLoss}%</div>
        </div>
        <div>
          <div className="text-[9px] font-mono text-brand-ash uppercase tracking-wider mb-2">
            Trailing Margin (%)
          </div>
          <input type="range" min="1" max="30" value={trailing} onChange={(e) => setTrailing(Number(e.target.value))} className="w-full" />
          <div className="text-sm font-mono text-brand-silver tabular-nums mt-1">{trailing}%</div>
        </div>
      </div>
      <div className="space-y-5">
        <div>
          <div className="text-[9px] font-mono text-brand-ash uppercase tracking-wider mb-2">
            Max Capital Allocation (%)
          </div>
          <input type="range" min="0.1" max="10" step="0.1" value={maxAlloc} onChange={(e) => setMaxAlloc(Number(e.target.value))} className="w-full" />
          <div className="text-sm font-mono text-brand-silver tabular-nums mt-1">{maxAlloc}%</div>
        </div>
        <div>
          <div className="text-[9px] font-mono text-brand-ash uppercase tracking-wider mb-2">
            Slippage Cap (%)
          </div>
          <input type="range" min="0.5" max="20" step="0.5" value={slippage} onChange={(e) => setSlippage(Number(e.target.value))} className="w-full" />
          <div className="text-sm font-mono text-brand-silver tabular-nums mt-1">{slippage}%</div>
        </div>
      </div>
      <div className="col-span-2 glass-card p-4">
        <div className="text-[9px] font-mono text-brand-ash uppercase tracking-wider mb-3">
          Simulated Outcome (Mock Token)
        </div>
        <div className="grid grid-cols-4 gap-3 text-[10px] font-mono">
          <div>
            <span className="text-brand-ash">Est. Price Impact: </span>
            <span className="text-brand-silver">{(maxAlloc * 0.08).toFixed(2)}%</span>
          </div>
          <div>
            <span className="text-brand-ash">Max Drawdown: </span>
            <span className="text-brand-coral">-{stopLoss}%</span>
          </div>
          <div>
            <span className="text-brand-ash">Trail Trigger: </span>
            <span className="text-brand-mint">+{trailing}%</span>
          </div>
          <div>
            <span className="text-brand-ash">Slippage Allowance: </span>
            <span className="text-brand-silver">{slippage}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
