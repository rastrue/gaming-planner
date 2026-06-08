import type {
  CreateSlotInput,
  EventSlot,
  Registration,
  RegistrationStatus,
  RosterBoard,
  UpdateSlotInput,
} from '../types/index';
import { apiRequest, apiRequestVoid } from './apiClient';
import * as registrationService from './registrationService';

export async function getEventSlots(eventId: number): Promise<EventSlot[]> {
  const data = await apiRequest<{ slots: EventSlot[] }>(`/events/${eventId}/slots`);
  return data.slots;
}

export async function createEventSlot(eventId: number, input: CreateSlotInput): Promise<EventSlot> {
  const data = await apiRequest<{ slot: EventSlot }>(`/events/${eventId}/slots`, {
    method: 'POST',
    body: JSON.stringify(input),
  });

  return data.slot;
}

export async function updateEventSlot(slotId: number, input: UpdateSlotInput): Promise<EventSlot> {
  const data = await apiRequest<{ slot: EventSlot }>(`/event-slots/${slotId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });

  return data.slot;
}

export async function deleteEventSlot(slotId: number): Promise<void> {
  await apiRequestVoid(`/event-slots/${slotId}`, { method: 'DELETE' });
}

export async function getRosterBoard(eventId: number): Promise<RosterBoard> {
  const [slots, registrationPage] = await Promise.all([
    getEventSlots(eventId),
    registrationService.getRegistrations({ eventId, pageSize: 100 }),
  ]);

  return {
    eventId,
    slots,
    registrations: registrationPage.registrations,
  };
}

export async function getApprovedRegistrations(eventId: number): Promise<Registration[]> {
  const data = await registrationService.getRegistrations({
    eventId,
    status: 'APPROVED',
    pageSize: 100,
  });

  return data.registrations;
}

export async function assignRegistrationToSlot(
  registrationId: number,
  eventSlotId: number,
): Promise<Registration> {
  return registrationService.updateRegistration(registrationId, { eventSlotId });
}

export async function clearRegistrationSlot(registrationId: number): Promise<Registration> {
  return registrationService.updateRegistration(registrationId, { eventSlotId: null });
}

export async function updateRegistrationStatus(
  registrationId: number,
  status: RegistrationStatus,
): Promise<Registration> {
  return registrationService.updateRegistration(registrationId, { status });
}
