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
  REGISTRATION: 'Registration',
  FULL: 'Full',
  WAITING: 'Waiting',
  STARTED: 'Started',
  COMPLETED: 'Completed',
  CANCELLED: 'Canceled',
};

export const registrationStatusLabels: Record<RegistrationStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  DECLINED: 'Declined',
  CANCELLED: 'Canceled',
};

export const attendanceStatusLabels: Record<AttendanceStatus, string> = {
  NOT_MARKED: 'Not marked',
  PRESENT: 'Present',
  ABSENT: 'Absent',
};

export const reportStatusLabels: Record<ReportStatus, string> = {
  QUEUED: 'Queued',
  GENERATED: 'Generated',
  EMAILED: 'Emailed',
  FAILED: 'Failed',
};

export const reportKindLabels: Record<ReportKind, string> = {
  EVENT_ATTENDANCE: 'Event attendance',
  PLAYER_PARTICIPATION: 'Player participation',
};

export const reportFormatLabels: Record<ReportFormat, string> = {
  PDF: 'PDF',
  DOCX: 'DOCX',
};

export const deliveryChannelLabels: Record<DeliveryChannel, string> = {
  DOWNLOAD: 'Download',
  EMAIL: 'Email',
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
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;
