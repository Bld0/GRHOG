import { authUtils } from './auth';
import { API_CONFIG } from '@/config/api';

// Enhanced API client with automatic token refresh
class ApiClient {
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];

  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    this.failedQueue = [];
  }

  private refreshPromise: Promise<string | null> | null = null;

  // Dedupe concurrent refreshes: every caller shares the single in-flight
  // refresh instead of each firing its own /auth/refresh request.
  private refreshToken(): Promise<string | null> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.doRefresh().finally(() => {
        this.refreshPromise = null;
      });
    }
    return this.refreshPromise;
  }

  // Public entry point so other transports (e.g. the axios instance) can share
  // the same deduped refresh instead of implementing their own.
  forceRefresh(): Promise<string | null> {
    return this.refreshToken();
  }

  private async doRefresh(): Promise<string | null> {
    try {
      const refreshToken = localStorage.getItem('grhog-refresh-token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();

      // The backend may name the new access token `accessToken` or `token`
      // (signin returns `token`), and may or may not rotate the refresh token.
      // Handle every shape so a naming mismatch can't silently break refresh.
      const newAccessToken = data.accessToken ?? data.token;
      const newRefreshToken = data.refreshToken ?? refreshToken;
      if (!newAccessToken) {
        throw new Error('Refresh response missing access token');
      }

      authUtils.setToken(newAccessToken);
      localStorage.setItem('grhog-refresh-token', newRefreshToken);

      return newAccessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear all auth data on refresh failure
      authUtils.removeAuthData();
      localStorage.removeItem('grhog-refresh-token');

      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/sign-in';
      }

      return null;
    }
  }

  async request<T>(
    url: string,
    options: RequestInit = {},
    requireAuth = true,
    retryCount = 0
  ): Promise<T> {
    try {
      let headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Merge with existing headers
      if (options.headers) {
        if (Array.isArray(options.headers)) {
          options.headers.forEach(([key, value]) => {
            headers[key] = value;
          });
        } else if (typeof options.headers === 'object') {
          Object.assign(headers, options.headers);
        }
      }

      if (requireAuth) {
        const token = authUtils.getToken();
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        if (requireAuth && retryCount === 0) {
          // Try to refresh token
          if (!this.isRefreshing) {
            this.isRefreshing = true;
            
            try {
              const newToken = await this.refreshToken();
              this.isRefreshing = false;
              
              if (newToken) {
                this.processQueue(null, newToken);
                // Retry the request with new token
                return this.request(url, options, requireAuth, retryCount + 1);
              } else {
                this.processQueue(new Error('Token refresh failed'));
                throw new Error('Authentication failed');
              }
            } catch (error) {
              this.isRefreshing = false;
              this.processQueue(error);
              throw error;
            }
          } else {
            // Queue the request if refresh is in progress
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(() => {
              return this.request(url, options, requireAuth, retryCount + 1);
            });
          }
        } else {
          // Clear auth data and redirect to login
          authUtils.removeAuthData();
          localStorage.removeItem('grhog-refresh-token');
          
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/sign-in';
          }
          
          throw new Error('Authentication required');
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Like fetch(), but injects the bearer token and transparently refreshes it
  // once on 401/403, then retries. Returns the raw Response so callers keep
  // their own status/error handling (e.g. reading the backend's `message`).
  async fetchWithAuth(
    url: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<Response> {
    const headers: Record<string, string> = {};
    if (options.headers) {
      if (Array.isArray(options.headers)) {
        options.headers.forEach(([key, value]) => {
          headers[key] = value;
        });
      } else if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } else {
        Object.assign(headers, options.headers);
      }
    }

    const token = authUtils.getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, { ...options, headers });

    // Token likely expired — refresh once and retry the original request.
    if (
      (response.status === 401 || response.status === 403) &&
      retryCount === 0
    ) {
      const newToken = await this.refreshToken();
      if (newToken) {
        return this.fetchWithAuth(url, options, retryCount + 1);
      }
      // refreshToken() already cleared auth and redirected to /auth/sign-in.
    }

    return response;
  }

  // Helper methods for common HTTP operations
  async get<T>(url: string, requireAuth = true): Promise<T> {
    return this.request<T>(url, { method: 'GET' }, requireAuth);
  }

  async post<T>(url: string, data?: any, requireAuth = true): Promise<T> {
    return this.request<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }, requireAuth);
  }

  async put<T>(url: string, data?: any, requireAuth = true): Promise<T> {
    return this.request<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }, requireAuth);
  }

  async delete<T>(url: string, requireAuth = true): Promise<T> {
    return this.request<T>(url, { method: 'DELETE' }, requireAuth);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Shared, deduped access-token refresh. Used by both fetchWithAuth and the
// axios instance so a single /auth/refresh serves all concurrent 401/403s.
export const refreshAccessToken = (): Promise<string | null> =>
  apiClient.forceRefresh();
