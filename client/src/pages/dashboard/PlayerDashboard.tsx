import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../hooks/useAuth';
import * as eventService from '../../services/eventService';
import * as registrationService from '../../services/registrationService';
import { setEvents } from '../../store/eventsSlice';
import { setRegistrations } from '../../store/registrationsSlice';
import type { AppDispatch, RootState } from '../../store/store';
import type { Event, Registration, RegistrationStatus } from '../../types/index';

function formatEventDate(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
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

export default function PlayerDashboard() {
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
        const [eventsData, registrationData] = await Promise.all([
          eventService.getEvents({
            status: 'OPEN',
            pageSize: 12,
            sort: 'scheduledStart',
            order: 'asc',
          }),
          registrationService.getRegistrations({ pageSize: 20 }),
        ]);

        if (!active) {
          return;
        }

        dispatch(setEvents(eventsData));
        dispatch(setRegistrations(registrationData));
      } catch {
        if (active) {
          setLoadError('Unable to load player dashboard data.');
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

  const upcomingEvents = useMemo(
    () =>
      events.filter((event) => new Date(event.scheduledStart).getTime() >= Date.now()).slice(0, 5),
    [events],
  );

  const stats = useMemo(
    () => ({
      openEvents: events.length,
      activeRegistrations: registrations.filter((registration) =>
        ['PENDING', 'APPROVED'].includes(registration.status),
      ).length,
      approvedSessions: registrations.filter((registration) => registration.status === 'APPROVED')
        .length,
    }),
    [events.length, registrations],
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner label="Loading player dashboard" size="lg" />
      </div>
    );
  }

  if (loadError) {
    return (
      <EmptyState
        title="Dashboard unavailable"
        description={loadError}
      />
    );
  }

  return (
    <div className="space-y-6">
      <section aria-labelledby="player-stats-heading">
        <h2 id="player-stats-heading" className="sr-only">
          Player statistics
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card title="Open events" description="Sessions you can join right now.">
            <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">{stats.openEvents}</p>
          </Card>
          <Card title="Active registrations" description="Pending or approved sign-ups.">
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.activeRegistrations}
            </p>
          </Card>
          <Card title="Approved sessions" description="Events you are cleared to play.">
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stats.approvedSessions}</p>
          </Card>
        </div>
      </section>

      <section aria-labelledby="player-actions-heading">
        <Card title="Player quick actions" description="Discover events and manage participation.">
          <h2 id="player-actions-heading" className="sr-only">
            Player quick actions
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link to="/events">
              <Button>Browse events</Button>
            </Link>
            <Link to="/availability">
              <Button variant="secondary">Plan availability</Button>
            </Link>
            <Link to="/my-registrations">
              <Button variant="ghost">View registrations</Button>
            </Link>
          </div>
        </Card>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section aria-labelledby="player-upcoming-heading">
          <Card title="Upcoming open events" description="Sessions starting soon.">
            <h2 id="player-upcoming-heading" className="sr-only">
              Upcoming open events
            </h2>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">No upcoming open events found.</p>
            ) : (
              <ul className="space-y-3">
                {upcomingEvents.map((event: Event) => (
                  <li
                    key={event.id}
                    className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900 dark:text-slate-100">{event.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {event.game.title} · {formatEventDate(event.scheduledStart)}
                        </p>
                      </div>
                      <Link
                        to={`/events/${event.id}`}
                        className="cursor-pointer text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                      >
                        View
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>

        <section aria-labelledby="player-registrations-heading">
          <Card title="Your registrations" description="Latest participation requests and statuses.">
            <h2 id="player-registrations-heading" className="sr-only">
              Your registrations
            </h2>
            {registrations.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                You have not registered for any events yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {registrations.slice(0, 5).map((registration: Registration) => (
                  <li
                    key={registration.id}
                    className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{registration.event.title}</p>
                      <Badge variant={registrationStatusVariant(registration.status)}>
                        {registration.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Registered {formatEventDate(registration.joinedAt)}
                    </p>
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
