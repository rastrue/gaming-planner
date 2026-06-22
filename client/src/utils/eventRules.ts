import type { EventStatus } from '../types/index';

export function isTerminalEventStatus(status: EventStatus): boolean {
  return status === 'COMPLETED' || status === 'CANCELLED';
}

export function isEventEditable(status: EventStatus): boolean {
  return !isTerminalEventStatus(status);
}

export function canEditEventDetails(event: {
  status: EventStatus;
  _count: { activeRegistrations: number };
}): boolean {
  return event.status === 'REGISTRATION' && event._count.activeRegistrations === 0;
}

export function canCancelOpenEvent(status: EventStatus): boolean {
  return status === 'REGISTRATION' || status === 'WAITING';
}

export function hasEventStarted(scheduledStart: string | Date): boolean {
  return new Date(scheduledStart).getTime() <= Date.now();
}

export function canCompleteEventStatus(status: EventStatus, scheduledStart: string | Date): boolean {
  return (
    isEventEditable(status) &&
    hasEventStarted(scheduledStart) &&
    (status === 'WAITING' || status === 'STARTED' || status === 'FULL')
  );
}

export function isRegistrationAcceptingStatus(status: EventStatus): boolean {
  return status === 'REGISTRATION';
}

export function resolveEventStatus(
  event: {
    status: EventStatus;
    registrationDeadline: string;
    scheduledStart: string;
    maxPlayers: number;
    _count?: { registrations: number };
  },
  now = Date.now(),
): EventStatus {
  if (isTerminalEventStatus(event.status)) {
    return event.status;
  }

  const startTime = new Date(event.scheduledStart).getTime();
  const deadlineTime = new Date(event.registrationDeadline).getTime();

  if (startTime <= now) {
    return 'STARTED';
  }

  if (event.status === 'WAITING' || deadlineTime < now) {
    return 'WAITING';
  }

  const approvedRegistrationCount = event._count?.registrations ?? 0;

  if (approvedRegistrationCount >= event.maxPlayers) {
    return 'FULL';
  }

  return 'REGISTRATION';
}

export function canPlayerCancelRegistration(event: { status: EventStatus }): boolean {
  return event.status === 'REGISTRATION' || event.status === 'FULL';
}

export function isRegistrationOpen(
  event: {
    status: EventStatus;
    registrationDeadline: string;
    scheduledStart: string;
    maxPlayers: number;
    _count?: { registrations: number };
  },
): boolean {
  return (
    resolveEventStatus(event) === 'REGISTRATION' &&
    new Date(event.registrationDeadline).getTime() >= Date.now() &&
    !hasEventStarted(event.scheduledStart)
  );
}
