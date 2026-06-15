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
  return new Date(value).toLocaleString('ru-RU', {
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
          setLoadError('Не удалось загрузить события для управления составом.');
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
        <Spinner label="Загрузка событий для состава" size="lg" />
      </div>
    );
  }

  if (loadError) {
    return <EmptyState title="События для состава недоступны" description={loadError} />;
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Выберите событие для проверки регистраций, назначения игроков на слоты и отметки посещаемости.
      </p>

      {myEvents.length === 0 ? (
        <EmptyState
          title="Нет событий для управления"
          description="Сначала создайте событие, затем вернитесь сюда для управления составом."
          action={
            <Link to="/organizer/events/new">
              <Button>Создать событие</Button>
            </Link>
          }
        />
      ) : (
        <Card title="Выберите событие" description="Откройте доску состава для одного из ваших событий.">
          <DataTable<Event>
            caption="События организатора для управления составом"
            data={myEvents}
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
                key: 'schedule',
                header: 'Начало',
                render: (event) => formatEventDate(event.scheduledStart),
              },
              {
                key: 'registrations',
                header: 'Регистрации',
                hideOnMobile: true,
                render: (event) => String(event._count.registrations),
              },
              {
                key: 'actions',
                header: 'Действия',
                mobileLabel: 'Действия',
                render: (event) => (
                  <Link to={`/organizer/roster/${event.id}`}>
                    <Button type="button" size="sm">
                      Открыть доску состава
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
