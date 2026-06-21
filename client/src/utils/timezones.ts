import type { SelectOption } from '../components/ui/SelectDropdown';

const FALLBACK_TIMEZONES = [
  'UTC',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Moscow',
  'Europe/Kyiv',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
];

function getSupportedTimezones(): string[] {
  if (typeof Intl !== 'undefined' && 'supportedValuesOf' in Intl) {
    try {
      return Intl.supportedValuesOf('timeZone');
    } catch {
      return FALLBACK_TIMEZONES;
    }
  }

  return FALLBACK_TIMEZONES;
}

function getUtcOffsetMinutes(timeZone: string, date = new Date()): number {
  try {
    const localeTime = new Date(date.toLocaleString('en-US', { timeZone }));
    const utcTime = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    return (localeTime.getTime() - utcTime.getTime()) / 60_000;
  } catch {
    return 0;
  }
}

function formatTimezoneOffset(timeZone: string, date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat('ru-RU', {
      timeZone,
      timeZoneName: 'shortOffset',
    }).formatToParts(date);

    return parts.find((part) => part.type === 'timeZoneName')?.value ?? '';
  } catch {
    return '';
  }
}

function formatTimezoneLabel(timeZone: string): string {
  const offset = formatTimezoneOffset(timeZone);
  return offset ? `${timeZone} (${offset})` : timeZone;
}

export function getDefaultTimezone(): string {
  if (typeof Intl !== 'undefined') {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  return 'UTC';
}

export function buildTimezoneOptions(additionalTimezones: string[] = []): SelectOption[] {
  const zones = new Set([...getSupportedTimezones(), ...additionalTimezones]);

  return [...zones]
    .sort((left, right) => {
      const offsetDiff = getUtcOffsetMinutes(left) - getUtcOffsetMinutes(right);
      if (offsetDiff !== 0) {
        return offsetDiff;
      }

      return left.localeCompare(right);
    })
    .map((value) => ({
      value,
      label: formatTimezoneLabel(value),
    }));
}
