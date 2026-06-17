import type { EventStatus } from '../types/index';

export function isTerminalEventStatus(status: EventStatus): boolean {
  return status === 'COMPLETED' || status === 'CANCELLED';
}

export function isEventEditable(status: EventStatus): boolean {
  return !isTerminalEventStatus(status);
}

export function canCancelOpenEvent(status: EventStatus): boolean {
  return status === 'OPEN';
}
