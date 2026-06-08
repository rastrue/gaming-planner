import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { readStorage, storageKeys } from '../utils/storageKeys';

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
}

const persistedTheme = readStorage<ThemeMode>(storageKeys.theme);

const initialState: ThemeState = {
  mode: persistedTheme === 'dark' ? 'dark' : 'light',
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setThemeMode(state, action: PayloadAction<ThemeMode>) {
      state.mode = action.payload;
    },
    toggleThemeMode(state) {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
    },
    hydrateThemeMode(state, action: PayloadAction<ThemeMode>) {
      state.mode = action.payload;
    },
    resetThemeState() {
      return { mode: 'light' as ThemeMode };
    },
  },
});

export const { setThemeMode, toggleThemeMode, hydrateThemeMode, resetThemeState } = themeSlice.actions;
export default themeSlice.reducer;
