import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as authService from '../services/authService';
import { clearCurrentUser, setCurrentUser } from '../store/authSlice';
import type { AppDispatch, RootState } from '../store/store';
import type { PublicUser } from '../types/index';

export function useAuth() {
  const dispatch = useDispatch<AppDispatch>();
  const currentUser = useSelector((state: RootState) => state.auth.currentUser);

  const logout = useCallback(async () => {
    await authService.logout();
    dispatch(clearCurrentUser());
  }, [dispatch]);

  const setUser = useCallback(
    (user: PublicUser) => {
      dispatch(setCurrentUser(user));
    },
    [dispatch],
  );

  const refreshUser = useCallback(async () => {
    try {
      const user = await authService.probeSession();

      if (user) {
        dispatch(setCurrentUser(user));
      } else {
        dispatch(clearCurrentUser());
      }

      return user;
    } catch {
      dispatch(clearCurrentUser());
      return null;
    }
  }, [dispatch]);

  return {
    user: currentUser,
    isAuthenticated: Boolean(currentUser),
    isOrganizer: currentUser?.role.name === 'ORGANIZER',
    isPlayer: currentUser?.role.name === 'PLAYER',
    logout,
    setUser,
    refreshUser,
  };
}
