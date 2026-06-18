import { type FormEvent, useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import EmptyState from '../../components/ui/EmptyState';
import ModalDialog from '../../components/ui/ModalDialog';
import Spinner from '../../components/ui/Spinner';
import TextInput from '../../components/ui/TextInput';
import * as rosterService from '../../services/rosterService';
import { ApiError } from '../../services/apiClient';
import type { CreateSlotInput, EventSlot } from '../../types/index';

function mapFieldErrors(errors?: { field: string; message: string }[]): Record<string, string> {
  const mapped: Record<string, string> = {};
  errors?.forEach((error) => {
    mapped[error.field] = error.message;
  });
  return mapped;
}

export interface EventSlotEditorProps {
  eventId: number;
  onSlotsChange?: () => void;
}

export default function EventSlotEditor({ eventId, onSlotsChange }: EventSlotEditorProps) {
  const [slots, setSlots] = useState<EventSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSlot, setEditingSlot] = useState<EventSlot | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EventSlot | null>(null);
  const [roleName, setRoleName] = useState('');
  const [displayOrder, setDisplayOrder] = useState('1');
  const [requiredCount, setRequiredCount] = useState('1');

  useEffect(() => {
    let active = true;

    const loadSlots = async () => {
      setIsLoading(true);
      setLoadError('');

      try {
        const data = await rosterService.getEventSlots(eventId);
        if (active) {
          setSlots(data);
        }
      } catch {
        if (active) {
          setLoadError('Не удалось загрузить слоты состава.');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadSlots();

    return () => {
      active = false;
    };
  }, [eventId]);

  const resetForm = (nextSlots: EventSlot[]) => {
    setEditingSlot(null);
    setRoleName('');
    setDisplayOrder(String(nextSlots.length + 1));
    setRequiredCount('1');
    setFieldErrors({});
    setFormError('');
  };

  const startEdit = (slot: EventSlot) => {
    setEditingSlot(slot);
    setRoleName(slot.roleName);
    setDisplayOrder(String(slot.displayOrder));
    setRequiredCount(String(slot.requiredCount));
    setFieldErrors({});
    setFormError('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setFieldErrors({});
    setIsSubmitting(true);

    const payload: CreateSlotInput = {
      roleName: roleName.trim(),
      displayOrder: Number(displayOrder),
      requiredCount: Number(requiredCount),
    };

    try {
      if (editingSlot) {
        const updated = await rosterService.updateEventSlot(editingSlot.id, payload);
        const nextSlots = slots
          .map((slot) => (slot.id === updated.id ? updated : slot))
          .sort((a, b) => a.displayOrder - b.displayOrder);
        setSlots(nextSlots);
        resetForm(nextSlots);
        onSlotsChange?.();
      } else {
        const created = await rosterService.createEventSlot(eventId, payload);
        const nextSlots = [...slots, created].sort((a, b) => a.displayOrder - b.displayOrder);
        setSlots(nextSlots);
        resetForm(nextSlots);
        onSlotsChange?.();
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
        setFieldErrors(mapFieldErrors(error.errors));
      } else {
        setFormError('Не удалось сохранить слот состава.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setFormError('');
    setIsSubmitting(true);

    try {
      await rosterService.deleteEventSlot(deleteTarget.id);
      const nextSlots = slots.filter((slot) => slot.id !== deleteTarget.id);
      setSlots(nextSlots);
      if (editingSlot?.id === deleteTarget.id) {
        resetForm(nextSlots);
      }
      setDeleteTarget(null);
      onSlotsChange?.();
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
      } else {
        setFormError('Не удалось удалить слот состава.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card title="Слоты состава" description="Определите необходимые роли и количество игроков для этого события.">
        <div className="flex justify-center py-8">
          <Spinner label="Загрузка слотов состава" />
        </div>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card title="Слоты состава" description="Определите необходимые роли и количество игроков для этого события.">
        <EmptyState title="Слоты недоступны" description={loadError} />
      </Card>
    );
  }

  return (
    <Card title="Слоты состава" description="Определите необходимые роли и количество игроков для этого события.">
      <div className="space-y-6">
        <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={handleSubmit} noValidate>
          <TextInput
            label="Название роли"
            name="roleName"
            value={roleName}
            onChange={(event) => setRoleName(event.target.value)}
            error={fieldErrors.roleName}
            required
            placeholder="Танк, Хил, ДД..."
          />
          <TextInput
            label="Порядок отображения"
            name="displayOrder"
            type="number"
            min={1}
            value={displayOrder}
            onChange={(event) => setDisplayOrder(event.target.value)}
            error={fieldErrors.displayOrder}
            required
          />
          <TextInput
            label="Требуемое количество"
            name="requiredCount"
            type="number"
            min={1}
            value={requiredCount}
            onChange={(event) => setRequiredCount(event.target.value)}
            error={fieldErrors.requiredCount}
            required
          />
          <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-1">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Сохранение...' : editingSlot ? 'Обновить слот' : 'Добавить слот'}
            </Button>
            {editingSlot ? (
              <Button type="button" variant="secondary" disabled={isSubmitting} onClick={() => resetForm(slots)}>
                Отменить редактирование
              </Button>
            ) : null}
          </div>
        </form>

        {formError ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {formError}
          </p>
        ) : null}

        {slots.length === 0 ? (
          <EmptyState
            title="Слотов состава пока нет"
            description="Добавьте хотя бы один слот, чтобы игроки могли запрашивать роли при регистрации."
          />
        ) : (
          <DataTable<EventSlot>
            caption="Слоты состава события"
            data={slots}
            getRowKey={(slot) => slot.id}
            columns={[
              {
                key: 'roleName',
                header: 'Роль',
                mobileLabel: 'Роль',
                render: (slot) => (
                  <span className="font-medium text-slate-900 dark:text-slate-100">{slot.roleName}</span>
                ),
              },
              {
                key: 'displayOrder',
                header: 'Порядок',
                render: (slot) => slot.displayOrder,
              },
              {
                key: 'requiredCount',
                header: 'Требуется',
                render: (slot) => slot.requiredCount,
              },
              {
                key: 'assigned',
                header: 'Назначено',
                hideOnMobile: true,
                render: (slot) => `${slot._count.registrations} / ${slot.requiredCount}`,
              },
              {
                key: 'actions',
                header: 'Действия',
                mobileLabel: 'Действия',
                render: (slot) => (
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" size="sm" onClick={() => startEdit(slot)}>
                      Редактировать
                    </Button>
                    <Button type="button" variant="danger" size="sm" onClick={() => setDeleteTarget(slot)}>
                      Удалить
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </div>

      <ModalDialog
        open={Boolean(deleteTarget)}
        title="Удалить слот состава"
        onClose={() => setDeleteTarget(null)}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setDeleteTarget(null)}>
              Отмена
            </Button>
            <Button type="button" variant="danger" disabled={isSubmitting} onClick={() => void handleDelete()}>
              Удалить слот
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Вы уверены, что хотите удалить слот{' '}
          <span className="font-medium text-slate-900 dark:text-slate-100">{deleteTarget?.roleName}</span>?
          Слоты с назначенными регистрациями нельзя удалить.
        </p>
      </ModalDialog>
    </Card>
  );
}
