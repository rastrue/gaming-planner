import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { EventStatus } from '../types/index';
import { readStorage, storageKeys } from '../utils/storageKeys';

export interface EventsFilterState {
  search: string;
  gameId: number | null;
  status: EventStatus | null;
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
  sort: 'scheduledStart',
  order: 'asc',
  page: 1,
  pageSize: 10,
  availabilityFit: false,
};

const persistedFilters = readStorage<FiltersState>(storageKeys.filters);

const initialState: FiltersState = {
  events: {
    ...defaultEventsFilters,
    ...persistedFilters?.events,
  },
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
      state.events = { ...defaultEventsFilters, ...action.payload.events };
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
