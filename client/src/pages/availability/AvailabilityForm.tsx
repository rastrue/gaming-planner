import { type FormEvent, useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import RangeSlider from '../../components/ui/RangeSlider';
import SelectDropdown from '../../components/ui/SelectDropdown';
import TextInput from '../../components/ui/TextInput';
import type { AvailabilityWindow, CreateAvailabilityInput } from '../../types/index';

const weekdayOptions = [
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
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
      setLocalError('End time must be after start time.');
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
        label="Day of week"
        value={dayOfWeek}
        onChange={(event) => setDayOfWeek(event.target.value)}
        options={weekdayOptions}
        error={fieldErrors.dayOfWeek}
      />
      <RangeSlider
        label="Start time"
        min={0}
        max={1439}
        step={15}
        value={startMinute}
        onChange={setStartMinute}
        formatValue={formatMinutes}
      />
      <RangeSlider
        label="End time"
        min={1}
        max={1440}
        step={15}
        value={endMinute}
        onChange={setEndMinute}
        formatValue={formatMinutes}
      />
      <TextInput
        label="Timezone"
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
          {isSubmitting ? 'Saving...' : initialValues ? 'Update window' : 'Add window'}
        </Button>
        {onCancel ? (
          <Button type="button" variant="secondary" disabled={isSubmitting} onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
