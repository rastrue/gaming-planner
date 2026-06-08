import { cn, uiStyles } from '../../utils/cn';

export interface RangeSliderProps {
  label: string;
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  disabled?: boolean;
  className?: string;
}

export default function RangeSlider({
  label,
  min = 0,
  max = 100,
  step = 1,
  value,
  onChange,
  formatValue = (current) => String(current),
  disabled = false,
  className,
}: RangeSliderProps) {
  const inputId = `${label.toLowerCase().replace(/\s+/g, '-')}-range`;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {label}
        </label>
        <span className="text-sm text-slate-600 dark:text-slate-400">{formatValue(value)}</span>
      </div>
      <input
        id={inputId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className={cn(
          'h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-primary-600 dark:bg-slate-800 dark:accent-primary-500',
          uiStyles.interactiveTransition,
          uiStyles.focusRing,
          uiStyles.disabled,
        )}
      />
      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  );
}
