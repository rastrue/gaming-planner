import { type DragEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../hooks/useAuth';
import * as eventService from '../../services/eventService';
import * as registrationService from '../../services/registrationService';
import * as rosterService from '../../services/rosterService';
import { ApiError } from '../../services/apiClient';
import { upsertRegistration } from '../../store/registrationsSlice';
import type { AppDispatch } from '../../store/store';
import type { AttendanceStatus, Event, EventSlot, EventStatus, Registration } from '../../types/index';
import { formatEventStatus } from '../../i18n/labels';
import { isEventEditable } from '../../utils/eventRules';
import RegistrationReviewPanel from './RegistrationReviewPanel';
import RosterSlotColumn, {
  PlayerAssignmentCard,
  REGISTRATION_DRAG_TYPE,
} from './RosterSlotColumn';

function eventStatusVariant(status: EventStatus) {
  switch (status) {
    case 'OPEN':
      return 'success';
    case 'DRAFT':
      return 'default';
    case 'FULL':
      return 'warning';
    case 'COMPLETED':
      return 'info';
    case 'CANCELLED':
    case 'CLOSED':
      return 'danger';
    default:
      return 'default';
  }
}

function formatEventDate(value: string): string {
  return new Date(value).toLocaleString('ru-RU', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function readDraggedRegistrationId(event: DragEvent): number | null {
  const raw = event.dataTransfer.getData(REGISTRATION_DRAG_TYPE);
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function RosterBoardPage() {
  const { eventId: eventIdParam } = useParams();
  const eventId = Number(eventIdParam);
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [slots, setSlots] = useState<EventSlot[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busyRegistrationId, setBusyRegistrationId] = useState<number | null>(null);
  const [draggingRegistrationId, setDraggingRegistrationId] = useState<number | null>(null);
  const [dragOverSlotId, setDragOverSlotId] = useState<number | 'unassigned' | null>(null);

  const loadBoard = useCallback(async () => {
    if (!Number.isFinite(eventId)) {
      setLoadError('Некорректный идентификатор события.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError('');

    try {
      const [eventData, board] = await Promise.all([
        eventService.getEventById(eventId),
        rosterService.getRosterBoard(eventId),
      ]);

      if (eventData.organizerId !== user?.id) {
        setLoadError('Вы можете управлять составом только для событий, которые организуете.');
        return;
      }

      if (eventData.status === 'CANCELLED') {
        setLoadError('Отменённое событие нельзя изменять.');
        return;
      }

      setEvent(eventData);
      setSlots(board.slots);
      setRegistrations(board.registrations);
    } catch {
      setLoadError('Не удалось загрузить доску состава.');
    } finally {
      setIsLoading(false);
    }
  }, [eventId, user?.id]);

  useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  const approvedRegistrations = useMemo(
    () => registrations.filter((registration) => registration.status === 'APPROVED'),
    [registrations],
  );

  const unassignedApproved = useMemo(
    () => approvedRegistrations.filter((registration) => registration.eventSlotId === null),
    [approvedRegistrations],
  );

  const assignmentsBySlot = useMemo(() => {
    const map = new Map<number, Registration[]>();

    slots.forEach((slot) => {
      map.set(slot.id, []);
    });

    approvedRegistrations.forEach((registration) => {
      if (registration.eventSlotId && map.has(registration.eventSlotId)) {
        map.get(registration.eventSlotId)?.push(registration);
      }
    });

    return map;
  }, [approvedRegistrations, slots]);

  const canSlotAcceptRegistration = useCallback(
    (slotId: number, registrationId: number | null) => {
      if (registrationId === null) {
        return false;
      }

      const registration = registrations.find((item) => item.id === registrationId);
      if (!registration || registration.eventSlotId === slotId) {
        return false;
      }

      const slot = slots.find((item) => item.id === slotId);
      if (!slot) {
        return false;
      }

      const assignments = assignmentsBySlot.get(slotId) ?? [];
      return assignments.length < slot.requiredCount;
    },
    [assignmentsBySlot, registrations, slots],
  );

  const updateRegistrationState = (updated: Registration) => {
    setRegistrations((current) =>
      current.map((registration) => (registration.id === updated.id ? updated : registration)),
    );
    dispatch(upsertRegistration(updated));
  };

  const runRegistrationAction = async (registrationId: number, action: () => Promise<Registration>) => {
    setActionError('');
    setBusyRegistrationId(registrationId);

    try {
      const updated = await action();
      updateRegistrationState(updated);
    } catch (error) {
      if (error instanceof ApiError) {
        setActionError(error.message);
      } else {
        setActionError('Не удалось обновить регистрацию.');
      }
    } finally {
      setBusyRegistrationId(null);
    }
  };

  const handleApprove = async (registration: Registration) => {
    await runRegistrationAction(registration.id, () =>
      rosterService.updateRegistrationStatus(registration.id, 'APPROVED'),
    );
  };

  const handleDecline = async (registration: Registration) => {
    await runRegistrationAction(registration.id, () =>
      rosterService.updateRegistrationStatus(registration.id, 'DECLINED'),
    );
  };

  const handleCancel = async (registration: Registration) => {
    await runRegistrationAction(registration.id, () =>
      rosterService.updateRegistrationStatus(registration.id, 'CANCELLED'),
    );
  };

  const handleAssign = async (registrationId: number, slotId: number) => {
    const registration = registrations.find((item) => item.id === registrationId);
    if (!registration || registration.eventSlotId === slotId) {
      return;
    }

    if (!canSlotAcceptRegistration(slotId, registrationId)) {
      setActionError('Слот заполнен.');
      return;
    }

    await runRegistrationAction(registrationId, () =>
      rosterService.assignRegistrationToSlot(registrationId, slotId),
    );
  };

  const handleUnassign = async (registrationId: number) => {
    const registration = registrations.find((item) => item.id === registrationId);
    if (!registration || registration.eventSlotId === null) {
      return;
    }

    await runRegistrationAction(registrationId, () =>
      rosterService.clearRegistrationSlot(registrationId),
    );
  };

  const handleMarkAttendance = async (registration: Registration, attendanceStatus: AttendanceStatus) => {
    await runRegistrationAction(registration.id, () =>
      registrationService.updateAttendance(registration.id, attendanceStatus),
    );
  };

  const handleDragStart = (registrationId: number, dragEvent: DragEvent<HTMLDivElement>) => {
    dragEvent.dataTransfer.setData(REGISTRATION_DRAG_TYPE, String(registrationId));
    dragEvent.dataTransfer.effectAllowed = 'move';
    setDraggingRegistrationId(registrationId);
  };

  const handleDragEnd = () => {
    setDraggingRegistrationId(null);
    setDragOverSlotId(null);
  };

  const allowDrop = (dragEvent: DragEvent) => {
    dragEvent.preventDefault();
    dragEvent.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnSlot = (slotId: number) => async (dragEvent: DragEvent<HTMLDivElement>) => {
    dragEvent.preventDefault();
    setDragOverSlotId(null);

    const registrationId = readDraggedRegistrationId(dragEvent);
    if (!registrationId) {
      return;
    }

    if (!canSlotAcceptRegistration(slotId, registrationId)) {
      setActionError('Слот заполнен.');
      setDraggingRegistrationId(null);
      return;
    }

    await handleAssign(registrationId, slotId);
    setDraggingRegistrationId(null);
  };

  const handleDropOnUnassigned = async (dragEvent: DragEvent<HTMLDivElement>) => {
    dragEvent.preventDefault();
    setDragOverSlotId(null);

    const registrationId = readDraggedRegistrationId(dragEvent);
    if (!registrationId) {
      return;
    }

    await handleUnassign(registrationId);
    setDraggingRegistrationId(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner label="Загрузка доски состава" size="lg" />
      </div>
    );
  }

  if (loadError || !event) {
    return (
      <EmptyState
        title="Состав недоступен"
        description={loadError || 'Событие не найдено.'}
        action={
          <Link to="/organizer/events">
            <Button variant="secondary">Назад к событиям</Button>
          </Link>
        }
      />
    );
  }

  const canMarkAttendance = event.status === 'COMPLETED';
  const canEditRoster = isEventEditable(event.status);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{event.title}</h2>
            <Badge variant={eventStatusVariant(event.status)}>{formatEventStatus(event.status)}</Badge>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {event.game.title} · Начало {formatEventDate(event.scheduledStart)}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {canEditRoster
              ? 'Перетащите одобренных игроков на слоты состава. Отметка посещаемости станет доступна после завершения события.'
              : 'Событие завершено. Доступна только отметка посещаемости.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEditRoster ? (
            <Link to={`/organizer/events/${event.id}/edit`}>
              <Button type="button" variant="secondary">
                Редактировать событие
              </Button>
            </Link>
          ) : null}
          <Link to="/organizer/events">
            <Button type="button" variant="ghost">
              Назад к событиям
            </Button>
          </Link>
        </div>
      </div>

      {actionError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {actionError}
        </p>
      ) : null}

      {canEditRoster ? (
        <RegistrationReviewPanel
          registrations={registrations}
          busyId={busyRegistrationId}
          onApprove={handleApprove}
          onDecline={handleDecline}
          onCancel={handleCancel}
        />
      ) : null}

      <Card
        title="Неназначенные игроки"
        description={
          canEditRoster
            ? 'Одобренные игроки, ожидающие назначения на слот. Перетащите их в колонку ниже.'
            : 'Список одобренных игроков без назначенного слота.'
        }
      >
        <div
          onDragOver={
            canEditRoster
              ? (dragEvent) => {
                  allowDrop(dragEvent);
                  setDragOverSlotId('unassigned');
                }
              : undefined
          }
          onDragLeave={canEditRoster ? () => setDragOverSlotId(null) : undefined}
          onDrop={canEditRoster ? handleDropOnUnassigned : undefined}
          className={`min-h-24 rounded-lg border border-dashed p-3 transition-colors ${
            canEditRoster && dragOverSlotId === 'unassigned'
              ? 'border-primary-400 bg-primary-50 dark:border-primary-700 dark:bg-primary-950/40'
              : 'border-slate-300 dark:border-slate-700'
          }`}
        >
          {unassignedApproved.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Все одобренные игроки назначены на слоты.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {unassignedApproved.map((registration) => (
                <PlayerAssignmentCard
                  key={registration.id}
                  registration={registration}
                  draggable={canEditRoster}
                  onDragStart={canEditRoster ? handleDragStart : undefined}
                  onDragEnd={canEditRoster ? handleDragEnd : undefined}
                  isDragging={draggingRegistrationId === registration.id}
                />
              ))}
            </div>
          )}
        </div>
      </Card>

      {slots.length === 0 ? (
        <EmptyState
          title="Слоты состава не определены"
          description={
            canEditRoster
              ? 'Добавьте слоты состава на странице редактирования события перед назначением игроков.'
              : 'Для этого события слоты состава не были определены.'
          }
          action={
            canEditRoster ? (
              <Link to={`/organizer/events/${event.id}/edit`}>
                <Button>Редактировать слоты события</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <section aria-label="Доска слотов состава" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {slots.map((slot) => {
            const canAcceptDrop = canEditRoster && canSlotAcceptRegistration(slot.id, draggingRegistrationId);

            return (
            <RosterSlotColumn
              key={slot.id}
              slot={slot}
              assignments={assignmentsBySlot.get(slot.id) ?? []}
              canAcceptDrop={canAcceptDrop}
              isDragOver={dragOverSlotId === slot.id && canAcceptDrop}
              canMarkAttendance={canMarkAttendance}
              readOnly={!canEditRoster}
              busyRegistrationId={busyRegistrationId}
              draggingRegistrationId={draggingRegistrationId}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={(dragEvent) => {
                if (!canEditRoster || !canSlotAcceptRegistration(slot.id, draggingRegistrationId)) {
                  dragEvent.dataTransfer.dropEffect = 'none';
                  return;
                }

                allowDrop(dragEvent);
                setDragOverSlotId(slot.id);
              }}
              onDragLeave={() => setDragOverSlotId(null)}
              onDrop={handleDropOnSlot(slot.id)}
              onMarkAttendance={handleMarkAttendance}
            />
            );
          })}
        </section>
      )}
    </div>
  );
}
