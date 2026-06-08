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
import type { Event, EventStatus, Registration, RegistrationStatus } from '../../types/index';

function formatEventDate(value: string): string {
  return new Date(value).toLocaleString(undefined, {
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
          setLoadError('Unable to load organizer dashboard data.');
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

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner label="Loading organizer dashboard" size="lg" />
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
      <section aria-labelledby="organizer-stats-heading">
        <h2 id="organizer-stats-heading" className="sr-only">
          Organizer statistics
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card title="Managed events" description="Events you organize.">
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stats.totalEvents}</p>
          </Card>
          <Card title="Open for registration" description="Currently accepting players.">
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.openEvents}</p>
          </Card>
          <Card title="Pending reviews" description="Registrations awaiting approval.">
            <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{stats.pendingReviews}</p>
          </Card>
          <Card title="Completed events" description="Finished sessions.">
            <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">{stats.completedEvents}</p>
          </Card>
        </div>
      </section>

      <section aria-labelledby="organizer-actions-heading">
        <Card title="Organizer quick actions" description="Primary management workflows.">
          <h2 id="organizer-actions-heading" className="sr-only">
            Organizer quick actions
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link to="/organizer/events/new">
              <Button>Create event</Button>
            </Link>
            <Link to="/organizer/events">
              <Button variant="secondary">Manage events</Button>
            </Link>
            <Link to="/organizer/roster">
              <Button variant="secondary">Roster boards</Button>
            </Link>
            <Link to="/reports">
              <Button variant="ghost">Generate reports</Button>
            </Link>
          </div>
        </Card>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section aria-labelledby="organizer-events-heading">
          <Card title="Recent events" description="Your latest scheduled sessions.">
            <h2 id="organizer-events-heading" className="sr-only">
              Recent organizer events
            </h2>
            {myEvents.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">No events created yet.</p>
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
                        {formatEventDate(event.scheduledStart)} · {event._count.registrations} registrations
                      </p>
                    </div>
                    <Badge variant={eventStatusVariant(event.status)}>{event.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>

        <section aria-labelledby="organizer-pending-heading">
          <Card title="Pending registrations" description="Players waiting for your decision.">
            <h2 id="organizer-pending-heading" className="sr-only">
              Pending registrations
            </h2>
            {registrations.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">No pending registrations.</p>
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
                        {registration.status}
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
