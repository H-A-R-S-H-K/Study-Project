import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { config } from '../config';
import { store } from '../redux/store';
import { logout, updateTokens } from '../redux/slices/authSlice';

/**
 * Central Axios instance. Two interceptors implement the token lifecycle:
 *   1. request  → attach the current access token.
 *   2. response → on a 401, transparently refresh once and replay the request;
 *                 if refresh fails, log the user out.
 *
 * The concrete refresh endpoint is wired in Phase 2; the plumbing lives here so
 * every feature's data layer inherits it for free.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: config.requestTimeoutMs,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((cfg: InternalAxiosRequestConfig) => {
  const token = store.getState().auth.accessToken;
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

let refreshing: Promise<string | null> | null = null;

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;

    if (status === 401 && original && !original._retry) {
      original._retry = true;
      refreshing ??= refreshAccessToken();
      const newToken = await refreshing;
      refreshing = null;

      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      }
      store.dispatch(logout());
    }
    return Promise.reject(error);
  },
);

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = store.getState().auth.refreshToken;
  if (!refreshToken) return null;
  try {
    // Bare axios (not apiClient) to avoid interceptor recursion.
    const { data } = await axios.post(`${config.apiBaseUrl}/auth/refresh`, { refreshToken });
    store.dispatch(
      updateTokens({ accessToken: data.data.accessToken, refreshToken: data.data.refreshToken }),
    );
    return data.data.accessToken as string;
  } catch {
    return null;
  }
}
