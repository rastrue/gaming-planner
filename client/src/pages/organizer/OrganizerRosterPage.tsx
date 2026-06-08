import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../hooks/useAuth';
import * as eventService from '../../services/eventService';
import { setEvents } from '../../store/eventsSlice';
import type { AppDispatch, RootState } from '../../store/store';
import type { Event } from '../../types/index';

function formatEventDate(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function OrganizerRosterPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();
  const events = useSelector((state: RootState) => state.events.items);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

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
          setLoadError('Unable to load events for roster management.');
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

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner label="Loading roster events" size="lg" />
      </div>
    );
  }

  if (loadError) {
    return <EmptyState title="Roster events unavailable" description={loadError} />;
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Select an event to review registrations, assign players to slots, and mark attendance.
      </p>

      {myEvents.length === 0 ? (
        <EmptyState
          title="No events to manage"
          description="Create an event first, then return here to manage its roster."
          action={
            <Link to="/organizer/events/new">
              <Button>Create event</Button>
            </Link>
          }
        />
      ) : (
        <Card title="Choose an event" description="Open the roster board for one of your organized events.">
          <DataTable<Event>
            caption="Organizer roster events"
            data={myEvents}
            getRowKey={(event) => event.id}
            columns={[
              {
                key: 'title',
                header: 'Event',
                mobileLabel: 'Event',
                render: (event) => (
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{event.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{event.game.title}</p>
                  </div>
                ),
              },
              {
                key: 'schedule',
                header: 'Starts',
                render: (event) => formatEventDate(event.scheduledStart),
              },
              {
                key: 'registrations',
                header: 'Registrations',
                hideOnMobile: true,
                render: (event) => String(event._count.registrations),
              },
              {
                key: 'actions',
                header: 'Actions',
                mobileLabel: 'Actions',
                render: (event) => (
                  <Link to={`/organizer/roster/${event.id}`}>
                    <Button type="button" size="sm">
                      Open roster board
                    </Button>
                  </Link>
                ),
              },
            ]}
          />
        </Card>
      )}
    </div>
  );
}
