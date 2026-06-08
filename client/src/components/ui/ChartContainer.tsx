import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface ChartContainerProps {
  title: string;
  description?: string;
  legend?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function ChartContainer({
  title,
  description,
  legend,
  children,
  className,
}: ChartContainerProps) {
  return (
    <section
      aria-label={title}
      className={cn(
        'rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900',
        className,
      )}
    >
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
          {description ? (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>
          ) : null}
        </div>
        {legend ? <div className="flex flex-wrap items-center gap-3 text-sm">{legend}</div> : null}
      </header>
      <div className="min-h-[12rem] w-full">{children}</div>
    </section>
  );
}
