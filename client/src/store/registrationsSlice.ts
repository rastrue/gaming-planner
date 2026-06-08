import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { PaginatedRegistrations, PaginationMeta, Registration } from '../types/index';

interface RegistrationsState {
  items: Registration[];
  pagination: PaginationMeta;
}

const emptyPagination: PaginationMeta = {
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 1,
};

const initialState: RegistrationsState = {
  items: [],
  pagination: emptyPagination,
};

const registrationsSlice = createSlice({
  name: 'registrations',
  initialState,
  reducers: {
    setRegistrations(state, action: PayloadAction<PaginatedRegistrations>) {
      state.items = action.payload.registrations;
      state.pagination = action.payload.pagination;
    },
    upsertRegistration(state, action: PayloadAction<Registration>) {
      const index = state.items.findIndex((registration) => registration.id === action.payload.id);
      if (index === -1) {
        state.items.unshift(action.payload);
        return;
      }

      state.items[index] = action.payload;
    },
    removeRegistration(state, action: PayloadAction<number>) {
      state.items = state.items.filter((registration) => registration.id !== action.payload);
    },
    clearRegistrationsState() {
      return initialState;
    },
  },
});

export const {
  setRegistrations,
  upsertRegistration,
  removeRegistration,
  clearRegistrationsState,
} = registrationsSlice.actions;
export default registrationsSlice.reducer;
