import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import Spinner from '../../components/ui/Spinner';
import TableActionPlaceholder from '../../components/ui/TableActionPlaceholder';
import { useAuth } from '../../hooks/useAuth';
import * as eventService from '../../services/eventService';
import { ApiError } from '../../services/apiClient';
import { setEvents, upsertEvent } from '../../store/eventsSlice';
import type { AppDispatch, RootState } from '../../store/store';
import { formatEventStatus } from '../../i18n/labels';
import type { Event, EventStatus } from '../../types/index';
import { canCancelOpenEvent, canCompleteEventStatus, canEditEventDetails, isEventEditable } from '../../utils/eventRules';

const PAGE_SIZE = 10;
const dateLocale = 'ru-RU';

function formatEventDate(value: string): string {
  return new Date(value).toLocaleString(dateLocale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function canCompleteEvent(event: Event): boolean {
  return canCompleteEventStatus(event.status, event.scheduledStart);
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

export default function OrganizerEventsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();
  const events = useSelector((state: RootState) => state.events.items);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busyEventId, setBusyEventId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;

    const loadEvents = async () => {
      setIsLoading(true);
      setLoadError('');

      try {
        const data = await eventService.getEvents({
          pageSize: 100,
          sort: 'scheduledStart',
          order: 'desc',
        });

        if (active) {
          dispatch(setEvents(data));
        }
      } catch {
        if (active) {
          setLoadError('Не удалось загрузить события организатора.');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadEvents();

    return () => {
      active = false;
    };
  }, [dispatch, user]);

  const myEvents = useMemo(
    () => events.filter((event) => event.organizerId === user?.id),
    [events, user?.id],
  );

  const totalPages = Math.max(1, Math.ceil(myEvents.length / PAGE_SIZE));
  const paginatedEvents = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return myEvents.slice(start, start + PAGE_SIZE);
  }, [myEvents, page]);

  const updateStatus = async (event: Event, status: EventStatus) => {
    setActionError('');
    setBusyEventId(event.id);

    try {
      const updated = await eventService.updateEvent(event.id, { status });
      dispatch(upsertEvent(updated));
    } catch (error) {
      if (error instanceof ApiError) {
        setActionError(error.message);
      } else {
        setActionError('Не удалось обновить статус события.');
      }
    } finally {
      setBusyEventId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner label="Загрузка событий организатора" size="lg" />
      </div>
    );
  }

  if (loadError) {
    return <EmptyState title="События недоступны" description={loadError} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/organizer/events/new">
          <Button>Создать событие</Button>
        </Link>
      </div>

      {actionError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {actionError}
        </p>
      ) : null}

      {myEvents.length === 0 ? (
        <EmptyState
          title="Событий пока нет"
          description="Создайте первое событие, чтобы начать принимать регистрации игроков."
          action={
            <Link to="/organizer/events/new">
              <Button>Создать событие</Button>
            </Link>
          }
        />
      ) : (
        <>
          <DataTable<Event>
            caption="События организатора"
            data={paginatedEvents}
            getRowKey={(event) => event.id}
            columns={[
              {
                key: 'title',
                header: 'Событие',
                mobileLabel: 'Событие',
                render: (event) => (
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{event.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{event.game.title}</p>
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Статус',
                render: (event) => (
                  <Badge variant={eventStatusVariant(event.status)}>{formatEventStatus(event.status)}</Badge>
                ),
              },
              {
                key: 'schedule',
                header: 'Начало',
                render: (event) => formatEventDate(event.scheduledStart),
              },
              {
                key: 'registrations',
                header: 'Игроки',
                hideOnMobile: true,
                render: (event) => `${event._count.registrations} / ${event.maxPlayers}`,
              },
              {
                key: 'actions',
                header: 'Действия',
                mobileLabel: 'Действия',
                render: (event) => {
                  const isBusy = busyEventId === event.id;
                  const editable = isEventEditable(event.status);
                  const canEditDetails = canEditEventDetails(event);
                  const showComplete = canCompleteEvent(event);
                  const showCancel = canCancelOpenEvent(event.status);
                  const showRosterBoard = editable;
                  const showAttendance = event.status === 'COMPLETED';

                  const hasEventActions = editable && (showCancel || showComplete || canEditDetails);
                  const hasRosterActions = showRosterBoard || showAttendance;

                  if (!hasEventActions && !hasRosterActions) {
                    return <TableActionPlaceholder />;
                  }

                  return (
                    <div className="flex flex-wrap gap-2">
                      {showCancel ? (
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          disabled={isBusy}
                          onClick={() => void updateStatus(event, 'CANCELLED')}
                        >
                          Отменить
                        </Button>
                      ) : null}
                      {showComplete ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={isBusy}
                          onClick={() => void updateStatus(event, 'COMPLETED')}
                        >
                          Завершить
                        </Button>
                      ) : null}
                      {canEditDetails ? (
                        <Link to={`/organizer/events/${event.id}/edit`}>
                          <Button type="button" variant="secondary" size="sm">
                            Редактировать
                          </Button>
                        </Link>
                      ) : null}
                      {showRosterBoard ? (
                        <Link to={`/organizer/events/${event.id}/roster`}>
                          <Button type="button" size="sm">
                            Состав
                          </Button>
                        </Link>
                      ) : null}
                      {showAttendance ? (
                        <Link to={`/organizer/events/${event.id}/roster`}>
                          <Button type="button" size="sm" variant="secondary">
                            Посещаемость
                          </Button>
                        </Link>
                      ) : null}
                    </div>
                  );
                },
              },
            ]}
          />

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
