import type { LoginInput, PublicUser, RegisterInput } from '../types/index';
import { ApiError, apiRequest, apiRequestVoid } from './apiClient';

export async function register(input: RegisterInput): Promise<PublicUser> {
  const data = await apiRequest<{ user: PublicUser }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  return data.user;
}

export async function login(input: LoginInput): Promise<PublicUser> {
  const data = await apiRequest<{ user: PublicUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  return data.user;
}

export async function getCurrentUser(): Promise<PublicUser> {
  const data = await apiRequest<{ user: PublicUser }>('/auth/me');
  return data.user;
}

/** Treats 401 as an absent session; rethrows other API failures. */
export async function probeSession(): Promise<PublicUser | null> {
  try {
    return await getCurrentUser();
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 401) {
      return null;
    }

    throw error;
  }
}

export async function logout(): Promise<void> {
  await apiRequestVoid('/auth/logout', { method: 'POST' });
}
