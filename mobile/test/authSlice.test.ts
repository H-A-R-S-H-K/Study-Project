import { describe, it, expect } from 'vitest';
import authReducer, {
  setCredentials,
  updateTokens,
  updateUser,
  logout,
} from '../src/redux/slices/authSlice';
import type { User } from '../src/types/domain';

const user: User = {
  id: 'u1',
  name: 'Ramesh',
  phone: '+919876500011',
  role: 'customer',
  ratingSummary: { average: 0, count: 0 },
};

describe('authSlice', () => {
  it('stores credentials and marks authenticated', () => {
    const state = authReducer(
      undefined,
      setCredentials({ user, accessToken: 'a', refreshToken: 'r' }),
    );
    expect(state.isAuthenticated).toBe(true);
    expect(state.accessToken).toBe('a');
    expect(state.user?.id).toBe('u1');
  });

  it('rotates tokens without touching the user', () => {
    const start = authReducer(
      undefined,
      setCredentials({ user, accessToken: 'a', refreshToken: 'r' }),
    );
    const next = authReducer(start, updateTokens({ accessToken: 'a2', refreshToken: 'r2' }));
    expect(next.accessToken).toBe('a2');
    expect(next.refreshToken).toBe('r2');
    expect(next.user?.id).toBe('u1');
  });

  it('merges partial user updates', () => {
    const start = authReducer(
      undefined,
      setCredentials({ user, accessToken: 'a', refreshToken: 'r' }),
    );
    const next = authReducer(start, updateUser({ name: 'Ramesh Patil' }));
    expect(next.user?.name).toBe('Ramesh Patil');
    expect(next.user?.phone).toBe('+919876500011');
  });

  it('clears everything on logout', () => {
    const start = authReducer(
      undefined,
      setCredentials({ user, accessToken: 'a', refreshToken: 'r' }),
    );
    const next = authReducer(start, logout());
    expect(next.isAuthenticated).toBe(false);
    expect(next.user).toBeNull();
    expect(next.accessToken).toBeNull();
  });
});
