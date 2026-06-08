import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AvailabilityWindow } from '../types/index';

interface AvailabilityState {
  items: AvailabilityWindow[];
}

const initialState: AvailabilityState = {
  items: [],
};

const availabilitySlice = createSlice({
  name: 'availability',
  initialState,
  reducers: {
    setAvailabilityWindows(state, action: PayloadAction<AvailabilityWindow[]>) {
      state.items = action.payload;
    },
    upsertAvailabilityWindow(state, action: PayloadAction<AvailabilityWindow>) {
      const index = state.items.findIndex((window) => window.id === action.payload.id);
      if (index === -1) {
        state.items.push(action.payload);
        return;
      }

      state.items[index] = action.payload;
    },
    removeAvailabilityWindow(state, action: PayloadAction<number>) {
      state.items = state.items.filter((window) => window.id !== action.payload);
    },
    clearAvailabilityState() {
      return initialState;
    },
  },
});

export const {
  setAvailabilityWindows,
  upsertAvailabilityWindow,
  removeAvailabilityWindow,
  clearAvailabilityState,
} = availabilitySlice.actions;
export default availabilitySlice.reducer;
