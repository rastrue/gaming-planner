import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import ChartContainer from '../../components/ui/ChartContainer';
import EmptyState from '../../components/ui/EmptyState';
import ProgressBar from '../../components/ui/ProgressBar';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../hooks/useAuth';
import { formatEventStatus, formatRegistrationStatus } from '../../i18n/labels';
import * as eventService from '../../services/eventService';
import * as registrationService from '../../services/registrationService';
import { setEvents } from '../../store/eventsSlice';
import { setRegistrations } from '../../store/registrationsSlice';
import type { AppDispatch, RootState } from '../../store/store';
import type { Event, EventStatus, Registration, RegistrationStatus } from '../../types/index';

const dateLocale = 'ru-RU';

function formatEventDate(value: string): string {
  return new Date(value).toLocaleString(dateLocale, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

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

function registrationStatusVariant(status: RegistrationStatus) {
  switch (status) {
    case 'APPROVED':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'DECLINED':
      return 'danger';
    case 'CANCELLED':
      return 'default';
    default:
      return 'default';
  }
}

export default function OrganizerDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();
  const events = useSelector((state: RootState) => state.events.items);
  const registrations = useSelector((state: RootState) => state.registrations.items);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;

    const loadDashboard = async () => {
      setIsLoading(true);
      setLoadError('');

      try {
        const [eventsData, pendingRegistrations] = await Promise.all([
          eventService.getEvents({ pageSize: 100, sort: 'scheduledStart', order: 'desc' }),
          registrationService.getRegistrations({ status: 'PENDING', pageSize: 20 }),
        ]);

        if (!active) {
          return;
        }

        dispatch(setEvents(eventsData));
        dispatch(setRegistrations(pendingRegistrations));
      } catch {
        if (active) {
          setLoadError('Не удалось загрузить данные панели организатора.');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      active = false;
    };
  }, [dispatch, user]);

  const myEvents = useMemo(
    () => events.filter((event) => event.organizerId === user?.id),
    [events, user?.id],
  );

  const stats = useMemo(
    () => ({
      totalEvents: myEvents.length,
      openEvents: myEvents.filter((event) => event.status === 'OPEN').length,
      pendingReviews: registrations.length,
      completedEvents: myEvents.filter((event) => event.status === 'COMPLETED').length,
    }),
    [myEvents, registrations.length],
  );

  const statusBreakdown = useMemo(() => {
    const counts = new Map<EventStatus, number>();
    myEvents.forEach((event) => {
      counts.set(event.status, (counts.get(event.status) ?? 0) + 1);
    });

    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [myEvents]);

  const rosterFillRate = useMemo(() => {
    if (myEvents.length === 0) {
      return 0;
    }

    const filled = myEvents.reduce((sum, event) => sum + event._count.registrations, 0);
    const capacity = myEvents.reduce((sum, event) => sum + event.maxPlayers, 0);
    return capacity === 0 ? 0 : Math.round((filled / capacity) * 100);
  }, [myEvents]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner label="Загрузка панели организатора" size="lg" />
      </div>
    );
  }

  if (loadError) {
    return (
      <EmptyState
        title="Панель недоступна"
        description={loadError}
      />
    );
  }

  return (
    <div className="space-y-6">
      <section aria-labelledby="organizer-stats-heading">
        <h2 id="organizer-stats-heading" className="sr-only">
          Статистика организатора
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card title="Управляемые события" description="События, которые вы организуете.">
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stats.totalEvents}</p>
          </Card>
          <Card title="Открыты для регистрации" description="Сейчас принимают игроков.">
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.openEvents}</p>
          </Card>
          <Card title="Ожидают проверки" description="Регистрации, ожидающие одобрения.">
            <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{stats.pendingReviews}</p>
          </Card>
          <Card title="Завершённые события" description="Проведённые сессии.">
            <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">{stats.completedEvents}</p>
          </Card>
        </div>
      </section>

      <section aria-labelledby="organizer-insights-heading" className="space-y-4">
        <h2 id="organizer-insights-heading" className="sr-only">
          Аналитика организатора
        </h2>
        <div className="grid gap-6 xl:grid-cols-2">
        <ChartContainer
          title="Распределение статусов"
          description="Распределение ваших событий по статусам жизненного цикла."
          legend={
            statusBreakdown.length > 0 ? (
              <span className="text-slate-600 dark:text-slate-400">Всего событий: {myEvents.length}</span>
            ) : null
          }
        >
          {statusBreakdown.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">Создайте событие, чтобы увидеть статистику.</p>
          ) : (
            <ul className="space-y-3">
              {statusBreakdown.map(([status, count]) => {
                const width = myEvents.length === 0 ? 0 : Math.round((count / myEvents.length) * 100);

                return (
                  <li key={status}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-200">{formatEventStatus(status)}</span>
                      <span className="text-slate-600 dark:text-slate-400">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-primary-600 dark:bg-primary-500"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </ChartContainer>

        <Card title="Заполненность состава" description="Соотношение регистраций к общей вместимости.">
          <ProgressBar label="Средняя заполненность управляемых событий" value={rosterFillRate} max={100} />
        </Card>
        </div>
      </section>

      <section aria-labelledby="organizer-actions-heading">
        <Card title="Быстрые действия" description="Основные рабочие процессы управления.">
          <h2 id="organizer-actions-heading" className="sr-only">
            Быстрые действия организатора
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link to="/organizer/events/new">
              <Button>Создать событие</Button>
            </Link>
            <Link to="/organizer/events">
              <Button variant="secondary">Управление событиями</Button>
            </Link>
            <Link to="/organizer/roster">
              <Button variant="secondary">Доски состава</Button>
            </Link>
            <Link to="/reports">
              <Button variant="ghost">Сформировать отчёты</Button>
            </Link>
          </div>
        </Card>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section aria-labelledby="organizer-events-heading">
          <Card title="Недавние события" description="Последние запланированные сессии.">
            <h2 id="organizer-events-heading" className="sr-only">
              Недавние события организатора
            </h2>
            {myEvents.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">События ещё не созданы.</p>
            ) : (
              <ul className="space-y-3">
                {myEvents.slice(0, 5).map((event: Event) => (
                  <li
                    key={event.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900 dark:text-slate-100">{event.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatEventDate(event.scheduledStart)} · {event._count.registrations} регистраций
                      </p>
                    </div>
                    <Badge variant={eventStatusVariant(event.status)}>{formatEventStatus(event.status)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>

        <section aria-labelledby="organizer-pending-heading">
          <Card title="Ожидающие регистрации" description="Игроки, ожидающие вашего решения.">
            <h2 id="organizer-pending-heading" className="sr-only">
              Ожидающие регистрации
            </h2>
            {registrations.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">Нет ожидающих регистраций.</p>
            ) : (
              <ul className="space-y-3">
                {registrations.slice(0, 5).map((registration: Registration) => (
                  <li
                    key={registration.id}
                    className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {registration.user.displayName}
                      </p>
                      <Badge variant={registrationStatusVariant(registration.status)}>
                        {formatRegistrationStatus(registration.status)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{registration.event.title}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>
      </div>
    </div>
  );
}
