import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface CardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export default function Card({ title, description, children, footer, className }: CardProps) {
  return (
    <article
      className={cn(
        'rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900',
        className,
      )}
    >
      {title || description ? (
        <header className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          {title ? <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3> : null}
          {description ? (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>
          ) : null}
        </header>
      ) : null}
      <div className="px-6 py-4">{children}</div>
      {footer ? (
        <footer className="border-t border-slate-200 px-6 py-4 dark:border-slate-800">{footer}</footer>
      ) : null}
    </article>
  );
}
