import { Link } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../hooks/useAuth';
import * as eventService from '../../services/eventService';
import * as gameService from '../../services/gameService';
import { resetEventsFilters, setEventsFilters, type EventsFilterState } from '../../store/filtersSlice';
import { setEvents } from '../../store/eventsSlice';
import { formatEventStatus } from '../../i18n/labels';
import type { AppDispatch, RootState } from '../../store/store';
import type { Event, EventStatus, ListEventsQuery } from '../../types/index';
import EventFiltersPanel from './EventFiltersPanel';

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

function statusVariant(status: EventStatus) {
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

function buildQuery(filters: EventsFilterState): ListEventsQuery {
  return {
    search: filters.search.trim() || undefined,
    gameId: filters.gameId ?? undefined,
    status: filters.status ?? undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    sort: filters.sort,
    order: filters.order,
    page: filters.page,
    pageSize: filters.pageSize,
    availabilityFit: filters.availabilityFit ? true : undefined,
  };
}

export default function EventsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { isPlayer } = useAuth();
  const filters = useSelector((state: RootState) => state.filters.events);
  const events = useSelector((state: RootState) => state.events.items);
  const pagination = useSelector((state: RootState) => state.events.pagination);
  const [games, setGames] = useState<Awaited<ReturnType<typeof gameService.getGames>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;

    void gameService
      .getGames()
      .then((loadedGames) => {
        if (active) {
          setGames(loadedGames);
        }
      })
      .catch(() => {
        if (active) {
          setGames([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const data = await eventService.getEvents(buildQuery(filters));
      dispatch(setEvents(data));
    } catch {
      setLoadError('Не удалось загрузить события. Измените фильтры и попробуйте снова.');
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, filters]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const handleFiltersChange = (patch: Partial<EventsFilterState>) => {
    dispatch(setEventsFilters(patch));
  };

  const handleResetFilters = () => {
    dispatch(resetEventsFilters());
  };

  return (
    <div className="space-y-6">
      <EventFiltersPanel
        filters={filters}
        games={games}
        showAvailabilityFit={isPlayer}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner label="Загрузка событий" size="lg" />
        </div>
      ) : loadError ? (
        <EmptyState title="События недоступны" description={loadError} />
      ) : events.length === 0 ? (
        <EmptyState
          title="События не найдены"
          description="Попробуйте изменить поисковый запрос или фильтры."
        />
      ) : (
        <>
          <DataTable<Event>
            caption="Каталог событий"
            data={events}
            getRowKey={(event) => event.id}
            columns={[
              {
                key: 'title',
                header: 'Событие',
                mobileLabel: 'Событие',
                render: (event) => (
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{event.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{event.serverRegion}</p>
                  </div>
                ),
              },
              {
                key: 'game',
                header: 'Игра',
                render: (event) => event.game.title,
              },
              {
                key: 'status',
                header: 'Статус',
                render: (event) => (
                  <Badge variant={statusVariant(event.status)}>{formatEventStatus(event.status)}</Badge>
                ),
              },
              {
                key: 'scheduledStart',
                header: 'Начало',
                render: (event) => formatEventDate(event.scheduledStart),
              },
              {
                key: 'registrations',
                header: 'Игроки',
                hideOnMobile: true,
                render: (event) =>
                  `${event._count.registrations} / ${event.maxPlayers}`,
              },
              {
                key: 'actions',
                header: 'Действия',
                hideOnMobile: true,
                render: (event) => (
                  <Link
                    to={`/events/${event.id}`}
                    className="cursor-pointer font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                  >
                    Подробнее
                  </Link>
                ),
              },
            ]}
          />

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(page) => handleFiltersChange({ page })}
          />
        </>
      )}
    </div>
  );
}
