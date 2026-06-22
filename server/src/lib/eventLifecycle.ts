import { EventStatus } from '@prisma/client';

export interface EventLifecycleInput {
  status: EventStatus;
  registrationDeadline: Date;
  scheduledStart: Date;
  maxPlayers: number;
  approvedRegistrationCount: number;
}

const TERMINAL_STATUSES = new Set<EventStatus>([EventStatus.COMPLETED, EventStatus.CANCELLED]);

const REGISTRATION_CLOSE_OFFSET_MS = 60 * 60 * 1000;

export function computeRegistrationDeadline(scheduledStart: Date): Date {
  return new Date(scheduledStart.getTime() - REGISTRATION_CLOSE_OFFSET_MS);
}

export function resolveEventStatus(event: EventLifecycleInput, now = Date.now()): EventStatus {
  if (TERMINAL_STATUSES.has(event.status)) {
    return event.status;
  }

  const startTime = event.scheduledStart.getTime();
  const deadlineTime = event.registrationDeadline.getTime();

  if (startTime <= now) {
    return EventStatus.STARTED;
  }

  if (event.status === EventStatus.WAITING || deadlineTime < now) {
    return EventStatus.WAITING;
  }

  if (event.approvedRegistrationCount >= event.maxPlayers) {
    return EventStatus.FULL;
  }

  return EventStatus.REGISTRATION;
}

export function isRegistrationOpen(event: EventLifecycleInput, now = Date.now()): boolean {
  return (
    resolveEventStatus(event, now) === EventStatus.REGISTRATION &&
    event.registrationDeadline.getTime() >= now
  );
}

export function canPlayerCancelRegistration(event: Pick<EventLifecycleInput, 'status'>): boolean {
  return event.status === EventStatus.REGISTRATION || event.status === EventStatus.FULL;
}

export function canCancelPublishedEvent(status: EventStatus): boolean {
  return status === EventStatus.REGISTRATION || status === EventStatus.WAITING;
}

export function canCompleteEventStatus(status: EventStatus, scheduledStart: Date, now = Date.now()): boolean {
  return (
    !TERMINAL_STATUSES.has(status) &&
    scheduledStart.getTime() <= now &&
    (status === EventStatus.WAITING || status === EventStatus.STARTED || status === EventStatus.FULL)
  );
}
