import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  danger: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  info: 'bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-300',
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
