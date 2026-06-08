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
import type { AppDispatch, RootState } from '../../store/store';
import type { Event, EventStatus, ListEventsQuery } from '../../types/index';
import EventFiltersPanel from './EventFiltersPanel';

function formatEventDate(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function statusVariant(status: EventStatus) {
  switch (status) {
    case 'OPEN':
      return 'success';
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
      setLoadError('Unable to load events. Please adjust filters and try again.');
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
          <Spinner label="Loading events" size="lg" />
        </div>
      ) : loadError ? (
        <EmptyState title="Events unavailable" description={loadError} />
      ) : events.length === 0 ? (
        <EmptyState
          title="No events found"
          description="Try changing your search terms or filters to discover more sessions."
        />
      ) : (
        <>
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
                    <p className="font-medium text-slate-900 dark:text-slate-100">{event.title}</p>
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
                render: (event) => <Badge variant={statusVariant(event.status)}>{event.status}</Badge>,
              },
              {
                key: 'scheduledStart',
                header: 'Starts',
                render: (event) => formatEventDate(event.scheduledStart),
              },
              {
                key: 'registrations',
                header: 'Players',
                hideOnMobile: true,
                render: (event) =>
                  `${event._count.registrations} / ${event.maxPlayers}`,
              },
              {
                key: 'actions',
                header: 'Actions',
                hideOnMobile: true,
                render: (event) => (
                  <Link
                    to={`/events/${event.id}`}
                    className="cursor-pointer font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                  >
                    View details
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
