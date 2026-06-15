import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps {
  label?: string;
  size?: SpinnerSize;
  className?: string;
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export default function Spinner({ label = 'Загрузка', size = 'md', className }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn('inline-flex items-center gap-2 text-slate-600 dark:text-slate-400', className)}
    >
      <Loader2 aria-hidden="true" className={cn('animate-spin text-primary-600 dark:text-primary-400', sizeClasses[size])} />
      <span className="sr-only">{label}</span>
    </div>
  );
}
