import { EventStatus } from '@prisma/client';

export interface EventLifecycleInput {
  status: EventStatus;
  registrationDeadline: Date;
  scheduledStart: Date;
}

const TERMINAL_STATUSES = new Set<EventStatus>([EventStatus.COMPLETED, EventStatus.CANCELLED]);

export function resolveEventStatus(event: EventLifecycleInput, now = Date.now()): EventStatus {
  if (event.status === EventStatus.DRAFT || TERMINAL_STATUSES.has(event.status)) {
    return event.status;
  }

  const startTime = event.scheduledStart.getTime();
  const deadlineTime = event.registrationDeadline.getTime();

  if (startTime <= now) {
    return EventStatus.STARTED;
  }

  if (event.status === EventStatus.FULL) {
    return deadlineTime < now ? EventStatus.WAITING : EventStatus.FULL;
  }

  if (event.status === EventStatus.WAITING || deadlineTime < now) {
    return EventStatus.WAITING;
  }

  return EventStatus.REGISTRATION;
}

export function isRegistrationOpen(event: EventLifecycleInput, now = Date.now()): boolean {
  return (
    resolveEventStatus(event, now) === EventStatus.REGISTRATION &&
    event.registrationDeadline.getTime() >= now
  );
}

export function canCancelPublishedEvent(status: EventStatus): boolean {
  return status === EventStatus.REGISTRATION || status === EventStatus.WAITING;
}

export function canCompleteEventStatus(status: EventStatus, scheduledStart: Date, now = Date.now()): boolean {
  return (
    !TERMINAL_STATUSES.has(status) &&
    status !== EventStatus.DRAFT &&
    scheduledStart.getTime() <= now &&
    (status === EventStatus.WAITING || status === EventStatus.STARTED || status === EventStatus.FULL)
  );
}
