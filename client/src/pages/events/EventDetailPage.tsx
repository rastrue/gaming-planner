import { Link, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import SelectDropdown from '../../components/ui/SelectDropdown';
import Spinner from '../../components/ui/Spinner';
import TextInput from '../../components/ui/TextInput';
import { useAuth } from '../../hooks/useAuth';
import {
  formatEventStatus,
  formatRegistrationStatus,
  weekdayLabelsLong,
} from '../../utils/labels';
import * as availabilityService from '../../services/availabilityService';
import * as eventService from '../../services/eventService';
import * as registrationService from '../../services/registrationService';
import * as rosterService from '../../services/rosterService';
import { ApiError } from '../../services/apiClient';
import { upsertEvent } from '../../store/eventsSlice';
import { upsertRegistration } from '../../store/registrationsSlice';
import type { AppDispatch } from '../../store/store';
import type {
  AvailabilityWindow,
  Event,
  EventSlot,
  EventStatus,
  Registration,
  RegistrationStatus,
} from '../../types/index';
import { canPlayerCancelRegistration, isRegistrationOpen } from '../../utils/eventRules';

const dateLocale = 'en-US';

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString(dateLocale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatMinutes(minute: number): string {
  const hours = Math.floor(minute / 60);
  const minutes = minute % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function eventStatusVariant(status: EventStatus) {
  switch (status) {
    case 'REGISTRATION':
      return 'success';
    case 'FULL':
      return 'warning';
    case 'WAITING':
      return 'default';
    case 'STARTED':
      return 'info';
    case 'COMPLETED':
      return 'info';
    case 'CANCELLED':
      return 'danger';
    default:
      return 'default';
  }
}

function registrationStatusVariant(status: RegistrationStatus) {
  switch (status) {
    case 'APPROVED':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'DECLINED':
      return 'danger';
    default:
      return 'default';
  }
}

export default function EventDetailPage() {
  const { id } = useParams();
  const eventId = Number(id);
  const dispatch = useDispatch<AppDispatch>();
  const { user, isPlayer } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [slots, setSlots] = useState<EventSlot[]>([]);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [availability, setAvailability] = useState<AvailabilityWindow[]>([]);
  const [requestedRoleName, setRequestedRoleName] = useState('');
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!Number.isFinite(eventId)) {
      setLoadError('Invalid event identifier.');
      setIsLoading(false);
      return;
    }

    let active = true;

    const loadEventDetails = async () => {
      setIsLoading(true);
      setLoadError('');

      try {
        const [eventData, slotData] = await Promise.all([
          eventService.getEventById(eventId),
          rosterService.getEventSlots(eventId),
        ]);

        if (!active) {
          return;
        }

        setEvent(eventData);
        setSlots(slotData);
        dispatch(upsertEvent(eventData));

        if (isPlayer && user) {
          const [registrationData, availabilityData] = await Promise.all([
            registrationService.getRegistrations({ eventId, pageSize: 50 }),
            availabilityService.getAvailabilityWindows(),
          ]);

          if (!active) {
            return;
          }

          const existingRegistration =
            registrationData.registrations.find((item) => item.eventId === eventId) ?? null;
          setRegistration(existingRegistration);
          setAvailability(availabilityData);

          if (existingRegistration?.requestedRoleName) {
            setRequestedRoleName(existingRegistration.requestedRoleName);
          }
        }
      } catch {
        if (active) {
          setLoadError('Unable to load event details.');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadEventDetails();

    return () => {
      active = false;
    };
  }, [dispatch, eventId, isPlayer, user]);

  const matchingAvailability = useMemo(() => {
    if (!event) {
      return [];
    }

    const eventDay = new Date(event.scheduledStart).getDay();
    return availability.filter((window) => window.dayOfWeek === eventDay);
  }, [availability, event]);

  const canRegister =
    isPlayer &&
    event &&
    isRegistrationOpen(event) &&
    (!registration || registration.status === 'CANCELLED' || registration.status === 'DECLINED');

  const canCancelRegistration =
    isPlayer &&
    registration &&
    ['PENDING', 'APPROVED'].includes(registration.status) &&
    event &&
    canPlayerCancelRegistration(event);

  const roleOptions = slots.map((slot) => ({
    value: slot.roleName,
    label: `${slot.roleName} (${slot._count.registrations}/${slot.requiredCount})`,
  }));

  const handleRegister = async () => {
    if (!event) {
      return;
    }

    setFormError('');
    setIsSubmitting(true);

    try {
      const created = await registrationService.createRegistration({
        eventId: event.id,
        requestedRoleName: requestedRoleName.trim() || undefined,
      });
      setRegistration(created);
      dispatch(upsertRegistration(created));

      const refreshedEvent = await eventService.getEventById(event.id);
      setEvent(refreshedEvent);
      dispatch(upsertEvent(refreshedEvent));
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
      } else {
        setFormError('Unable to register for this event.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!registration) {
      return;
    }

    setFormError('');
    setIsSubmitting(true);

    try {
      const cancelled = await registrationService.cancelRegistration(registration.id);
      setRegistration(cancelled);
      dispatch(upsertRegistration(cancelled));
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
      } else {
        setFormError('Unable to cancel registration.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner label="Loading event details" size="lg" />
      </div>
    );
  }

  if (loadError || !event) {
    return (
      <EmptyState
        title="Event not found"
        description={loadError ?? 'Unable to load this event.'}
        action={
          <Link to="/events">
            <Button variant="secondary">Back to events</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card
        title={event.title}
        description={`Organizer: ${event.organizer.displayName} · ${event.game.title}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={eventStatusVariant(event.status)}>{formatEventStatus(event.status)}</Badge>
          <Badge>{event.game.genre}</Badge>
          <Badge>{event.serverRegion}</Badge>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-700 dark:text-slate-300">{event.description}</p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Schedule" description="Event timing. Registration closes one hour before start.">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="font-medium text-slate-700 dark:text-slate-200">Start</dt>
              <dd className="text-slate-600 dark:text-slate-400">{formatDateTime(event.scheduledStart)}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-700 dark:text-slate-200">End</dt>
              <dd className="text-slate-600 dark:text-slate-400">{formatDateTime(event.scheduledEnd)}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-700 dark:text-slate-200">Registration closes</dt>
              <dd className="text-slate-600 dark:text-slate-400">
                {formatDateTime(event.registrationDeadline)}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-slate-700 dark:text-slate-200">Capacity</dt>
              <dd className="text-slate-600 dark:text-slate-400">
                {event._count.registrations} / {event.maxPlayers} players registered
              </dd>
            </div>
          </dl>
        </Card>

        <Card title="Roster summary" description="Required roles and current fill status.">
          {slots.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">Roster slots have not been defined yet.</p>
          ) : (
            <ul className="space-y-3">
              {slots.map((slot) => (
                <li
                  key={slot.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800"
                >
                  <span className="font-medium text-slate-900 dark:text-slate-100">{slot.roleName}</span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {slot._count.registrations} / {slot.requiredCount}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {isPlayer ? (
        <>
          <Card title="Your availability" description="Availability windows on the day of this event.">
            {matchingAvailability.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                You have no availability windows on {weekdayLabelsLong[new Date(event.scheduledStart).getDay()]}.
              </p>
            ) : (
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                {matchingAvailability.map((window) => (
                  <li key={window.id}>
                    {weekdayLabelsLong[window.dayOfWeek]} · {formatMinutes(window.startMinute)}–
                    {formatMinutes(window.endMinute)} ({window.timezone})
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Registration" description="Join this event as a player.">
            {registration && registration.status !== 'CANCELLED' && registration.status !== 'DECLINED' ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Your status:</span>
                  <Badge variant={registrationStatusVariant(registration.status)}>
                    {formatRegistrationStatus(registration.status)}
                  </Badge>
                </div>
                {registration.requestedRoleName ? (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Requested role: {registration.requestedRoleName}
                  </p>
                ) : null}
                {canCancelRegistration ? (
                  <Button
                    type="button"
                    variant="danger"
                    disabled={isSubmitting}
                    onClick={() => void handleCancelRegistration()}
                  >
                    Cancel registration
                  </Button>
                ) : null}
              </div>
            ) : canRegister ? (
              <div className="space-y-4">
                {roleOptions.length > 0 ? (
                  <SelectDropdown
                    label="Preferred role (optional)"
                    value={requestedRoleName}
                    onChange={(changeEvent) => setRequestedRoleName(changeEvent.target.value)}
                    placeholder="No preference"
                    options={roleOptions}
                  />
                ) : (
                  <TextInput
                    label="Preferred role (optional)"
                    value={requestedRoleName}
                    onChange={(changeEvent) => setRequestedRoleName(changeEvent.target.value)}
                    placeholder="e.g. Tank, Healer, DPS"
                  />
                )}
                <Button type="button" disabled={isSubmitting} onClick={() => void handleRegister()}>
                  {isSubmitting ? 'Submitting...' : 'Register for event'}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Registration for this event is currently closed.
              </p>
            )}

            {formError ? (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                {formError}
              </p>
            ) : null}
          </Card>
        </>
      ) : null}
    </div>
  );
}
