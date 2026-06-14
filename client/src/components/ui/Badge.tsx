import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-slate-100',
  success: 'bg-emerald-100 text-emerald-950 dark:bg-emerald-900 dark:text-emerald-100',
  warning: 'bg-amber-100 text-amber-950 dark:bg-amber-900 dark:text-amber-100',
  danger: 'bg-red-100 text-red-950 dark:bg-red-900 dark:text-red-100',
  info: 'bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100',
};

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
