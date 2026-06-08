import { Link } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import SelectDropdown from '../../components/ui/SelectDropdown';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../hooks/useAuth';
import * as registrationService from '../../services/registrationService';
import { ApiError } from '../../services/apiClient';
import { setRegistrations, upsertRegistration } from '../../store/registrationsSlice';
import type { AppDispatch, RootState } from '../../store/store';
import type { Registration, RegistrationStatus } from '../../types/index';

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
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
    default:
      return 'default';
  }
}

function canCancelRegistration(registration: Registration): boolean {
  return (
    ['PENDING', 'APPROVED'].includes(registration.status) &&
    registration.event.status === 'OPEN' &&
    new Date(registration.event.registrationDeadline).getTime() >= Date.now()
  );
}

const statusFilterOptions = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'DECLINED', label: 'Declined' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function MyRegistrationsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { isPlayer } = useAuth();
  const registrations = useSelector((state: RootState) => state.registrations.items);
  const pagination = useSelector((state: RootState) => state.registrations.pagination);
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus | ''>('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const loadRegistrations = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const data = await registrationService.getRegistrations({
        status: statusFilter || undefined,
        page,
        pageSize: 10,
      });
      dispatch(setRegistrations(data));
    } catch {
      setLoadError('Unable to load your registrations.');
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, page, statusFilter]);

  useEffect(() => {
    if (!isPlayer) {
      setIsLoading(false);
      return;
    }

    void loadRegistrations();
  }, [isPlayer, loadRegistrations]);

  const handleCancel = async (registration: Registration) => {
    setActionError('');
    setCancellingId(registration.id);

    try {
      const cancelled = await registrationService.cancelRegistration(registration.id);
      dispatch(upsertRegistration(cancelled));
    } catch (error) {
      if (error instanceof ApiError) {
        setActionError(error.message);
      } else {
        setActionError('Unable to cancel registration.');
      }
    } finally {
      setCancellingId(null);
    }
  };

  if (!isPlayer) {
    return (
      <EmptyState
        title="Player registrations only"
        description="Registration history is available to player accounts."
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner label="Loading registrations" size="lg" />
      </div>
    );
  }

  if (loadError) {
    return <EmptyState title="Registrations unavailable" description={loadError} />;
  }

  return (
    <div className="space-y-6">
      <section
        aria-labelledby="registration-filters-heading"
        className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
      >
        <h2 id="registration-filters-heading" className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">
          Filter registrations
        </h2>
        <SelectDropdown
          label="Status"
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value as RegistrationStatus | '');
            setPage(1);
          }}
          options={statusFilterOptions}
        />
      </section>

      {actionError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {actionError}
        </p>
      ) : null}

      {registrations.length === 0 ? (
        <EmptyState
          title="No registrations yet"
          description="Browse open events and register to see your history here."
          action={
            <Link to="/events">
              <Button>Browse events</Button>
            </Link>
          }
        />
      ) : (
        <>
          <DataTable<Registration>
            caption="My event registrations"
            data={registrations}
            getRowKey={(registration) => registration.id}
            columns={[
              {
                key: 'event',
                header: 'Event',
                mobileLabel: 'Event',
                render: (registration) => (
                  <div>
                    <Link
                      to={`/events/${registration.eventId}`}
                      className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                    >
                      {registration.event.title}
                    </Link>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Starts {formatDateTime(registration.event.scheduledStart)}
                    </p>
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (registration) => (
                  <Badge variant={registrationStatusVariant(registration.status)}>
                    {registration.status}
                  </Badge>
                ),
              },
              {
                key: 'role',
                header: 'Requested role',
                hideOnMobile: true,
                render: (registration) => registration.requestedRoleName ?? 'No preference',
              },
              {
                key: 'slot',
                header: 'Assigned slot',
                hideOnMobile: true,
                render: (registration) => registration.eventSlot?.roleName ?? 'Unassigned',
              },
              {
                key: 'joinedAt',
                header: 'Registered',
                render: (registration) => formatDateTime(registration.joinedAt),
              },
              {
                key: 'actions',
                header: 'Actions',
                hideOnMobile: true,
                render: (registration) =>
                  canCancelRegistration(registration) ? (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      disabled={cancellingId === registration.id}
                      onClick={() => void handleCancel(registration)}
                    >
                      Cancel
                    </Button>
                  ) : (
                    <span className="text-sm text-slate-500 dark:text-slate-400">—</span>
                  ),
              },
            ]}
          />

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
