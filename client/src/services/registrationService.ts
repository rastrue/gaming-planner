import type {
  CreateRegistrationInput,
  ListRegistrationsQuery,
  PaginatedRegistrations,
  Registration,
  UpdateRegistrationInput,
} from '../types/index';
import { apiRequest, apiRequestVoid } from './apiClient';

export async function getRegistrations(
  query: ListRegistrationsQuery = {},
): Promise<PaginatedRegistrations> {
  return apiRequest<PaginatedRegistrations>('/registrations', {}, query);
}

export async function getRegistrationById(id: number): Promise<Registration> {
  const data = await apiRequest<{ registration: Registration }>(`/registrations/${id}`);
  return data.registration;
}

export async function createRegistration(input: CreateRegistrationInput): Promise<Registration> {
  const data = await apiRequest<{ registration: Registration }>('/registrations', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  return data.registration;
}

export async function updateRegistration(
  id: number,
  input: UpdateRegistrationInput,
): Promise<Registration> {
  const data = await apiRequest<{ registration: Registration }>(`/registrations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });

  return data.registration;
}

export async function deleteRegistration(id: number): Promise<void> {
  await apiRequestVoid(`/registrations/${id}`, { method: 'DELETE' });
}

export async function cancelRegistration(id: number): Promise<Registration> {
  return updateRegistration(id, { status: 'CANCELLED' });
}

export async function approveRegistration(id: number): Promise<Registration> {
  return updateRegistration(id, { status: 'APPROVED' });
}

export async function declineRegistration(id: number): Promise<Registration> {
  return updateRegistration(id, { status: 'DECLINED' });
}

export async function updateAttendance(
  id: number,
  attendanceStatus: Registration['attendanceStatus'],
): Promise<Registration> {
  return updateRegistration(id, { attendanceStatus });
}
