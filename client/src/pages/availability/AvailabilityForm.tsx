import { type FormEvent, useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import RangeSlider from '../../components/ui/RangeSlider';
import SelectDropdown from '../../components/ui/SelectDropdown';
import TextInput from '../../components/ui/TextInput';
import type { AvailabilityWindow, CreateAvailabilityInput } from '../../types/index';

const weekdayOptions = [
  { value: '0', label: 'Воскресенье' },
  { value: '1', label: 'Понедельник' },
  { value: '2', label: 'Вторник' },
  { value: '3', label: 'Среда' },
  { value: '4', label: 'Четверг' },
  { value: '5', label: 'Пятница' },
  { value: '6', label: 'Суббота' },
];

function formatMinutes(minute: number): string {
  const hours = Math.floor(minute / 60);
  const mins = minute % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export interface AvailabilityFormValues {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
  timezone: string;
}

export interface AvailabilityFormProps {
  initialValues?: AvailabilityWindow | null;
  selectedDayOfWeek?: number | null;
  onSubmit: (values: CreateAvailabilityInput) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  fieldErrors?: Record<string, string>;
}

const defaultTimezone =
  typeof Intl !== 'undefined'
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : 'UTC';

export default function AvailabilityForm({
  initialValues,
  selectedDayOfWeek,
  onSubmit,
  onCancel,
  isSubmitting = false,
  fieldErrors = {},
}: AvailabilityFormProps) {
  const [dayOfWeek, setDayOfWeek] = useState(String(initialValues?.dayOfWeek ?? selectedDayOfWeek ?? 1));
  const [startMinute, setStartMinute] = useState(initialValues?.startMinute ?? 18 * 60);
  const [endMinute, setEndMinute] = useState(initialValues?.endMinute ?? 22 * 60);
  const [timezone, setTimezone] = useState(initialValues?.timezone ?? defaultTimezone);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (selectedDayOfWeek !== null && selectedDayOfWeek !== undefined && !initialValues) {
      setDayOfWeek(String(selectedDayOfWeek));
    }
  }, [initialValues, selectedDayOfWeek]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError('');

    if (endMinute <= startMinute) {
      setLocalError('Время окончания должно быть позже времени начала.');
      return;
    }

    await onSubmit({
      dayOfWeek: Number(dayOfWeek),
      startMinute,
      endMinute,
      timezone: timezone.trim(),
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <SelectDropdown
        label="День недели"
        value={dayOfWeek}
        onChange={(event) => setDayOfWeek(event.target.value)}
        options={weekdayOptions}
        error={fieldErrors.dayOfWeek}
      />
      <RangeSlider
        label="Время начала"
        min={0}
        max={1439}
        step={15}
        value={startMinute}
        onChange={setStartMinute}
        formatValue={formatMinutes}
      />
      <RangeSlider
        label="Время окончания"
        min={1}
        max={1440}
        step={15}
        value={endMinute}
        onChange={setEndMinute}
        formatValue={formatMinutes}
      />
      <TextInput
        label="Часовой пояс"
        value={timezone}
        onChange={(event) => setTimezone(event.target.value)}
        error={fieldErrors.timezone}
        required
      />

      {localError ? (
        <p className="text-sm text-red-600 dark:text-red-400">{localError}</p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Сохранение...' : initialValues ? 'Обновить окно' : 'Добавить окно'}
        </Button>
        {onCancel ? (
          <Button type="button" variant="secondary" disabled={isSubmitting} onClick={onCancel}>
            Отмена
          </Button>
        ) : null}
      </div>
    </form>
  );
}
