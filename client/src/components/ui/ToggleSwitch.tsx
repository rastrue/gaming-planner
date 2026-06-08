import { cn, uiStyles } from '../../utils/cn';

export interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export default function ToggleSwitch({
  label,
  checked,
  onChange,
  description,
  disabled = false,
  id,
  className,
}: ToggleSwitchProps) {
  const switchId = id ?? label.toLowerCase().replace(/\s+/g, '-');
  const descriptionId = description ? `${switchId}-description` : undefined;

  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="space-y-1">
        <label htmlFor={switchId} className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {label}
        </label>
        {description ? (
          <p id={descriptionId} className="text-xs text-slate-500 dark:text-slate-400">
            {description}
          </p>
        ) : null}
      </div>
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={descriptionId}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
          uiStyles.interactiveTransition,
          uiStyles.focusRing,
          uiStyles.disabled,
          checked ? 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800' : 'bg-slate-300 hover:bg-slate-400 active:bg-slate-500 dark:bg-slate-700',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-all duration-200 ease-in-out',
            checked ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </button>
    </div>
  );
}
