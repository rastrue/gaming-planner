import type { UserRoleName } from '../types/index';

export function getDefaultAuthenticatedPath(role: UserRoleName): string {
  return role === 'ORGANIZER' ? '/dashboard' : '/events';
}
