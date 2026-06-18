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
import type { ApiFieldError, CreateEventInput, Event, Game } from '../../types/index';
import { canEditEventDetails, isEventEditable } from '../../utils/eventRules';

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

  return {
    scheduledStart: toDateTimeLocalValue(start.toISOString()),
    scheduledEnd: toDateTimeLocalValue(end.toISOString()),
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
    maxPlayers: String(event.maxPlayers),
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
  const [maxPlayers, setMaxPlayers] = useState('10');

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
            setLoadError('Вы можете редактировать только события, которые организуете.');
            return;
          }

          if (!isEventEditable(event.status)) {
            setLoadError('Завершённые и отменённые события нельзя редактировать.');
            return;
          }

          if (!canEditEventDetails(event)) {
            setLoadError(
              'Редактировать можно только события в статусе «Регистрация» без зарегистрированных игроков.',
            );
            return;
          }

          const formValues = applyEventToForm(event);
          setGameId(formValues.gameId);
          setTitle(formValues.title);
          setDescription(formValues.description);
          setServerRegion(formValues.serverRegion);
          setScheduledStart(formValues.scheduledStart);
          setScheduledEnd(formValues.scheduledEnd);
          setMaxPlayers(formValues.maxPlayers);
        } else if (gameList.length > 0) {
          setGameId(String(gameList.find((game) => game.isActive)?.id ?? gameList[0].id));
        }
      } catch {
        if (active) {
          setLoadError(isEditMode ? 'Не удалось загрузить детали события.' : 'Не удалось загрузить список игр.');
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

    if (end <= start) {
      setFormError('Время окончания должно быть позже времени начала.');
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
    maxPlayers: Number(maxPlayers),
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
      } else {
        const created = await eventService.createEvent(payload);
        dispatch(upsertEvent(created));
      }

      navigate('/organizer/events');
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
        setFieldErrors(mapFieldErrors(error.errors));
      } else {
        setFormError(isEditMode ? 'Не удалось обновить событие.' : 'Не удалось создать событие.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner label={isEditMode ? 'Загрузка события' : 'Загрузка формы'} size="lg" />
      </div>
    );
  }

  if (loadError) {
    return (
      <EmptyState
        title={isEditMode ? 'Событие недоступно' : 'Форма недоступна'}
        description={loadError}
        action={
          <Link to="/organizer/events">
            <Button variant="secondary">Назад к событиям</Button>
          </Link>
        }
      />
    );
  }

  const gameOptions = games.map((game) => ({
    value: String(game.id),
    label: `${game.title} (${game.platform})`,
  }));

  return (
    <div className="space-y-6">
      {isEditMode ? (
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/organizer/events">
            <Button type="button" variant="secondary">
              Назад к событиям
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Создайте новое событие с расписанием и параметрами регистрации.
          </p>
          <Link to="/organizer/events">
            <Button type="button" variant="secondary">
              Назад к событиям
            </Button>
          </Link>
        </div>
      )}

      <Card
        title={isEditMode ? undefined : 'Новое событие'}
        description={
          isEditMode
            ? undefined
            : 'Укажите игру, расписание и вместимость. Регистрация закрывается автоматически за час до начала.'
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <SelectDropdown
            label="Игра"
            name="gameId"
            value={gameId}
            onChange={(event) => setGameId(event.target.value)}
            options={gameOptions}
            placeholder="Выберите игру"
            error={fieldErrors.gameId}
            required
          />

          <TextInput
            label="Название"
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            error={fieldErrors.title}
            required
            maxLength={160}
          />

          <TextArea
            label="Описание"
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            error={fieldErrors.description}
            required
            rows={5}
          />

          <TextInput
            label="Регион сервера"
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
              label="Начало"
              name="scheduledStart"
              type="datetime-local"
              value={scheduledStart}
              onChange={(event) => setScheduledStart(event.target.value)}
              error={fieldErrors.scheduledStart}
              required
            />
            <TextInput
              label="Окончание"
              name="scheduledEnd"
              type="datetime-local"
              value={scheduledEnd}
              onChange={(event) => setScheduledEnd(event.target.value)}
              error={fieldErrors.scheduledEnd}
              required
            />
          </div>

          <TextInput
            label="Макс. игроков"
            name="maxPlayers"
            type="number"
            min={1}
            value={maxPlayers}
            onChange={(event) => setMaxPlayers(event.target.value)}
            error={fieldErrors.maxPlayers}
            required
          />

          {formError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {formError}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Сохранение...' : isEditMode ? 'Сохранить изменения' : 'Создать событие'}
            </Button>
            <Link to="/organizer/events">
              <Button type="button" variant="secondary" disabled={isSubmitting}>
                Отмена
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
