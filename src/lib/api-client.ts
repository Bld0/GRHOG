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

  private async refreshToken(): Promise<string | null> {
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
      
      // Store new tokens
      authUtils.setToken(data.accessToken);
      localStorage.setItem('grhog-refresh-token', data.refreshToken);
      
      return data.accessToken;
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
