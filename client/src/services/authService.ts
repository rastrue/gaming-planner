import type { LoginInput, PublicUser, RegisterInput } from '../types/index';
import { apiRequest, apiRequestVoid } from './apiClient';

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

export async function logout(): Promise<void> {
  await apiRequestVoid('/auth/logout', { method: 'POST' });
}
