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
import { formatEventStatus } from '../../utils/labels';
import type { AppDispatch, RootState } from '../../store/store';
import type { Event, EventStatus, ListEventsQuery } from '../../types/index';
import EventFiltersPanel from './EventFiltersPanel';

const dateLocale = 'en-US';

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
      setLoadError('Unable to load events. Adjust filters and try again.');
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

  const isInitialLoading = isLoading && events.length === 0;
  const isRefreshing = isLoading && events.length > 0;

  return (
    <div className="space-y-6">
      <EventFiltersPanel
        filters={filters}
        games={games}
        showAvailabilityFit={isPlayer}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
      />

      {isInitialLoading ? (
        <div className="flex justify-center py-16">
          <Spinner label="Loading events" size="lg" />
        </div>
      ) : loadError && events.length === 0 ? (
        <EmptyState title="Events unavailable" description={loadError} />
      ) : events.length === 0 ? (
        <EmptyState
          title="No events found"
          description="Try changing your search query or filters."
        />
      ) : (
        <>
          {loadError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {loadError}
            </p>
          ) : null}

          <div className={isRefreshing ? 'pointer-events-none opacity-60' : undefined}>
            <DataTable<Event>
            caption="Event catalog"
            data={events}
            getRowKey={(event) => event.id}
            columns={[
              {
                key: 'title',
                header: 'Event',
                mobileLabel: 'Event',
                render: (event) => (
                  <div>
                    <Link
                      to={`/events/${event.id}`}
                      className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                    >
                      {event.title}
                    </Link>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{event.serverRegion}</p>
                  </div>
                ),
              },
              {
                key: 'game',
                header: 'Game',
                render: (event) => event.game.title,
              },
              {
                key: 'status',
                header: 'Status',
                render: (event) => (
                  <Badge variant={statusVariant(event.status)}>{formatEventStatus(event.status)}</Badge>
                ),
              },
              {
                key: 'scheduledStart',
                header: 'Start',
                render: (event) => formatEventDate(event.scheduledStart),
              },
              {
                key: 'scheduledEnd',
                header: 'End',
                render: (event) => formatEventDate(event.scheduledEnd),
              },
              {
                key: 'registrations',
                header: 'Players',
                hideOnMobile: true,
                render: (event) =>
                  `${event._count.registrations} / ${event.maxPlayers}`,
              },
            ]}
          />
          </div>

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
