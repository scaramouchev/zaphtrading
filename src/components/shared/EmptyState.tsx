import { memo, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
}

export const EmptyState = memo(function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? 'py-8 px-4' : 'py-16 px-8'
      }`}
    >
      <Icon
        className={`${compact ? 'w-6 h-6' : 'w-10 h-10'} text-brand-ash/30 mb-3`}
        strokeWidth={1}
      />
      <p className={`font-mono text-brand-ash ${compact ? 'text-[10px]' : 'text-xs'}`}>
        {title}
      </p>
      {description && (
        <p className={`font-mono text-brand-ash/50 mt-1 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
});
