import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import TextInput from '../../components/ui/TextInput';
import { useAuth } from '../../hooks/useAuth';
import * as availabilityService from '../../services/availabilityService';
import { ApiError } from '../../services/apiClient';
import {
  removeAvailabilityWindow,
  setAvailabilityWindows,
  upsertAvailabilityWindow,
} from '../../store/availabilitySlice';
import type { AppDispatch, RootState } from '../../store/store';
import type { AvailabilityWindow } from '../../types/index';
import { weekdayLabelsLong } from '../../utils/labels';
import AvailabilityForm from './AvailabilityForm';

function formatMinutes(minute: number): string {
  const hours = Math.floor(minute / 60);
  const mins = minute % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function dateKeyToDayOfWeek(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day).getDay();
}

export default function AvailabilityPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { isPlayer } = useAuth();
  const windows = useSelector((state: RootState) => state.availability.items);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number | null>(null);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [editingWindow, setEditingWindow] = useState<AvailabilityWindow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!isPlayer) {
      setIsLoading(false);
      return;
    }

    let active = true;

    const loadWindows = async () => {
      setIsLoading(true);
      setLoadError('');

      try {
        const data = await availabilityService.getAvailabilityWindows();
        if (active) {
          dispatch(setAvailabilityWindows(data));
        }
      } catch {
        if (active) {
          setLoadError('Unable to load availability windows.');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadWindows();

    return () => {
      active = false;
    };
  }, [dispatch, isPlayer]);

  const filteredWindows = useMemo(() => {
    if (selectedDayOfWeek === null) {
      return windows;
    }

    return windows.filter((window) => window.dayOfWeek === selectedDayOfWeek);
  }, [selectedDayOfWeek, windows]);

  const handleCreateOrUpdate = async (values: Parameters<typeof availabilityService.createAvailabilityWindow>[0]) => {
    setFormError('');
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      if (editingWindow) {
        const updated = await availabilityService.updateAvailabilityWindow(editingWindow.id, values);
        dispatch(upsertAvailabilityWindow(updated));
        setEditingWindow(null);
      } else {
        const created = await availabilityService.createAvailabilityWindow(values);
        dispatch(upsertAvailabilityWindow(created));
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
        const mapped: Record<string, string> = {};
        error.errors?.forEach((item) => {
          mapped[item.field] = item.message;
        });
        setFieldErrors(mapped);
      } else {
        setFormError('Unable to save availability window.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (window: AvailabilityWindow) => {
    setFormError('');
    setIsSubmitting(true);

    try {
      await availabilityService.deleteAvailabilityWindow(window.id);
      dispatch(removeAvailabilityWindow(window.id));
      if (editingWindow?.id === window.id) {
        setEditingWindow(null);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
      } else {
        setFormError('Unable to delete availability window.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isPlayer) {
    return (
      <EmptyState
        title="Players only"
        description="Weekly availability planning is available only to player accounts."
      />
    );
  }

  const isInitialLoading = isLoading && windows.length === 0;

  if (loadError && windows.length === 0) {
    return <EmptyState title="Availability unavailable" description={loadError} />;
  }

  return (
    <div className={isSubmitting ? 'pointer-events-none opacity-60' : undefined}>
      <div className="space-y-6">
        {loadError ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {loadError}
          </p>
        ) : null}

        {isInitialLoading ? (
          <div className="flex justify-center py-16">
            <Spinner label="Loading availability" size="lg" />
          </div>
        ) : (
          <>
            <div className="grid gap-6 xl:grid-cols-2">
              <Card
                title="Weekly calendar"
                description="Select a day to filter the availability list."
              >
                <TextInput
                  label="Day"
                  type="date"
                  value={selectedDateKey ?? ''}
                  onChange={(event) => {
                    const dateKey = event.target.value;
                    if (!dateKey) {
                      setSelectedDateKey(null);
                      setSelectedDayOfWeek(null);
                      return;
                    }

                    setSelectedDateKey(dateKey);
                    setSelectedDayOfWeek(dateKeyToDayOfWeek(dateKey));
                  }}
                />
                {selectedDayOfWeek !== null ? (
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Filter: {weekdayLabelsLong[selectedDayOfWeek]}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedDayOfWeek(null);
                        setSelectedDateKey(null);
                      }}
                    >
                      Clear filter
                    </Button>
                  </div>
                ) : null}
              </Card>

              <Card
                title={editingWindow ? 'Edit availability window' : 'Add availability window'}
                description="Specify when you are usually free to play."
              >
                <AvailabilityForm
                  key={editingWindow?.id ?? 'create'}
                  initialValues={editingWindow}
                  selectedDayOfWeek={selectedDayOfWeek}
                  onSubmit={handleCreateOrUpdate}
                  onCancel={editingWindow ? () => setEditingWindow(null) : undefined}
                  isSubmitting={isSubmitting}
                  fieldErrors={fieldErrors}
                />
                {formError ? (
                  <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                    {formError}
                  </p>
                ) : null}
              </Card>
            </div>

            <Card title="Your availability windows" description="Saved weekly time intervals.">
              {filteredWindows.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  No availability windows yet. Add one using the form above.
                </p>
              ) : (
                <ul className="space-y-3">
                  {filteredWindows.map((window) => (
                    <li
                      key={window.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800"
                    >
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {weekdayLabelsLong[window.dayOfWeek]}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {formatMinutes(window.startMinute)}–{formatMinutes(window.endMinute)} · {window.timezone}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={isSubmitting}
                          onClick={() => setEditingWindow(window)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          disabled={isSubmitting}
                          onClick={() => void handleDelete(window)}
                        >
                          Delete
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
