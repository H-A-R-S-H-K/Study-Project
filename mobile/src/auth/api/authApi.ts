import { apiClient } from '../../services/apiClient';
import type { ApiEnvelope, User, UserRole, GeoPoint } from '../../types/domain';

/**
 * Thin, typed wrappers over the auth endpoints. Screens never call axios
 * directly — they go through these functions (and the hooks that wrap them),
 * keeping the transport layer in one place.
 */

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface VerifyOtpResponse {
  isNewUser: boolean;
  tokens?: TokenPair;
  user?: User;
  registrationToken?: string;
}

export interface RegisterPayload {
  registrationToken: string;
  name: string;
  role: UserRole;
  email?: string;
  homeAddress?: string;
  location?: GeoPoint;
}

export const authApi = {
  async requestOtp(phone: string): Promise<{ devCode?: string }> {
    const { data } = await apiClient.post<ApiEnvelope<{ devCode?: string }>>(
      '/auth/otp/request',
      { phone },
    );
    return data.data;
  },

  async verifyOtp(phone: string, code: string): Promise<VerifyOtpResponse> {
    const { data } = await apiClient.post<ApiEnvelope<VerifyOtpResponse>>('/auth/otp/verify', {
      phone,
      code,
    });
    return data.data;
  },

  async register(payload: RegisterPayload): Promise<{ tokens: TokenPair; user: User }> {
    const { data } = await apiClient.post<ApiEnvelope<{ tokens: TokenPair; user: User }>>(
      '/auth/register',
      payload,
    );
    return data.data;
  },

  async me(): Promise<User> {
    const { data } = await apiClient.get<ApiEnvelope<User>>('/auth/me');
    return data.data;
  },

  async logout(refreshToken: string): Promise<void> {
    await apiClient.post('/auth/logout', { refreshToken });
  },
};
