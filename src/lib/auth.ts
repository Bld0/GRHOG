// Authentication utilities
const TOKEN_KEY = 'grhog-auth-token';
const REFRESH_TOKEN_KEY = 'grhog-refresh-token';
const USER_CONFIG_KEY = 'grhog-user-config';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface UserPermissions {
  canGet: boolean;
  canPost: boolean;
  canPut: boolean;
  canDelete: boolean;
  canViewAllData: boolean;
  canManageBins: boolean;
  canManageClients: boolean;
  canManageUsers: boolean;
  canViewAnalytics: boolean;
  canViewDashboard: boolean;
  canViewTransactions: boolean;
  canViewReports: boolean;
}

export interface UserConfig {
  showUserManagement: boolean;
  showBinManagement: boolean;
  showClientManagement: boolean;
  showAnalytics: boolean;
  showDashboard: boolean;
  showTransactions: boolean;
  showReports: boolean;
  canCreateUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  canCreateBins: boolean;
  canEditBins: boolean;
  canDeleteBins: boolean;
  canCreateClients: boolean;
  canEditClients: boolean;
  canDeleteClients: boolean;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  username: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'VIEWER';
  isActive?: boolean;
  active?: boolean;
  permissions: UserPermissions;
  config: UserConfig;
}

// Helper function to check if we're on the client side
const isClient = typeof window !== 'undefined';

// Token and user config management
export const authUtils = {
  // Store authentication data in localStorage and set cookie for middleware
  setAuthData: (authResponse: AuthResponse): void => {
    if (isClient) {
      localStorage.setItem(TOKEN_KEY, authResponse.token);
      
      // Store refresh token if provided
      if (authResponse.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, authResponse.refreshToken);
      }
      
      localStorage.setItem(USER_CONFIG_KEY, JSON.stringify({
        username: authResponse.username,
        email: authResponse.email,
        role: authResponse.role,
        isActive: authResponse.isActive || authResponse.active || false,
        permissions: authResponse.permissions,
        config: authResponse.config
      }));
      
      // Set cookie for middleware authentication check
      document.cookie = `auth-token=authenticated; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
    }
  },

  // Store token in localStorage and set cookie for middleware
  setToken: (token: string): void => {
    if (isClient) {
      localStorage.setItem(TOKEN_KEY, token);
      // Set cookie for middleware authentication check
      document.cookie = `auth-token=authenticated; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
    }
  },

  // Store refresh token
  setRefreshToken: (refreshToken: string): void => {
    if (isClient) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  },

  // Get token from localStorage
  getToken: (): string | null => {
    if (isClient) {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  },

  // Get refresh token from localStorage
  getRefreshToken: (): string | null => {
    if (isClient) {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return null;
  },

  // Get user config from localStorage
  getUserConfig: (): Omit<AuthResponse, 'token'> | null => {
    if (isClient) {
      const configStr = localStorage.getItem(USER_CONFIG_KEY);
      return configStr ? JSON.parse(configStr) : null;
    }
    return null;
  },

  // Remove token and user config from localStorage and cookie
  removeAuthData: (): void => {
    if (isClient) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_CONFIG_KEY);
      // Remove cookie
      document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  },

  // Remove token from localStorage and cookie
  removeToken: (): void => {
    if (isClient) {
      localStorage.removeItem(TOKEN_KEY);
      // Remove cookie
      document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    if (!isClient) return false;
    const token = authUtils.getToken();
    return !!token;
  },

  // Check if token is expired (basic check)
  isTokenExpired: (): boolean => {
    if (!isClient) return true;
    const token = authUtils.getToken();
    if (!token) return true;
    
    try {
      // Basic JWT expiration check (payload is base64 encoded)
      const payload = token.split('.')[1];
      if (!payload) return true;
      
      const decoded = JSON.parse(atob(payload));
      const exp = decoded.exp * 1000; // Convert to milliseconds
      
      return Date.now() >= exp;
    } catch {
      return true;
    }
  },

  // Get authorization header
  getAuthHeader: (): Record<string, string> => {
    const token = authUtils.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  // Check if user has specific permission
  hasPermission: (permission: keyof UserPermissions): boolean => {
    if (!isClient) return false;
    const userConfig = authUtils.getUserConfig();
    return userConfig?.permissions?.[permission] || false;
  },

  // Check if user can perform specific action
  canPerform: (action: keyof UserConfig): boolean => {
    if (!isClient) return false;
    const userConfig = authUtils.getUserConfig();
    return userConfig?.config?.[action] || false;
  },

  // Get user role
  getUserRole: (): string | null => {
    if (!isClient) return null;
    const userConfig = authUtils.getUserConfig();
    return userConfig?.role || null;
  },

  // Check if user is super admin
  isSuperAdmin: (): boolean => {
    if (!isClient) return false;
    return authUtils.getUserRole() === 'SUPER_ADMIN';
  },

  // Check if user is admin
  isAdmin: (): boolean => {
    if (!isClient) return false;
    const role = authUtils.getUserRole();
    return role === 'SUPER_ADMIN' || role === 'ADMIN';
  },

  // Check if user is viewer
  isViewer: (): boolean => {
    if (!isClient) return false;
    return authUtils.getUserRole() === 'VIEWER';
  },

  // Check if user is active
  isUserActive: (): boolean => {
    if (!isClient) return false;
    const userConfig = authUtils.getUserConfig();
    return userConfig?.isActive || userConfig?.active || false;
  },

  // Get user info
  getUserInfo: (): { username: string; email: string; role: string } | null => {
    if (!isClient) return null;
    const userConfig = authUtils.getUserConfig();
    if (!userConfig) return null;
    return {
      username: userConfig.username,
      email: userConfig.email,
      role: userConfig.role
    };
  },

  // Handle authentication errors globally
  handleAuthError: (error: any): boolean => {
    if (error.response?.status === 401 || error.status === 401 || 
        error.response?.status === 403 || error.status === 403) {
      authUtils.removeAuthData();
      // Redirect to login page
      if (isClient && window.location.pathname !== '/auth/sign-in') {
        window.location.href = '/auth/sign-in';
      }
      return true;
    }
    return false;
  },

  // Validate current authentication status
  validateAuth: (): boolean => {
    if (!isClient) return false;
    
    const token = authUtils.getToken();
    if (!token) return false;
    
    // Check if token is expired
    if (authUtils.isTokenExpired()) {
      authUtils.removeAuthData();
      return false;
    }
    
    return true;
  },
};
