import { type FormEvent, useEffect, useMemo, useState } from 'react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import RadioGroup from '../../components/ui/RadioGroup';
import SelectDropdown from '../../components/ui/SelectDropdown';
import TextInput from '../../components/ui/TextInput';
import { useAuth } from '../../hooks/useAuth';
import * as eventService from '../../services/eventService';
import * as registrationService from '../../services/registrationService';
import * as reportService from '../../services/reportService';
import { ApiError } from '../../services/apiClient';
import {
  deliveryChannelLabels,
  reportFormatLabels,
  reportKindLabels,
} from '../../i18n/labels';
import type {
  ApiFieldError,
  CreateReportInput,
  DeliveryChannel,
  Event,
  ReportFormat,
  ReportKind,
  ReportRequest,
} from '../../types/index';

function mapFieldErrors(errors?: ApiFieldError[]): Record<string, string> {
  const mapped: Record<string, string> = {};
  errors?.forEach((error) => {
    mapped[error.field] = error.message;
  });
  return mapped;
}

function toIsoDateStart(value: string): string | undefined {
  if (!value) {
    return undefined;
  }

  return new Date(`${value}T00:00:00`).toISOString();
}

function toIsoDateEnd(value: string): string | undefined {
  if (!value) {
    return undefined;
  }

  return new Date(`${value}T23:59:59`).toISOString();
}

function triggerBlobDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export interface ReportGeneratorFormProps {
  onReportCreated: (report: ReportRequest) => void;
  onSuccess?: (message: string, title?: string) => void;
}

const reportKindOptions: { value: ReportKind; label: string }[] = (
  Object.entries(reportKindLabels) as Array<[ReportKind, string]>
).map(([value, label]) => ({ value, label }));

const formatOptions: { value: ReportFormat; label: string }[] = (
  Object.entries(reportFormatLabels) as Array<[ReportFormat, string]>
).map(([value, label]) => ({ value, label }));

const deliveryOptions: { value: DeliveryChannel; label: string }[] = (
  Object.entries(deliveryChannelLabels) as Array<[DeliveryChannel, string]>
).map(([value, label]) => ({ value, label }));

