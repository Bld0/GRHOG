import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { authUtils } from './auth';
import { refreshAccessToken } from './api-client';

// Axios instance that mirrors apiClient.fetchWithAuth: it injects the bearer
// token on every request and transparently refreshes it once on 401/403,
// then replays the original request. Import this in place of the bare `axios`
// in data hooks so they get automatic token refresh.
export const apiAxios = axios.create();

apiAxios.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = authUtils.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiAxios.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    // Token likely expired — refresh once and replay the original request.
    if ((status === 401 || status === 403) && original && !original._retry) {
      original._retry = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiAxios(original);
      }
      // refreshAccessToken() already cleared auth and redirected to sign-in.
    }

    return Promise.reject(error);
  }
);
