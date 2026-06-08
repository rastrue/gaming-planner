import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { readStorage, storageKeys } from '../utils/storageKeys';

interface UiState {
  sidebarCollapsed: boolean;
}

const persistedUi = readStorage<UiState>(storageKeys.ui);

const initialState: UiState = {
  sidebarCollapsed: persistedUi?.sidebarCollapsed ?? false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSidebarCollapsed(state, action: PayloadAction<boolean>) {
      state.sidebarCollapsed = action.payload;
    },
    toggleSidebarCollapsed(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    hydrateUiState(state, action: PayloadAction<UiState>) {
      state.sidebarCollapsed = action.payload.sidebarCollapsed;
    },
    resetUiState() {
      return { sidebarCollapsed: false };
    },
  },
});

export const {
  setSidebarCollapsed,
  toggleSidebarCollapsed,
  hydrateUiState,
  resetUiState,
} = uiSlice.actions;
export default uiSlice.reducer;
