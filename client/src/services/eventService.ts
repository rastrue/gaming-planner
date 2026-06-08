import type {
  CreateEventInput,
  Event,
  ListEventsQuery,
  PaginatedEvents,
  UpdateEventInput,
} from '../types/index';
import { apiRequest, apiRequestVoid } from './apiClient';

export async function getEvents(query: ListEventsQuery = {}): Promise<PaginatedEvents> {
  return apiRequest<PaginatedEvents>('/events', {}, query);
}

export async function getEventById(id: number): Promise<Event> {
  const data = await apiRequest<{ event: Event }>(`/events/${id}`);
  return data.event;
}

export async function createEvent(input: CreateEventInput): Promise<Event> {
  const data = await apiRequest<{ event: Event }>('/events', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  return data.event;
}

export async function updateEvent(id: number, input: UpdateEventInput): Promise<Event> {
  const data = await apiRequest<{ event: Event }>(`/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });

  return data.event;
}

export async function deleteEvent(id: number): Promise<void> {
  await apiRequestVoid(`/events/${id}`, { method: 'DELETE' });
}
