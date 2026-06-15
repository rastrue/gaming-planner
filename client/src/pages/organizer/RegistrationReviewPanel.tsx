import { useState } from 'react';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import ModalDialog from '../../components/ui/ModalDialog';
import { formatRegistrationStatus } from '../../i18n/labels';
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
        title="Проверка регистраций"
        description="Одобряйте или отклоняйте заявки игроков перед назначением на слоты."
      >
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Нет ожидающих или одобренных регистраций для проверки.
        </p>
      </Card>
    );
  }

  return (
    <>
      <Card
        title="Проверка регистраций"
        description="Одобряйте или отклоняйте заявки игроков перед назначением на слоты."
      >
        <DataTable<Registration>
          caption="Регистрации на событие, ожидающие проверки"
          data={reviewable}
          getRowKey={(registration) => registration.id}
          columns={[
            {
              key: 'player',
              header: 'Игрок',
              mobileLabel: 'Игрок',
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
              header: 'Запрошенная роль',
              hideOnMobile: true,
              render: (registration) => registration.requestedRoleName ?? 'Любая',
            },
            {
              key: 'status',
              header: 'Статус',
              render: (registration) => (
                <Badge variant={registrationStatusVariant(registration.status)}>
                  {formatRegistrationStatus(registration.status)}
                </Badge>
              ),
            },
            {
              key: 'actions',
              header: 'Действия',
              mobileLabel: 'Действия',
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
                          Одобрить
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
                          Отклонить
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
                        Отменить
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
        title={confirmTarget?.action === 'decline' ? 'Отклонить регистрацию' : 'Отменить регистрацию'}
        onClose={() => setConfirmTarget(null)}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setConfirmTarget(null)}>
              Оставить регистрацию
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={busyId === confirmTarget?.registration.id}
              onClick={() => void handleConfirm()}
            >
              {confirmTarget?.action === 'decline' ? 'Отклонить игрока' : 'Отменить регистрацию'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {confirmTarget?.action === 'decline'
            ? `Отклонить заявку на регистрацию от ${confirmTarget.registration.user.displayName}?`
            : `Отменить одобренную регистрацию для ${confirmTarget?.registration.user.displayName}? Игрок будет удалён из назначенного слота.`}
        </p>
      </ModalDialog>
    </>
  );
}
