import type {
  AvailabilityWindow,
  CreateAvailabilityInput,
  ListAvailabilityQuery,
  UpdateAvailabilityInput,
} from '../types/index';
import { apiRequest, apiRequestVoid } from './apiClient';

export async function getAvailabilityWindows(
  query: ListAvailabilityQuery = {},
): Promise<AvailabilityWindow[]> {
  const data = await apiRequest<{ windows: AvailabilityWindow[] }>('/availability', {}, query);
  return data.windows;
}

export async function getAvailabilityWindowById(id: number): Promise<AvailabilityWindow> {
  const data = await apiRequest<{ window: AvailabilityWindow }>(`/availability/${id}`);
  return data.window;
}

export async function createAvailabilityWindow(
  input: CreateAvailabilityInput,
): Promise<AvailabilityWindow> {
  const data = await apiRequest<{ window: AvailabilityWindow }>('/availability', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  return data.window;
}

export async function updateAvailabilityWindow(
  id: number,
  input: UpdateAvailabilityInput,
): Promise<AvailabilityWindow> {
  const data = await apiRequest<{ window: AvailabilityWindow }>(`/availability/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });

  return data.window;
}

export async function deleteAvailabilityWindow(id: number): Promise<void> {
  await apiRequestVoid(`/availability/${id}`, { method: 'DELETE' });
}
