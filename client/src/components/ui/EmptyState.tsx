import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <section
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 px-6 py-12 text-center dark:border-slate-700',
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 text-slate-400 dark:text-slate-500" aria-hidden="true">
          {icon}
        </div>
      ) : null}
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </section>
  );
}
