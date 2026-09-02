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
  const user = await probeSession();

  if (!user) {
    throw new ApiError(401, 'Authentication required');
  }

  return user;
}

export async function probeSession(): Promise<PublicUser | null> {
  const data = await apiRequest<{ user: PublicUser | null }>('/auth/me');
  return data.user;
}

export async function logout(): Promise<void> {
  await apiRequestVoid('/auth/logout', { method: 'POST' });
}
