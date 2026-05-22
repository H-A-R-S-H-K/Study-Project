import { useMutation } from '@tanstack/react-query';
import { authApi, type RegisterPayload, type TokenPair } from '../api/authApi';
import { useAppDispatch } from '../../redux/store';
import { setCredentials, logout as logoutAction } from '../../redux/slices/authSlice';
import { disconnectSocket } from '../../services/socket';
import { unregisterDeviceToken } from '../../notifications/services/fcm';
import type { User } from '../../types/domain';

/**
 * Auth mutations wired to Redux. On a successful login/register we persist the
 * credentials to the store; RootNavigator reacts to `isAuthenticated` and swaps
 * to the app tree automatically — no imperative navigation needed for that hop.
 */

export function useRequestOtp() {
  return useMutation({ mutationFn: (phone: string) => authApi.requestOtp(phone) });
}

export function useVerifyOtp() {
  const dispatch = useAppDispatch();
  return useMutation({
    mutationFn: ({ phone, code }: { phone: string; code: string }) =>
      authApi.verifyOtp(phone, code),
    onSuccess: (res) => {
      if (!res.isNewUser && res.tokens && res.user) {
        dispatch(
          setCredentials({
            user: res.user,
            accessToken: res.tokens.accessToken,
            refreshToken: res.tokens.refreshToken,
          }),
        );
      }
    },
  });
}

export function useRegister() {
  const dispatch = useAppDispatch();
  return useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onSuccess: (res: { tokens: TokenPair; user: User }) => {
      dispatch(
        setCredentials({
          user: res.user,
          accessToken: res.tokens.accessToken,
          refreshToken: res.tokens.refreshToken,
        }),
      );
    },
  });
}

export function useLogout() {
  const dispatch = useAppDispatch();
  return useMutation({
    // Best-effort device deregistration while we still have a valid token.
    mutationFn: async (refreshToken: string) => {
      await unregisterDeviceToken();
      return authApi.logout(refreshToken);
    },
    onSettled: () => {
      disconnectSocket();
      dispatch(logoutAction());
    },
  });
}
