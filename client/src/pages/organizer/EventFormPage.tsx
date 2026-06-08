import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import SelectDropdown from '../../components/ui/SelectDropdown';
import Spinner from '../../components/ui/Spinner';
import TextArea from '../../components/ui/TextArea';
import TextInput from '../../components/ui/TextInput';
import { useAuth } from '../../hooks/useAuth';
import * as eventService from '../../services/eventService';
import * as gameService from '../../services/gameService';
import { ApiError } from '../../services/apiClient';
import { upsertEvent } from '../../store/eventsSlice';
import type { AppDispatch } from '../../store/store';
import type { ApiFieldError, CreateEventInput, Event, EventStatus, Game } from '../../types/index';
import EventSlotEditor from './EventSlotEditor';

const statusOptions: { value: EventStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'OPEN', label: 'Open' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

function mapFieldErrors(errors?: ApiFieldError[]): Record<string, string> {
  const mapped: Record<string, string> = {};
  errors?.forEach((error) => {
    mapped[error.field] = error.message;
  });
  return mapped;
}

function toDateTimeLocalValue(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDateTimeLocalValue(value: string): string {
  return new Date(value).toISOString();
}

function defaultScheduleValues() {
  const start = new Date();
  start.setDate(start.getDate() + 7);
  start.setHours(19, 0, 0, 0);

  const end = new Date(start);
  end.setHours(22, 0, 0, 0);

  const deadline = new Date(start);
  deadline.setDate(deadline.getDate() - 1);
  deadline.setHours(23, 59, 0, 0);

  return {
    scheduledStart: toDateTimeLocalValue(start.toISOString()),
    scheduledEnd: toDateTimeLocalValue(end.toISOString()),
    registrationDeadline: toDateTimeLocalValue(deadline.toISOString()),
  };
}

function applyEventToForm(event: Event) {
  return {
    gameId: String(event.gameId),
    title: event.title,
    description: event.description,
    serverRegion: event.serverRegion,
    scheduledStart: toDateTimeLocalValue(event.scheduledStart),
    scheduledEnd: toDateTimeLocalValue(event.scheduledEnd),
    registrationDeadline: toDateTimeLocalValue(event.registrationDeadline),
    maxPlayers: String(event.maxPlayers),
    status: event.status,
  };
}

export default function EventFormPage() {
  const { id } = useParams();
  const eventId = id ? Number(id) : null;
  const isEditMode = eventId !== null && Number.isFinite(eventId);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();

  const [games, setGames] = useState<Game[]>([]);
  const [savedEvent, setSavedEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [loadError, setLoadError] = useState('');
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaults = defaultScheduleValues();
  const [gameId, setGameId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [serverRegion, setServerRegion] = useState('');
  const [scheduledStart, setScheduledStart] = useState(defaults.scheduledStart);
  const [scheduledEnd, setScheduledEnd] = useState(defaults.scheduledEnd);
  const [registrationDeadline, setRegistrationDeadline] = useState(defaults.registrationDeadline);
  const [maxPlayers, setMaxPlayers] = useState('10');
  const [status, setStatus] = useState<EventStatus>('DRAFT');

  useEffect(() => {
    let active = true;

    const loadFormData = async () => {
      setIsLoading(true);
      setLoadError('');

      try {
        const gameList = await gameService.getGames();
        if (!active) {
          return;
        }

        setGames(gameList.filter((game) => game.isActive));

        if (isEditMode && eventId) {
          const event = await eventService.getEventById(eventId);

          if (!active) {
            return;
          }

          if (event.organizerId !== user?.id) {
            setLoadError('You can only edit events that you organize.');
            return;
          }

          const formValues = applyEventToForm(event);
          setSavedEvent(event);
          setGameId(formValues.gameId);
          setTitle(formValues.title);
          setDescription(formValues.description);
          setServerRegion(formValues.serverRegion);
          setScheduledStart(formValues.scheduledStart);
          setScheduledEnd(formValues.scheduledEnd);
          setRegistrationDeadline(formValues.registrationDeadline);
          setMaxPlayers(formValues.maxPlayers);
          setStatus(formValues.status);
        } else if (gameList.length > 0) {
          setGameId(String(gameList.find((game) => game.isActive)?.id ?? gameList[0].id));
        }
      } catch {
        if (active) {
          setLoadError(isEditMode ? 'Unable to load event details.' : 'Unable to load games.');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadFormData();

    return () => {
      active = false;
    };
  }, [eventId, isEditMode, user?.id]);

  const validateLocally = (): boolean => {
    const start = new Date(scheduledStart);
    const end = new Date(scheduledEnd);
    const deadline = new Date(registrationDeadline);

    if (end <= start) {
      setFormError('Scheduled end must be after scheduled start.');
      return false;
    }

    if (deadline > start) {
      setFormError('Registration deadline must be on or before scheduled start.');
      return false;
    }

    return true;
  };

  const buildPayload = (): CreateEventInput => ({
    gameId: Number(gameId),
    title: title.trim(),
    description: description.trim(),
    serverRegion: serverRegion.trim(),
    scheduledStart: fromDateTimeLocalValue(scheduledStart),
    scheduledEnd: fromDateTimeLocalValue(scheduledEnd),
    registrationDeadline: fromDateTimeLocalValue(registrationDeadline),
    maxPlayers: Number(maxPlayers),
    status,
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setFieldErrors({});

    if (!validateLocally()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = buildPayload();

      if (isEditMode && eventId) {
        const updated = await eventService.updateEvent(eventId, payload);
        dispatch(upsertEvent(updated));
        setSavedEvent(updated);
      } else {
        const created = await eventService.createEvent(payload);
        dispatch(upsertEvent(created));
        navigate(`/organizer/events/${created.id}/edit`, { replace: true });
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
        setFieldErrors(mapFieldErrors(error.errors));
      } else {
        setFormError(isEditMode ? 'Unable to update event.' : 'Unable to create event.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner label={isEditMode ? 'Loading event' : 'Loading form'} size="lg" />
      </div>
    );
  }

  if (loadError) {
    return (
      <EmptyState
        title={isEditMode ? 'Event unavailable' : 'Form unavailable'}
        description={loadError}
        action={
          <Link to="/organizer/events">
            <Button variant="secondary">Back to events</Button>
          </Link>
        }
      />
    );
  }

  const gameOptions = games.map((game) => ({
    value: String(game.id),
    label: `${game.title} (${game.platform})`,
  }));

  const slotEventId = savedEvent?.id ?? (isEditMode ? eventId : null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {isEditMode
            ? 'Update event details and manage roster slot requirements.'
            : 'Create a new event, then define roster slots after saving.'}
        </p>
        <Link to="/organizer/events">
          <Button type="button" variant="secondary">
            Back to events
          </Button>
        </Link>
      </div>

      <Card
        title={isEditMode ? 'Event details' : 'New event'}
        description="Set the game, schedule, registration window, and capacity."
      >
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <SelectDropdown
            label="Game"
            name="gameId"
            value={gameId}
            onChange={(event) => setGameId(event.target.value)}
            options={gameOptions}
            placeholder="Select a game"
            error={fieldErrors.gameId}
            required
          />

          <TextInput
            label="Title"
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            error={fieldErrors.title}
            required
            maxLength={160}
          />

          <TextArea
            label="Description"
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            error={fieldErrors.description}
            required
            rows={5}
          />

          <TextInput
            label="Server region"
            name="serverRegion"
            value={serverRegion}
            onChange={(event) => setServerRegion(event.target.value)}
            error={fieldErrors.serverRegion}
            required
            maxLength={64}
            placeholder="NA East, EU West..."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="Scheduled start"
              name="scheduledStart"
              type="datetime-local"
              value={scheduledStart}
              onChange={(event) => setScheduledStart(event.target.value)}
              error={fieldErrors.scheduledStart}
              required
            />
            <TextInput
              label="Scheduled end"
              name="scheduledEnd"
              type="datetime-local"
              value={scheduledEnd}
              onChange={(event) => setScheduledEnd(event.target.value)}
              error={fieldErrors.scheduledEnd}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="Registration deadline"
              name="registrationDeadline"
              type="datetime-local"
              value={registrationDeadline}
              onChange={(event) => setRegistrationDeadline(event.target.value)}
              error={fieldErrors.registrationDeadline}
              required
            />
            <TextInput
              label="Max players"
              name="maxPlayers"
              type="number"
              min={1}
              value={maxPlayers}
              onChange={(event) => setMaxPlayers(event.target.value)}
              error={fieldErrors.maxPlayers}
              required
            />
          </div>

          <SelectDropdown
            label="Status"
            name="status"
            value={status}
            onChange={(event) => setStatus(event.target.value as EventStatus)}
            options={statusOptions.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            error={fieldErrors.status}
          />

          {formError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {formError}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditMode ? 'Save changes' : 'Create event'}
            </Button>
            <Link to="/organizer/events">
              <Button type="button" variant="secondary" disabled={isSubmitting}>
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </Card>

      {slotEventId ? <EventSlotEditor eventId={slotEventId} /> : null}
    </div>
  );
}
