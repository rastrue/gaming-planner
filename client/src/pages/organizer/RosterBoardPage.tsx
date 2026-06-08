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
  return new Date(value).toLocaleString(undefined, {
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
      setLoadError('Invalid event id.');
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
        setLoadError('You can only manage rosters for events that you organize.');
        return;
      }

      setEvent(eventData);
      setSlots(board.slots);
      setRegistrations(board.registrations);
    } catch {
      setLoadError('Unable to load roster board.');
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
        setActionError('Unable to update registration.');
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
        <Spinner label="Loading roster board" size="lg" />
      </div>
    );
  }

  if (loadError || !event) {
    return (
      <EmptyState
        title="Roster unavailable"
        description={loadError || 'Event not found.'}
        action={
          <Link to="/organizer/events">
            <Button variant="secondary">Back to events</Button>
          </Link>
        }
      />
    );
  }

  const canMarkAttendance = event.status === 'COMPLETED';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{event.title}</h2>
            <Badge variant={eventStatusVariant(event.status)}>{event.status}</Badge>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {event.game.title} · Starts {formatEventDate(event.scheduledStart)}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Drag approved players into roster slots. {canMarkAttendance ? 'Mark attendance below each assignment.' : 'Attendance unlocks after the event is completed.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/organizer/events/${event.id}/edit`}>
            <Button type="button" variant="secondary">
              Edit event
            </Button>
          </Link>
          <Link to="/organizer/events">
            <Button type="button" variant="ghost">
              Back to events
            </Button>
          </Link>
        </div>
      </div>

      {actionError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {actionError}
        </p>
      ) : null}

      <RegistrationReviewPanel
        registrations={registrations}
        busyId={busyRegistrationId}
        onApprove={handleApprove}
        onDecline={handleDecline}
        onCancel={handleCancel}
      />

      <Card
        title="Unassigned players"
        description="Approved players waiting for a slot assignment. Drag them into a column below."
      >
        <div
          onDragOver={(dragEvent) => {
            allowDrop(dragEvent);
            setDragOverSlotId('unassigned');
          }}
          onDragLeave={() => setDragOverSlotId(null)}
          onDrop={handleDropOnUnassigned}
          className={`min-h-24 rounded-lg border border-dashed p-3 transition-colors ${
            dragOverSlotId === 'unassigned'
              ? 'border-primary-400 bg-primary-50 dark:border-primary-700 dark:bg-primary-950/40'
              : 'border-slate-300 dark:border-slate-700'
          }`}
        >
          {unassignedApproved.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              All approved players are assigned to slots.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {unassignedApproved.map((registration) => (
                <PlayerAssignmentCard
                  key={registration.id}
                  registration={registration}
                  draggable
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  isDragging={draggingRegistrationId === registration.id}
                />
              ))}
            </div>
          )}
        </div>
      </Card>

      {slots.length === 0 ? (
        <EmptyState
          title="No roster slots defined"
          description="Add roster slots on the event edit page before assigning players."
          action={
            <Link to={`/organizer/events/${event.id}/edit`}>
              <Button>Edit event slots</Button>
            </Link>
          }
        />
      ) : (
        <section aria-label="Roster slot board" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {slots.map((slot) => (
            <RosterSlotColumn
              key={slot.id}
              slot={slot}
              assignments={assignmentsBySlot.get(slot.id) ?? []}
              isDragOver={dragOverSlotId === slot.id}
              canMarkAttendance={canMarkAttendance}
              busyRegistrationId={busyRegistrationId}
              draggingRegistrationId={draggingRegistrationId}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={(dragEvent) => {
                allowDrop(dragEvent);
                setDragOverSlotId(slot.id);
              }}
              onDragLeave={() => setDragOverSlotId(null)}
              onDrop={handleDropOnSlot(slot.id)}
              onMarkAttendance={handleMarkAttendance}
            />
          ))}
        </section>
      )}
    </div>
  );
}
