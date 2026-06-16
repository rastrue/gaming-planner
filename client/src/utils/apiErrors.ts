import { ApiError } from '../services/apiClient';

/** Returns null when the global session handler already owns 401 UX. */
export function getActionErrorMessage(error: unknown, fallback: string): string | null {
  if (error instanceof ApiError) {
    if (error.statusCode === 401) {
      return null;
    }

    return error.message;
  }

  return fallback;
}
