import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { PublicUser } from '../types/index';

interface AuthState {
  currentUser: PublicUser | null;
}

const initialState: AuthState = {
  currentUser: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCurrentUser(state, action: PayloadAction<PublicUser>) {
      state.currentUser = action.payload;
    },
    clearCurrentUser(state) {
      state.currentUser = null;
    },
    resetAuthState() {
      return initialState;
    },
  },
});

export const { setCurrentUser, clearCurrentUser, resetAuthState } = authSlice.actions;
export default authSlice.reducer;
