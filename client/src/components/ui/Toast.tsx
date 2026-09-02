import { AlertCircle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import IconButton from './IconButton';
import { cn, uiStyles } from '../../utils/cn';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface ToastProps {
  id: string;
  title: string;
  message?: string;
  variant?: ToastVariant;
  onDismiss?: (id: string) => void;
  className?: string;
}

const variantStyles: Record<
  ToastVariant,
  { container: string; icon: ReactNode }
> = {
  info: {
    container:
      'border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
    icon: <Info aria-hidden="true" className="h-5 w-5 text-primary-600 dark:text-primary-400" />,
  },
  success: {
    container:
      'border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100',
    icon: (
      <CheckCircle2 aria-hidden="true" className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
    ),
  },
  warning: {
    container:
      'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100',
    icon: <AlertCircle aria-hidden="true" className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
  },
  error: {
    container:
      'border-red-200 bg-red-50 text-red-950 dark:border-red-900 dark:bg-red-950 dark:text-red-100',
    icon: <XCircle aria-hidden="true" className="h-5 w-5 text-red-600 dark:text-red-400" />,
  },
};

export default function Toast({
  id,
  title,
  message,
  variant = 'info',
  onDismiss,
  className,
}: ToastProps) {
  const styles = variantStyles[variant];
  const isAlert = variant === 'error' || variant === 'warning';

  return (
    <div
      role={isAlert ? 'alert' : 'status'}
      aria-live={isAlert ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={cn(
        'flex w-full max-w-sm items-start gap-3 rounded-lg border p-4 shadow-lg',
        uiStyles.interactiveTransition,
        styles.container,
        className,
      )}
    >
      <div className="mt-0.5 shrink-0">{styles.icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        {message ? <p className="mt-1 text-sm opacity-90">{message}</p> : null}
      </div>
      {onDismiss ? (
        <IconButton label="Dismiss notification" size="sm" onClick={() => onDismiss(id)}>
          <X className="h-4 w-4" />
        </IconButton>
      ) : null}
    </div>
  );
}
