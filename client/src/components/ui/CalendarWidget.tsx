import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import IconButton from './IconButton';
import { cn, uiStyles } from '../../utils/cn';

export interface CalendarWidgetProps {
  month?: Date;
  selectedDates?: string[];
  activeDate?: string | null;
  onMonthChange?: (month: Date) => void;
  onDateSelect?: (date: string) => void;
  className?: string;
}

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildMonthGrid(month: Date): Array<Date | null> {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  const leadingEmpty = firstDay.getDay();
  const days: Array<Date | null> = Array.from({ length: leadingEmpty }, () => null);

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(new Date(year, monthIndex, day));
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
}

export default function CalendarWidget({
  month: controlledMonth,
  selectedDates = [],
  activeDate = null,
  onMonthChange,
  onDateSelect,
  className,
}: CalendarWidgetProps) {
  const [internalMonth, setInternalMonth] = useState(() => controlledMonth ?? new Date());
  const visibleMonth = controlledMonth ?? internalMonth;
  const monthLabel = visibleMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const days = useMemo(() => buildMonthGrid(visibleMonth), [visibleMonth]);
  const selectedSet = useMemo(() => new Set(selectedDates), [selectedDates]);

  const changeMonth = (offset: number) => {
    const nextMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1);
    if (controlledMonth === undefined) {
      setInternalMonth(nextMonth);
    }
    onMonthChange?.(nextMonth);
  };

  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900',
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{monthLabel}</h3>
        <div className="flex items-center gap-1">
          <IconButton label="Previous month" size="sm" onClick={() => changeMonth(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </IconButton>
          <IconButton label="Next month" size="sm" onClick={() => changeMonth(1)}>
            <ChevronRight className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
        {weekdayLabels.map((label) => (
          <div key={label} className="py-2">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1" role="grid" aria-label={`Calendar for ${monthLabel}`}>
        {days.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} role="gridcell" aria-hidden="true" />;
          }

          const dateKey = toDateKey(date);
          const isActive = activeDate === dateKey;
          const isSelected = selectedSet.has(dateKey);
          const isToday = toDateKey(new Date()) === dateKey;

          return (
            <button
              key={dateKey}
              type="button"
              role="gridcell"
              aria-label={date.toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
              aria-selected={isActive}
              aria-current={isToday ? 'date' : undefined}
              onClick={() => onDateSelect?.(dateKey)}
              className={cn(
                'aspect-square cursor-pointer rounded-lg text-sm font-medium',
                uiStyles.interactiveTransition,
                uiStyles.focusRing,
                isSelected && !isActive
                  ? 'bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700'
                  : 'text-slate-700 hover:bg-slate-100 active:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-800',
                isActive && 'ring-2 ring-inset ring-primary-600 dark:ring-primary-400',
                isToday &&
                  !isActive &&
                  'ring-1 ring-inset ring-primary-400 dark:ring-primary-500',
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
