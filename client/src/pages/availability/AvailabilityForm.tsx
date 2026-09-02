import { type FormEvent, useEffect, useMemo, useState } from 'react';
import Button from '../../components/ui/Button';
import SelectDropdown from '../../components/ui/SelectDropdown';
import TextInput from '../../components/ui/TextInput';
import type { AvailabilityWindow, CreateAvailabilityInput } from '../../types/index';
import { weekdayLabelsLong } from '../../utils/labels';
import { buildTimezoneOptions, getDefaultTimezone } from '../../utils/timezones';

const weekdayOptions = weekdayLabelsLong.map((label, index) => ({
  value: String(index),
  label,
}));

function formatMinutes(minute: number): string {
  const hours = Math.floor(minute / 60);
  const mins = minute % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function minutesToTimeValue(minute: number): string {
  return formatMinutes(Math.min(minute, 1439));
}

function parseTimeValue(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
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

const defaultTimezone = getDefaultTimezone();

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
  const timezoneOptions = useMemo(
    () => buildTimezoneOptions(initialValues?.timezone ? [initialValues.timezone] : []),
    [initialValues?.timezone],
  );

  useEffect(() => {
    if (selectedDayOfWeek !== null && selectedDayOfWeek !== undefined && !initialValues) {
      setDayOfWeek(String(selectedDayOfWeek));
    }
  }, [initialValues, selectedDayOfWeek]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError('');

    if (endMinute <= startMinute) {
      setLocalError('End time must be later than start time.');
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
      <TextInput
        label="Start time"
        name="startMinute"
        type="time"
        step={900}
        value={minutesToTimeValue(startMinute)}
        onChange={(event) => setStartMinute(parseTimeValue(event.target.value))}
        error={fieldErrors.startMinute}
        required
      />
      <TextInput
        label="End time"
        name="endMinute"
        type="time"
        step={900}
        value={minutesToTimeValue(endMinute)}
        onChange={(event) => setEndMinute(parseTimeValue(event.target.value))}
        error={fieldErrors.endMinute}
        required
      />
      <SelectDropdown
        label="Time zone"
        name="timezone"
        value={timezone}
        onChange={(event) => setTimezone(event.target.value)}
        options={timezoneOptions}
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
