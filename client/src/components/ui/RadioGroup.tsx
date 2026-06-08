import { cn, uiStyles } from '../../utils/cn';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  legend: string;
  name: string;
  value: string;
  options: RadioOption[];
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export default function RadioGroup({
  legend,
  name,
  value,
  options,
  onChange,
  error,
  disabled = false,
  className,
}: RadioGroupProps) {
  const errorId = error ? `${name}-error` : undefined;

  return (
    <fieldset
      disabled={disabled}
      className={cn('space-y-3', uiStyles.disabled, className)}
      aria-describedby={errorId}
    >
      <legend className="text-sm font-medium text-slate-700 dark:text-slate-200">{legend}</legend>
      <div className="space-y-2">
        {options.map((option) => {
          const optionId = `${name}-${option.value}`;

          return (
            <div key={option.value} className="flex items-start gap-3">
              <input
                id={optionId}
                type="radio"
                name={name}
                value={option.value}
                checked={value === option.value}
                disabled={disabled || option.disabled}
                onChange={() => onChange(option.value)}
                className={cn(
                  'mt-0.5 h-4 w-4 cursor-pointer border-slate-300 text-primary-600 hover:border-primary-400 focus:ring-primary-500 active:border-primary-700 dark:border-slate-600 dark:bg-slate-900',
                  uiStyles.interactiveTransition,
                  uiStyles.focusRing,
                  uiStyles.disabled,
                )}
              />
              <div className="space-y-1">
                <label
                  htmlFor={optionId}
                  className="cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  {option.label}
                </label>
                {option.description ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">{option.description}</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      {error ? (
        <p id={errorId} className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
