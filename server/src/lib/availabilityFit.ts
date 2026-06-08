export interface AvailabilityWindowLike {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
}

function getEventDayAndMinutes(date: Date): { dayOfWeek: number; startMinute: number; endMinute: number } {
  const dayOfWeek = date.getUTCDay();
  const startMinute = date.getUTCHours() * 60 + date.getUTCMinutes();
  const endMinute = startMinute;

  return { dayOfWeek, startMinute, endMinute };
}

function windowOverlapsEvent(
  window: AvailabilityWindowLike,
  eventStart: Date,
  eventEnd: Date,
): boolean {
  const start = getEventDayAndMinutes(eventStart);
  const end = getEventDayAndMinutes(eventEnd);

  if (window.dayOfWeek !== start.dayOfWeek && window.dayOfWeek !== end.dayOfWeek) {
    return false;
  }

  const eventStartMinute = start.startMinute;
  const eventEndMinute = Math.max(end.endMinute, eventStartMinute);

  return eventStartMinute < window.endMinute && eventEndMinute > window.startMinute;
}

export function eventFitsAvailability(
  scheduledStart: Date,
  scheduledEnd: Date,
  windows: AvailabilityWindowLike[],
): boolean {
  if (windows.length === 0) {
    return false;
  }

  return windows.some((window) => windowOverlapsEvent(window, scheduledStart, scheduledEnd));
}
