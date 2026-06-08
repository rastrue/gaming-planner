import type { SelectHTMLAttributes } from 'react';
import { cn, uiStyles } from '../../utils/cn';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectDropdownProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  error?: string;
  placeholder?: string;
}

export default function SelectDropdown({
  label,
  options,
  error,
  placeholder,
  id,
  className,
  disabled,
  ...props
}: SelectDropdownProps) {
  const selectId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, '-');
  const errorId = error ? `${selectId}-error` : undefined;

  return (
    <div className="space-y-1">
      <label htmlFor={selectId} className="block text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
      </label>
      <select
        id={selectId}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        className={cn(
          'block w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 hover:border-slate-400 focus:border-primary-500 active:border-primary-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
          uiStyles.interactiveTransition,
          uiStyles.focusRing,
          uiStyles.disabled,
          error && 'border-red-500 hover:border-red-500 focus:border-red-500',
          className,
        )}
        {...props}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <p id={errorId} className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