export default function ReportGeneratorForm({ onReportCreated, onSuccess }: ReportGeneratorFormProps) {
  const { user, isOrganizer, isPlayer } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [playerOptions, setPlayerOptions] = useState<{ value: string; label: string }[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [reportKind, setReportKind] = useState<ReportKind>(
    isOrganizer ? 'EVENT_ATTENDANCE' : 'PLAYER_PARTICIPATION',
  );
  const [outputFormat, setOutputFormat] = useState<ReportFormat>('PDF');
  const [deliveryChannel, setDeliveryChannel] = useState<DeliveryChannel>('DOWNLOAD');
  const [eventId, setEventId] = useState('');
  const [subjectUserId, setSubjectUserId] = useState(user ? String(user.id) : '');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [recipientEmail, setRecipientEmail] = useState(user?.email ?? '');
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;

    const loadOptions = async () => {
      setIsLoadingOptions(true);
      setLoadError('');

      try {
        if (isOrganizer) {
          const eventData = await eventService.getEvents({
            pageSize: 100,
            sort: 'scheduledStart',
            order: 'desc',
          });

          const myEvents = eventData.events.filter((event) => event.organizerId === user.id);

          if (active) {
            setEvents(myEvents);
            if (myEvents.length > 0) {
              setEventId(String(myEvents[0].id));
            }
          }

          const registrationData = await registrationService.getRegistrations({ pageSize: 100 });
          const players = new Map<number, string>();

          registrationData.registrations.forEach((registration) => {
            if (registration.event.organizerId === user.id) {
              players.set(
                registration.user.id,
                `${registration.user.displayName} (@${registration.user.username})`,
              );
            }
          });

          if (active) {
            setPlayerOptions(
              Array.from(players.entries()).map(([id, label]) => ({
                value: String(id),
                label,
              })),
            );
          }
        } else if (isPlayer) {
          if (active) {
            setSubjectUserId(String(user.id));
            setReportKind('PLAYER_PARTICIPATION');
          }
        }
      } catch {
        if (active) {
          setLoadError('Не удалось загрузить параметры формы отчёта.');
        }
      } finally {
        if (active) {
          setIsLoadingOptions(false);
        }
      }
    };

    void loadOptions();

    return () => {
      active = false;
    };
  }, [isOrganizer, isPlayer, user]);

  const availableReportKinds = useMemo(() => {
    if (isOrganizer) {
      return reportKindOptions;
    }

    return reportKindOptions.filter((option) => option.value === 'PLAYER_PARTICIPATION');
  }, [isOrganizer]);

  const buildPayload = (): CreateReportInput => {
    const payload: CreateReportInput = {
      reportKind,
      outputFormat,
      deliveryChannel,
    };

    if (reportKind === 'EVENT_ATTENDANCE') {
      payload.eventId = Number(eventId);
    } else {
      payload.subjectUserId = Number(subjectUserId || user?.id);
      const start = toIsoDateStart(periodStart);
      const end = toIsoDateEnd(periodEnd);
      if (start) {
        payload.periodStart = start;
      }
      if (end) {
        payload.periodEnd = end;
      }
    }

    if (deliveryChannel === 'EMAIL') {
      payload.recipientEmail = recipientEmail.trim();
    }

    return payload;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const created = await reportService.createReport(buildPayload());
      onReportCreated(created);

      if (deliveryChannel === 'DOWNLOAD') {
        const download = await reportService.downloadReport(created.id);
        triggerBlobDownload(download.blob, download.fileName);
      } else {
        const emailed = await reportService.emailReport(created.id, {
          recipientEmail: recipientEmail.trim(),
        });
        onReportCreated(emailed);

        if (emailed.status === 'FAILED') {
          setFormError(emailed.failedReason ?? 'Отчёт сформирован, но отправка по email не удалась.');
          return;
        }

        onSuccess?.(`Отчёт отправлен на ${recipientEmail.trim()}.`, 'Отчёт отправлен');
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
        setFieldErrors(mapFieldErrors(error.errors));
      } else {
        setFormError('Не удалось сформировать отчёт.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingOptions) {
    return (
      <Card title="Формирование отчёта" description="Создание нового отчёта о посещаемости или участии.">
        <p className="text-sm text-slate-600 dark:text-slate-400">Загрузка параметров отчёта...</p>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card title="Формирование отчёта" description="Создание нового отчёта о посещаемости или участии.">
        <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>
      </Card>
    );
  }

  return (
    <Card title="Формирование отчёта" description="Создание нового отчёта о посещаемости или участии.">
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <SelectDropdown
          label="Тип отчёта"
          name="reportKind"
          value={reportKind}
          onChange={(event) => setReportKind(event.target.value as ReportKind)}
          options={availableReportKinds.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          error={fieldErrors.reportKind}
        />

        {reportKind === 'EVENT_ATTENDANCE' ? (
          <SelectDropdown
            label="Событие"
            name="eventId"
            value={eventId}
            onChange={(event) => setEventId(event.target.value)}
            options={events.map((event) => ({
              value: String(event.id),
              label: event.title,
            }))}
            placeholder={events.length === 0 ? 'Нет доступных организованных событий' : undefined}
            error={fieldErrors.eventId}
            required
            disabled={events.length === 0}
          />
        ) : (
          <>
            {isOrganizer ? (
              <SelectDropdown
                label="Игрок"
                name="subjectUserId"
                value={subjectUserId}
                onChange={(event) => setSubjectUserId(event.target.value)}
                options={playerOptions}
                placeholder={playerOptions.length === 0 ? 'Зарегистрированные игроки не найдены' : undefined}
                error={fieldErrors.subjectUserId}
                required
                disabled={playerOptions.length === 0}
              />
            ) : (
              <TextInput
                label="Игрок"
                name="subjectUserId"
                value={user?.displayName ?? ''}
                readOnly
                disabled
              />
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput
                label="Начало периода (необязательно)"
                name="periodStart"
                type="date"
                value={periodStart}
                onChange={(event) => setPeriodStart(event.target.value)}
                error={fieldErrors.periodStart}
              />
              <TextInput
                label="Конец периода (необязательно)"
                name="periodEnd"
                type="date"
                value={periodEnd}
                onChange={(event) => setPeriodEnd(event.target.value)}
                error={fieldErrors.periodEnd}
              />
            </div>
          </>
        )}

        <RadioGroup
          legend="Формат вывода"
          name="outputFormat"
          value={outputFormat}
          onChange={(value) => setOutputFormat(value as ReportFormat)}
          options={formatOptions.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          error={fieldErrors.outputFormat}
        />

        <RadioGroup
          legend="Доставка"
          name="deliveryChannel"
          value={deliveryChannel}
          onChange={(value) => setDeliveryChannel(value as DeliveryChannel)}
          options={deliveryOptions.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          error={fieldErrors.deliveryChannel}
        />

        {deliveryChannel === 'EMAIL' ? (
          <TextInput
            label="Email получателя"
            name="recipientEmail"
            type="email"
            value={recipientEmail}
            onChange={(event) => setRecipientEmail(event.target.value)}
            error={fieldErrors.recipientEmail}
            required
          />
        ) : null}

        {formError ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {formError}
          </p>
        ) : null}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? 'Формирование...'
            : deliveryChannel === 'EMAIL'
              ? `Сформировать и отправить ${outputFormat}`
              : `Сформировать и скачать ${outputFormat}`}
        </Button>
      </form>
    </Card>
  );
}
