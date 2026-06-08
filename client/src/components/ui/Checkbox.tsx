import type { InputHTMLAttributes } from 'react';
import { cn, uiStyles } from '../../utils/cn';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
}

export default function Checkbox({
  label,
  description,
  id,
  className,
  disabled,
  ...props
}: CheckboxProps) {
  const checkboxId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, '-');
  const descriptionId = description ? `${checkboxId}-description` : undefined;

  return (
    <div className={cn('flex items-start gap-3', className)}>
      <input
        id={checkboxId}
        type="checkbox"
        disabled={disabled}
        aria-describedby={descriptionId}
        className={cn(
          'mt-0.5 h-4 w-4 cursor-pointer rounded border-slate-300 text-primary-600 hover:border-primary-400 focus:ring-primary-500 active:border-primary-700 dark:border-slate-600 dark:bg-slate-900',
          uiStyles.interactiveTransition,
          uiStyles.focusRing,
          uiStyles.disabled,
        )}
        {...props}
      />
      <div className="space-y-1">
        <label
          htmlFor={checkboxId}
          className="cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-200"
        >
          {label}
        </label>
        {description ? (
          <p id={descriptionId} className="text-xs text-slate-500 dark:text-slate-400">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
