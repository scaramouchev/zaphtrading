import { memo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Flame,
  Lock,
  Unlock,
  Eye,
  TrendingUp,
  Brain,
  Fish,
} from 'lucide-react';
import type { GatekeeperReport, PredictiveSignal } from '@/types';
import { formatAddr } from '@/utils/format';

interface RightSidebarProps {
  gatekeeper: GatekeeperReport;
  signal: PredictiveSignal;
  selectedSymbol: string;
}

function RightSidebarInner({ gatekeeper, signal, selectedSymbol }: RightSidebarProps) {
  return (
    <aside className="w-[24%] min-w-[300px] h-full border-l border-glass-border bg-brand-obsidian/60 backdrop-blur-xl flex flex-col shrink-0 overflow-y-auto">
      {/* Gatekeeper */}
      <div className="p-4 border-b border-glass-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {gatekeeper.securityVerdict === 'PASSED' ? (
              <ShieldCheck className="w-4 h-4 text-brand-mint" strokeWidth={1.5} />
            ) : gatekeeper.securityVerdict === 'REVIEW' ? (
              <ShieldAlert className="w-4 h-4 text-yellow-500/80" strokeWidth={1.5} />
            ) : (
              <ShieldX className="w-4 h-4 text-brand-coral" strokeWidth={1.5} />
            )}
            <span className="text-[10px] font-mono text-brand-ash uppercase tracking-widest">
              The Gatekeeper
            </span>
          </div>
          <span
            className={`text-[9px] font-mono px-2.5 py-1 rounded-lg border tracking-wider ${
              gatekeeper.securityVerdict === 'PASSED'
                ? 'border-brand-mint/30 text-brand-mint bg-[rgba(48,213,200,0.05)]'
                : gatekeeper.securityVerdict === 'REVIEW'
                ? 'border-yellow-500/30 text-yellow-500/80 bg-[rgba(234,179,8,0.05)]'
                : 'border-brand-coral/30 text-brand-coral bg-[rgba(255,59,48,0.05)]'
            }`}
          >
            {gatekeeper.securityVerdict}
          </span>
        </div>

        <div className="mb-3 px-3 py-2 rounded-xl bg-[rgba(41,151,255,0.04)] border border-glass-border">
          <div className="text-[9px] font-mono text-brand-ash uppercase tracking-wider mb-0.5">
            Analyzed Token
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-brand-silver font-medium">{gatekeeper.tokenSymbol}</span>
            <span className="text-[10px] font-mono text-brand-ash">{formatAddr(gatekeeper.tokenAddress)}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <SecurityRow label="Mint Authority" safe={!gatekeeper.isMintable} safeText="Disabled" unsafeText="Active" />
          <SecurityRow
            label="Ownership"
            safe={gatekeeper.ownershipStatus === 'RENOUNCED'}
            safeText="Renounced"
            unsafeText="Not Renounced"
          />
          <SecurityRow
            label="LP Burned"
            safe={gatekeeper.liquidityBurnedRatio >= 0.95}
            safeText={`${(gatekeeper.liquidityBurnedRatio * 100).toFixed(0)}%`}
            unsafeText={`${(gatekeeper.liquidityBurnedRatio * 100).toFixed(0)}%`}
          />
          <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-glass-border bg-glass-surface">
            <div className="flex items-center gap-2">
              {gatekeeper.lpLocked ? (
                <Lock className="w-3 h-3 text-brand-mint" strokeWidth={1.5} />
              ) : (
                <Unlock className="w-3 h-3 text-brand-coral" strokeWidth={1.5} />
              )}
              <span className="text-[10px] font-mono text-brand-silver/70">LP Lock</span>
            </div>
            <span className={`text-[10px] font-mono ${gatekeeper.lpLocked ? 'text-brand-mint' : 'text-brand-coral'}`}>
              {gatekeeper.lpLocked ? `${gatekeeper.lockDurationDays}d locked` : 'Unlocked'}
            </span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-glass-border bg-glass-surface">
            <div className="flex items-center gap-2">
              <Flame className="w-3 h-3 text-brand-ash" strokeWidth={1.5} />
              <span className="text-[10px] font-mono text-brand-silver/70">Honeypot Score</span>
            </div>
            <span className={`text-[10px] font-mono tabular-nums ${gatekeeper.honeypotScore < 0.15 ? 'text-brand-mint' : 'text-brand-coral'}`}>
              {gatekeeper.honeypotScore.toFixed(3)}
            </span>
          </div>
        </div>

        <div className="mt-3 space-y-2.5">
          <TaxBar label="Buy Tax" value={gatekeeper.buyTaxPct} max={10} />
          <TaxBar label="Sell Tax" value={gatekeeper.sellTaxPct} max={10} />
        </div>
      </div>

      {/* Predictive Signal */}
      <div className="p-4 border-b border-glass-border">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-4 h-4 text-brand-blue" strokeWidth={1.5} />
          <span className="text-[10px] font-mono text-brand-ash uppercase tracking-widest">
            Predictive Signal
          </span>
        </div>

        <div className="space-y-1.5">
          <MetricRow label="Holder Velocity" value={`${signal.holderVelocitySigma.toFixed(2)}σ`} positive={signal.holderVelocitySigma > 1} />
          <MetricRow label="V/L Coefficient" value={signal.vlrCoefficient.toFixed(2)} positive={signal.vlrCoefficient > 5} />
          <MetricRow label="Social Momentum" value={signal.samScore.toFixed(2)} positive={signal.samScore > 0} />
        </div>

        <div className="mt-3 space-y-2">
          <ProbBar label="Breakout" value={signal.breakoutProb} color="bg-brand-mint/50" />
          <ProbBar label="Drain Risk" value={signal.drainRiskProb} color="bg-brand-coral/50" />
          <ProbBar label="No Alpha" value={signal.noAlphaProb} color="bg-brand-ash/30" />
        </div>

        <div className="mt-3 px-3 py-2.5 rounded-xl border border-glass-border bg-glass-surface flex items-center justify-between">
          <span className="text-[9px] font-mono text-brand-ash uppercase tracking-wider">Verdict</span>
          <span
            className={`text-[10px] font-mono tracking-wider ${
              signal.verdict === 'EXECUTE_PIPELINE'
                ? 'text-brand-mint'
                : signal.verdict === 'REJECT'
                ? 'text-brand-coral'
                : 'text-brand-silver/60'
            }`}
          >
            {signal.verdict.replace(/_/g, ' ')}
          </span>
        </div>

        {signal.whaleIntersections.length > 0 && (
          <div className="mt-2 px-3 py-2 rounded-xl border border-brand-mint/20 bg-[rgba(48,213,200,0.05)]">
            <div className="flex items-center gap-1.5">
              <Fish className="w-3 h-3 text-brand-mint" strokeWidth={1.5} />
              <span className="text-[9px] font-mono text-brand-mint">
                {signal.whaleIntersections[0].tag} - {signal.whaleIntersections[0].type}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Order Interface */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-brand-blue" strokeWidth={1.5} />
          <span className="text-[10px] font-mono text-brand-ash uppercase tracking-widest">
            Execution Panel
          </span>
        </div>

        <div className="space-y-2.5">
          <OrderInput label="Allocation" value="1.2" unit="%" />
          <OrderInput label="Trailing Stop" value="8.0" unit="%" />
          <OrderInput label="Slippage Cap" value="5.0" unit="%" />
          <OrderInput label="Validator Tip" value="0.01" unit="SOL" />

          <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-glass-border bg-glass-surface">
            <div className="flex items-center gap-2">
              <Eye className="w-3 h-3 text-brand-mint" strokeWidth={1.5} />
              <span className="text-[10px] font-mono text-brand-silver/70">MEV Shield</span>
            </div>
            <span className="text-[9px] font-mono text-brand-mint">Jito Bundle</span>
          </div>

          <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-glass-border bg-glass-surface">
            <span className="text-[10px] font-mono text-brand-silver/70">Route</span>
            <span className="text-[9px] font-mono text-brand-blue">Private RPC</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button className="py-2.5 rounded-xl border border-brand-mint/30 text-brand-mint text-[10px] font-mono uppercase tracking-wider hover:bg-[rgba(48,213,200,0.08)] transition-smooth">
              Execute Buy
            </button>
            <button className="py-2.5 rounded-xl border border-brand-coral/30 text-brand-coral text-[10px] font-mono uppercase tracking-wider hover:bg-[rgba(255,59,48,0.08)] transition-smooth">
              Emergency Sell
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

export const RightSidebar = memo(RightSidebarInner);

function SecurityRow({ label, safe, safeText, unsafeText }: { label: string; safe: boolean; safeText: string; unsafeText: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-glass-border bg-glass-surface">
      <span className="text-[10px] font-mono text-brand-silver/70">{label}</span>
      <span className={`text-[10px] font-mono ${safe ? 'text-brand-mint' : 'text-brand-coral'}`}>
        {safe ? safeText : unsafeText}
      </span>
    </div>
  );
}

function TaxBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const isOver = value > max;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] font-mono text-brand-ash uppercase tracking-wider">{label}</span>
        <span className={`text-[10px] font-mono tabular-nums ${isOver ? 'text-brand-coral' : 'text-brand-silver/80'}`}>
          {value.toFixed(2)}%
        </span>
      </div>
      <div className="h-1 rounded-full bg-glass-border overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isOver ? 'bg-brand-coral/60' : pct > 70 ? 'bg-yellow-500/60' : 'bg-brand-mint/50'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function MetricRow({ label, value, positive }: { label: string; value: string; positive: boolean }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-glass-border bg-glass-surface">
      <span className="text-[10px] font-mono text-brand-silver/70">{label}</span>
      <span className={`text-[10px] font-mono tabular-nums ${positive ? 'text-brand-mint' : 'text-brand-silver/80'}`}>
        {value}
      </span>
    </div>
  );
}

function ProbBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[9px] font-mono text-brand-ash">{label}</span>
        <span className="text-[9px] font-mono text-brand-silver/70 tabular-nums">{(value * 100).toFixed(1)}%</span>
      </div>
      <div className="h-1 rounded-full bg-glass-border overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${value * 100}%` }} />
      </div>
    </div>
  );
}

function OrderInput({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-glass-border bg-glass-surface">
      <span className="text-[10px] font-mono text-brand-silver/70">{label}</span>
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-mono text-brand-silver tabular-nums">{value}</span>
        <span className="text-[9px] font-mono text-brand-ash">{unit}</span>
      </div>
    </div>
  );
}
