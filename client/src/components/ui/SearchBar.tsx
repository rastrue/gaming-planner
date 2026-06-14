import { Search, X } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import IconButton from './IconButton';
import { cn, uiStyles } from '../../utils/cn';

export interface SearchBarProps {
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  onReset?: () => void;
  disabled?: boolean;
  className?: string;
}

export default function SearchBar({
  label = 'Search',
  placeholder = 'Search...',
  defaultValue = '',
  value,
  onChange,
  onSearch,
  onReset,
  disabled = false,
  className,
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = value ?? internalValue;
  const inputId = 'questsync-search-bar';

  const updateValue = (nextValue: string) => {
    if (value === undefined) {
      setInternalValue(nextValue);
    }
    onChange?.(nextValue);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch?.(currentValue.trim());
  };

  const handleReset = () => {
    updateValue('');
    onReset?.();
    onSearch?.('');
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-1', className)} role="search">
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-2 py-1 hover:border-slate-400 focus-within:border-primary-500 dark:border-slate-700 dark:bg-slate-900">
        <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          id={inputId}
          type="search"
          value={currentValue}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(event) => updateValue(event.target.value)}
          className={cn(
            'min-w-0 flex-1 border-0 bg-transparent px-1 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-400',
            uiStyles.disabled,
          )}
        />
        {currentValue ? (
          <IconButton
            type="button"
            label="Clear search"
            size="sm"
            disabled={disabled}
            onClick={handleReset}
          >
            <X className="h-4 w-4" />
          </IconButton>
        ) : null}
        <button
          type="submit"
          disabled={disabled}
          className={cn(
            'cursor-pointer rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 active:bg-primary-800',
            uiStyles.interactiveTransition,
            uiStyles.focusRing,
            uiStyles.disabled,
          )}
        >
          Search
        </button>
      </div>
    </form>
  );
}
