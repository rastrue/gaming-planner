import type {
  AttendanceStatus,
  DeliveryChannel,
  EventStatus,
  RegistrationStatus,
  ReportFormat,
  ReportKind,
  ReportStatus,
} from '../types/index';

export const eventStatusLabels: Record<EventStatus, string> = {
  DRAFT: 'Черновик',
  OPEN: 'Открыто',
  FULL: 'Заполнено',
  CLOSED: 'Закрыто',
  COMPLETED: 'Завершено',
  CANCELLED: 'Отменено',
};

export const registrationStatusLabels: Record<RegistrationStatus, string> = {
  PENDING: 'Ожидает',
  APPROVED: 'Одобрено',
  DECLINED: 'Отклонено',
  CANCELLED: 'Отменено',
};

export const attendanceStatusLabels: Record<AttendanceStatus, string> = {
  NOT_MARKED: 'Не отмечено',
  PRESENT: 'Присутствовал',
  ABSENT: 'Отсутствовал',
};

export const reportStatusLabels: Record<ReportStatus, string> = {
  QUEUED: 'В очереди',
  GENERATED: 'Сформирован',
  EMAILED: 'Отправлен',
  FAILED: 'Ошибка',
};

export const reportKindLabels: Record<ReportKind, string> = {
  EVENT_ATTENDANCE: 'Посещаемость события',
  PLAYER_PARTICIPATION: 'Участие игрока',
};

export const reportFormatLabels: Record<ReportFormat, string> = {
  PDF: 'PDF',
  DOCX: 'DOCX',
};

export const deliveryChannelLabels: Record<DeliveryChannel, string> = {
  DOWNLOAD: 'Скачивание',
  EMAIL: 'Электронная почта',
};

export function formatEventStatus(status: EventStatus): string {
  return eventStatusLabels[status] ?? status;
}

export function formatRegistrationStatus(status: RegistrationStatus): string {
  return registrationStatusLabels[status] ?? status;
}

export function formatAttendanceStatus(status: AttendanceStatus): string {
  return attendanceStatusLabels[status] ?? status;
}

export function formatReportStatus(status: ReportStatus): string {
  return reportStatusLabels[status] ?? status;
}

export function formatReportKind(kind: ReportKind): string {
  return reportKindLabels[kind] ?? kind;
}

export function formatReportFormat(format: ReportFormat): string {
  return reportFormatLabels[format] ?? format;
}

export function formatDeliveryChannel(channel: DeliveryChannel): string {
  return deliveryChannelLabels[channel] ?? channel;
}

export const weekdayLabelsLong = [
  'Воскресенье',
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
] as const;
