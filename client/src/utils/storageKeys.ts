export const STORAGE_PREFIX = 'questsync:';

export const storageKeys = {
  theme: `${STORAGE_PREFIX}theme`,
  ui: `${STORAGE_PREFIX}ui`,
  filters: `${STORAGE_PREFIX}filters`,
} as const;

export function readStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: unknown): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(key, JSON.stringify(value));
}

export function removeStorage(key: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(key);
}

export function clearQuestSyncStorage(): void {
  if (typeof window === 'undefined') {
    return;
  }

  const keysToRemove: string[] = [];

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(STORAGE_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

export function selectPersistedUiState<T>(key: string, fallback: T): T {
  return readStorage<T>(key) ?? fallback;
}
