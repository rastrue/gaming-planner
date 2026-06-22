import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import * as authService from '../services/authService';
import { clearAvailabilityState } from '../store/availabilitySlice';
import { resetAuthState, setCurrentUser } from '../store/authSlice';
import { clearEventsState } from '../store/eventsSlice';
import { resetFiltersState } from '../store/filtersSlice';
import { clearRegistrationsState } from '../store/registrationsSlice';
import { clearReportsState } from '../store/reportsSlice';
import { applyThemeClass, type AppDispatch, type RootState } from '../store/store';
import { resetThemeState } from '../store/themeSlice';
import { resetUiState } from '../store/uiSlice';
import { clearQuestSyncStorage, storageKeys, writeStorage } from '../utils/storageKeys';

export function useLocalStorageSync(): void {
  const themeMode = useSelector((state: RootState) => state.theme.mode);
  const uiState = useSelector((state: RootState) => state.ui);
  const filtersState = useSelector((state: RootState) => state.filters);

  useEffect(() => {
    applyThemeClass(themeMode);
    writeStorage(storageKeys.theme, themeMode);
  }, [themeMode]);

  useEffect(() => {
    writeStorage(storageKeys.ui, uiState);
  }, [uiState]);

  useEffect(() => {
    writeStorage(storageKeys.filters, filtersState);
  }, [filtersState]);
}

export function resetApplicationSettings(dispatch: AppDispatch): void {
  clearQuestSyncStorage();
  dispatch(resetThemeState());
  dispatch(resetUiState());
  dispatch(resetFiltersState());
  dispatch(resetAuthState());
  dispatch(clearEventsState());
  dispatch(clearRegistrationsState());
  dispatch(clearReportsState());
  dispatch(clearAvailabilityState());
  applyThemeClass('light');
}

export async function resetApplicationSettingsAndRestoreSession(
  dispatch: AppDispatch,
): Promise<void> {
  resetApplicationSettings(dispatch);

  const user = await authService.probeSession();

  if (user) {
    dispatch(setCurrentUser(user));
  }
}
