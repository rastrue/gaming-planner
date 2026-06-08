import { useState } from 'react';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import ModalDialog from '../../components/ui/ModalDialog';
import type { Registration, RegistrationStatus } from '../../types/index';

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

export interface RegistrationReviewPanelProps {
  registrations: Registration[];
  busyId: number | null;
  onApprove: (registration: Registration) => Promise<void>;
  onDecline: (registration: Registration) => Promise<void>;
  onCancel: (registration: Registration) => Promise<void>;
}

export default function RegistrationReviewPanel({
  registrations,
  busyId,
  onApprove,
  onDecline,
  onCancel,
}: RegistrationReviewPanelProps) {
  const [confirmTarget, setConfirmTarget] = useState<{
    registration: Registration;
    action: 'decline' | 'cancel';
  } | null>(null);

  const reviewable = registrations.filter((registration) =>
    ['PENDING', 'APPROVED'].includes(registration.status),
  );

  const handleConfirm = async () => {
    if (!confirmTarget) {
      return;
    }

    if (confirmTarget.action === 'decline') {
      await onDecline(confirmTarget.registration);
    } else {
      await onCancel(confirmTarget.registration);
    }

    setConfirmTarget(null);
  };

  if (reviewable.length === 0) {
    return (
      <Card
        title="Registration review"
        description="Approve or decline player requests before assigning them to slots."
      >
        <p className="text-sm text-slate-600 dark:text-slate-400">No pending or approved registrations to review.</p>
      </Card>
    );
  }

  return (
    <>
      <Card
        title="Registration review"
        description="Approve or decline player requests before assigning them to slots."
      >
        <DataTable<Registration>
          caption="Event registrations awaiting review"
          data={reviewable}
          getRowKey={(registration) => registration.id}
          columns={[
            {
              key: 'player',
              header: 'Player',
              mobileLabel: 'Player',
              render: (registration) => (
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {registration.user.displayName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">@{registration.user.username}</p>
                </div>
              ),
            },
            {
              key: 'requestedRole',
              header: 'Requested role',
              hideOnMobile: true,
              render: (registration) => registration.requestedRoleName ?? 'Any',
            },
            {
              key: 'status',
              header: 'Status',
              render: (registration) => (
                <Badge variant={registrationStatusVariant(registration.status)}>{registration.status}</Badge>
              ),
            },
            {
              key: 'actions',
              header: 'Actions',
              mobileLabel: 'Actions',
              render: (registration) => {
                const isBusy = busyId === registration.id;

                return (
                  <div className="flex flex-wrap gap-2">
                    {registration.status === 'PENDING' ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          disabled={isBusy}
                          onClick={() => void onApprove(registration)}
                        >
                          Approve
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          disabled={isBusy}
                          onClick={() =>
                            setConfirmTarget({ registration, action: 'decline' })
                          }
                        >
                          Decline
                        </Button>
                      </>
                    ) : null}
                    {registration.status === 'APPROVED' ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => setConfirmTarget({ registration, action: 'cancel' })}
                      >
                        Cancel
                      </Button>
                    ) : null}
                  </div>
                );
              },
            },
          ]}
        />
      </Card>

      <ModalDialog
        open={Boolean(confirmTarget)}
        title={confirmTarget?.action === 'decline' ? 'Decline registration' : 'Cancel registration'}
        onClose={() => setConfirmTarget(null)}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setConfirmTarget(null)}>
              Keep registration
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={busyId === confirmTarget?.registration.id}
              onClick={() => void handleConfirm()}
            >
              {confirmTarget?.action === 'decline' ? 'Decline player' : 'Cancel registration'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {confirmTarget?.action === 'decline'
            ? `Decline the registration request from ${confirmTarget.registration.user.displayName}?`
            : `Cancel the approved registration for ${confirmTarget?.registration.user.displayName}? They will be removed from any assigned slot.`}
        </p>
      </ModalDialog>
    </>
  );
}
