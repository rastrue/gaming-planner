import type { ApiFieldError } from '../types/index';
import { notifyUnauthorized } from './sessionManager';

const API_BASE = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');

export class ApiError extends Error {
  readonly statusCode: number;
  readonly errors?: ApiFieldError[];

  constructor(statusCode: number, message: string, errors?: ApiFieldError[]) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

type QueryValue = string | number | boolean | undefined | null;

function buildQuery(params?: Record<string, QueryValue> | object): string {
  if (!params) {
    return '';
  }

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params as Record<string, QueryValue>)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }

    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

const HTTP_STATUS_MESSAGES: Record<number, string> = {
  400: 'Некорректный запрос',
  401: 'Требуется авторизация',
  403: 'Доступ запрещён',
  404: 'Не найдено',
  409: 'Конфликт данных',
  500: 'Внутренняя ошибка сервера',
  502: 'Ошибка внешнего сервиса',
  503: 'Сервис временно недоступен',
};

function resolveErrorMessage(response: Response, payloadMessage?: string): string {
  if (payloadMessage) {
    return payloadMessage;
  }

  return HTTP_STATUS_MESSAGES[response.status] ?? 'Запрос не выполнен';
}

async function parseErrorResponse(response: Response): Promise<ApiError> {
  let message = resolveErrorMessage(response);
  let errors: ApiFieldError[] | undefined;

  try {
    const payload = (await response.json()) as {
      message?: string;
      errors?: ApiFieldError[];
    };

    message = resolveErrorMessage(response, payload.message);
    errors = payload.errors;
  } catch {
    // Non-JSON error bodies fall back to mapped status message.
  }

  return new ApiError(response.status, message, errors);
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  query?: Record<string, QueryValue> | object,
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}${buildQuery(query)}`, {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await parseErrorResponse(response);

    if (error.statusCode === 401) {
      notifyUnauthorized(path);
    }

    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function apiRequestBlob(
  path: string,
  options: RequestInit = {},
  query?: Record<string, QueryValue> | object,
): Promise<{ blob: Blob; fileName: string }> {
  const response = await fetch(`${API_BASE}${path}${buildQuery(query)}`, {
    credentials: 'include',
    ...options,
  });

  if (!response.ok) {
    const error = await parseErrorResponse(response);

    if (error.statusCode === 401) {
      notifyUnauthorized(path);
    }

    throw error;
  }

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition') ?? '';
  const fileNameMatch = disposition.match(/filename="?([^"]+)"?/i);
  const fileName = fileNameMatch?.[1] ?? 'report-download';

  return { blob, fileName };
}

export async function apiRequestVoid(
  path: string,
  options: RequestInit = {},
  query?: Record<string, QueryValue> | object,
): Promise<void> {
  await apiRequest<void>(path, options, query);
}
