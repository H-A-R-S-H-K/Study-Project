import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../../types/domain';

/**
 * Auth state is the one slice that must survive app restarts, so it is
 * persisted (see store.ts). Tokens live here; the axios client reads the access
 * token from the store on each request (Phase 2).
 */
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ user: User; accessToken: string; refreshToken: string }>,
    ) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
    },
    updateTokens(
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string }>,
    ) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
    updateUser(state, action: PayloadAction<Partial<User>>) {
      if (state.user) state.user = { ...state.user, ...action.payload };
    },
    logout() {
      return initialState;
    },
  },
});

export const { setCredentials, updateTokens, updateUser, logout } = authSlice.actions;
export default authSlice.reducer;
