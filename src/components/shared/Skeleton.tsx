import { memo } from 'react';

import type { CSSProperties } from 'react';

interface SkeletonProps {
  className?: string;
  style?: CSSProperties;
}

/** Base skeleton pulse element. */
export const Skeleton = memo(function Skeleton({ className = '', style }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-glass-surface rounded-lg ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
});

/** Full-screen terminal initialization skeleton. */
export function AppLoadingSkeleton() {
  return (
    <div className="w-screen h-screen bg-brand-onyx flex flex-col overflow-hidden">
      {/* TopBar skeleton */}
      <div className="h-16 border-b border-glass-border glass flex items-center px-8 gap-8 shrink-0">
        <Skeleton className="w-32 h-5 rounded-lg" />
        <div className="flex gap-2">
          {[56, 48, 56, 52].map((w, i) => (
            <Skeleton key={i} className={`w-${w} h-4 rounded`} style={{ width: w }} />
          ))}
        </div>
        <div className="ml-auto flex items-center gap-6">
          <Skeleton className="w-24 h-4 rounded" />
          <Skeleton className="w-32 h-4 rounded" />
          <Skeleton className="w-28 h-7 rounded-full" />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar skeleton */}
        <div className="w-[24%] min-w-[280px] h-full border-r border-glass-border bg-brand-obsidian/60 p-4 space-y-3">
          <Skeleton className="w-full h-8 rounded-xl" />
          <Skeleton className="w-full h-8 rounded-xl" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="p-3 rounded-xl border border-glass-border space-y-1.5">
              <div className="flex justify-between">
                <Skeleton className="w-16 h-3 rounded" />
                <Skeleton className="w-12 h-3 rounded" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="w-20 h-3 rounded" />
                <Skeleton className="w-10 h-3 rounded" />
              </div>
              <Skeleton className="w-full h-1 rounded-full" />
            </div>
          ))}
        </div>

        {/* Main canvas skeleton */}
        <div className="flex-1 flex flex-col min-w-0 p-4 gap-4">
          <Skeleton className="w-full flex-1 rounded-2xl" />
          <Skeleton className="w-full h-[40%] rounded-2xl" />
        </div>

        {/* Right sidebar skeleton */}
        <div className="w-[24%] min-w-[300px] border-l border-glass-border bg-brand-obsidian/60 p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="w-full h-10 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Inline row skeleton for tables and lists. */
export function RowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-glass-border/30" aria-hidden="true">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-3 py-2">
          <Skeleton className="h-3 rounded" style={{ width: `${60 + (i % 3) * 20}%` }} />
        </td>
      ))}
    </tr>
  );
}

/** Card-level skeleton for panel sections. */
export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="glass-card p-4 space-y-2.5" aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-3 rounded ${i === 0 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  );
}
