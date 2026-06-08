import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import availabilityReducer from './availabilitySlice';
import eventsReducer from './eventsSlice';
import filtersReducer from './filtersSlice';
import registrationsReducer from './registrationsSlice';
import reportsReducer from './reportsSlice';
import themeReducer from './themeSlice';
import uiReducer from './uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    availability: availabilityReducer,
    theme: themeReducer,
    ui: uiReducer,
    filters: filtersReducer,
    events: eventsReducer,
    registrations: registrationsReducer,
    reports: reportsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export function hydrateStoreFromStorage(): void {
  // Slice initial state already reads persisted values during module initialization.
  applyThemeClass(store.getState().theme.mode);
}

export function applyThemeClass(mode: 'light' | 'dark'): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.classList.toggle('dark', mode === 'dark');
}
