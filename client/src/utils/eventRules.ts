import type { EventStatus } from '../types/index';

export function isTerminalEventStatus(status: EventStatus): boolean {
  return status === 'COMPLETED' || status === 'CANCELLED';
}

export function isEventEditable(status: EventStatus): boolean {
  return !isTerminalEventStatus(status);
}

export function canEditEventDetails(event: {
  status: EventStatus;
  _count: { registrations: number };
}): boolean {
  return isEventEditable(event.status) && event._count.registrations === 0;
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

export function isRegistrationOpen(
  event: { status: EventStatus; registrationDeadline: string; scheduledStart: string },
): boolean {
  return (
    isRegistrationAcceptingStatus(event.status) &&
    new Date(event.registrationDeadline).getTime() >= Date.now() &&
    !hasEventStarted(event.scheduledStart)
  );
}
