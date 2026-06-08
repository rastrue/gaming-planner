import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Event, PaginatedEvents, PaginationMeta } from '../types/index';

interface EventsState {
  items: Event[];
  pagination: PaginationMeta;
}

const emptyPagination: PaginationMeta = {
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 1,
};

const initialState: EventsState = {
  items: [],
  pagination: emptyPagination,
};

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    setEvents(state, action: PayloadAction<PaginatedEvents>) {
      state.items = action.payload.events;
      state.pagination = action.payload.pagination;
    },
    upsertEvent(state, action: PayloadAction<Event>) {
      const index = state.items.findIndex((event) => event.id === action.payload.id);
      if (index === -1) {
        state.items.unshift(action.payload);
        return;
      }

      state.items[index] = action.payload;
    },
    removeEvent(state, action: PayloadAction<number>) {
      state.items = state.items.filter((event) => event.id !== action.payload);
    },
    clearEventsState() {
      return initialState;
    },
  },
});

export const { setEvents, upsertEvent, removeEvent, clearEventsState } = eventsSlice.actions;
export default eventsSlice.reducer;
