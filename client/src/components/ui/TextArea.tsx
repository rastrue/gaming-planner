import type { TextareaHTMLAttributes } from 'react';
import { cn, uiStyles } from '../../utils/cn';

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export default function TextArea({
  label,
  error,
  hint,
  id,
  className,
  disabled,
  rows = 4,
  ...props
}: TextAreaProps) {
  const textareaId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, '-');
  const errorId = error ? `${textareaId}-error` : undefined;
  const hintId = hint ? `${textareaId}-hint` : undefined;

  return (
    <div className="space-y-1">
      <label
        htmlFor={textareaId}
        className="block text-sm font-medium text-slate-700 dark:text-slate-200"
      >
        {label}
      </label>
      {hint ? (
        <p id={hintId} className="text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      ) : null}
      <textarea
        id={textareaId}
        rows={rows}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        className={cn(
          'block w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 hover:border-slate-400 focus:border-primary-500 active:border-primary-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
          uiStyles.interactiveTransition,
          uiStyles.focusRing,
          uiStyles.disabled,
          error && 'border-red-500 hover:border-red-500 focus:border-red-500',
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={errorId} className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
