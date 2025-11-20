import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess(state, action: PayloadAction<{ user: User; accessToken: string; refreshToken: string }>) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
      localStorage.setItem('refreshToken', action.payload.refreshToken);
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem('refreshToken');
    },
    tokenRefreshed(state, action: PayloadAction<{ accessToken: string }>) {
      state.accessToken = action.payload.accessToken;
    },
  },
});

export const { loginSuccess, logout, tokenRefreshed } = authSlice.actions;

export default authSlice.reducer;
