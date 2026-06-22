import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { EventStatus } from '../types/index';
import { readStorage, storageKeys } from '../utils/storageKeys';

export interface EventsFilterState {
  search: string;
  gameId: number | null;
  status: EventStatus | null;
  startDate: string;
  endDate: string;
  sort: 'scheduledStart' | 'title' | 'createdAt' | 'status';
  order: 'asc' | 'desc';
  page: number;
  pageSize: number;
  availabilityFit: boolean;
}

interface FiltersState {
  events: EventsFilterState;
}

const defaultEventsFilters: EventsFilterState = {
  search: '',
  gameId: null,
  status: null,
  startDate: '',
  endDate: '',
  sort: 'scheduledStart',
  order: 'asc',
  page: 1,
  pageSize: 10,
  availabilityFit: false,
};

const VALID_EVENT_STATUSES = new Set<EventStatus>([
  'REGISTRATION',
  'FULL',
  'WAITING',
  'STARTED',
  'COMPLETED',
  'CANCELLED',
]);

function normalizeEventsFilters(partial?: Partial<EventsFilterState>): EventsFilterState {
  const merged = { ...defaultEventsFilters, ...partial };

  return {
    ...merged,
    status:
      merged.status && VALID_EVENT_STATUSES.has(merged.status) ? merged.status : null,
  };
}

const persistedFilters = readStorage<FiltersState>(storageKeys.filters);

const initialState: FiltersState = {
  events: normalizeEventsFilters(persistedFilters?.events),
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setEventsFilters(state, action: PayloadAction<Partial<EventsFilterState>>) {
      state.events = { ...state.events, ...action.payload };
    },
    resetEventsFilters(state) {
      state.events = defaultEventsFilters;
    },
    hydrateFiltersState(state, action: PayloadAction<FiltersState>) {
      state.events = normalizeEventsFilters(action.payload.events);
    },
    resetFiltersState() {
      return { events: defaultEventsFilters };
    },
  },
});

export const {
  setEventsFilters,
  resetEventsFilters,
  hydrateFiltersState,
  resetFiltersState,
} = filtersSlice.actions;
export default filtersSlice.reducer;
