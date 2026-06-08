import { cn } from '../../utils/cn';

export interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  className?: string;
}

export default function ProgressBar({
  value,
  max = 100,
  label,
  showValue = true,
  className,
}: ProgressBarProps) {
  const clampedValue = Math.min(max, Math.max(0, value));
  const percentage = max === 0 ? 0 : Math.round((clampedValue / max) * 100);

  return (
    <div className={cn('space-y-2', className)}>
      {label || showValue ? (
        <div className="flex items-center justify-between gap-2 text-sm">
          {label ? <span className="font-medium text-slate-700 dark:text-slate-200">{label}</span> : <span />}
          {showValue ? (
            <span className="text-slate-600 dark:text-slate-400">{percentage}%</span>
          ) : null}
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={clampedValue}
        aria-label={label}
        className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
      >
        <div
          className="h-full rounded-full bg-primary-600 transition-all duration-200 ease-in-out dark:bg-primary-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
