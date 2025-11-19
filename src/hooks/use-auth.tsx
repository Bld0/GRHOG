'use client';

import { useState, useEffect } from 'react';
import { signIn, signOut } from '@/lib/api';
import { authUtils, LoginCredentials, AuthResponse } from '@/lib/auth';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<AuthResponse | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = authUtils.isAuthenticated();
      const userConfig = authUtils.getUserConfig();
      
      setIsAuthenticated(authenticated);
      if (userConfig && authenticated) {
        setUser({
          token: authUtils.getToken() || '',
          username: userConfig.username,
          email: userConfig.email,
          role: userConfig.role,
          isActive: userConfig.isActive || userConfig.active || false,
          permissions: userConfig.permissions,
          config: userConfig.config
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await signIn(credentials);
      
      if (response.token) {
        // Store auth data in localStorage
        authUtils.setAuthData(response);
        
        setIsAuthenticated(true);
        setUser({
          ...response,
          isActive: response.isActive || response.active || false
        });
        return true;
      } else {
        throw new Error('No token received');
      }
    } catch (err) {
      let errorMessage = 'Login failed';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      // Handle axios errors with response data
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as any;
        if (axiosError.response?.data?.error) {
          errorMessage = axiosError.response.data.error;
        } else if (axiosError.response?.status === 406) {
          errorMessage = 'Invalid credentials. Please check your username and password.';
        } else if (axiosError.response?.status === 503) {
          errorMessage = 'Backend server is not available. Please try again later.';
        }
      }
      
      setError(errorMessage);
      setIsAuthenticated(false);
      setUser(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await signOut();
    } catch (error) {
      // Ignore logout errors
    } finally {
      authUtils.removeAuthData();
      setIsAuthenticated(false);
      setUser(null);
      setError(null);
    }
  };

  // Check if user has specific permission
  const hasPermission = (permission: keyof AuthResponse['permissions']): boolean => {
    return user?.permissions?.[permission] || false;
  };

  // Check if user can perform specific action
  const canPerform = (action: keyof AuthResponse['config']): boolean => {
    return user?.config?.[action] || false;
  };

  // Get user role
  const getUserRole = (): string | null => {
    return user?.role || null;
  };

  // Check if user is super admin
  const isSuperAdmin = (): boolean => {
    return getUserRole() === 'SUPER_ADMIN';
  };

  // Check if user is admin
  const isAdmin = (): boolean => {
    const role = getUserRole();
    return role === 'SUPER_ADMIN' || role === 'ADMIN';
  };

  // Check if user is viewer
  const isViewer = (): boolean => {
    return getUserRole() === 'VIEWER';
  };

  return {
    isAuthenticated,
    isLoading,
    error,
    user,
    login,
    logout,
    hasPermission,
    canPerform,
    getUserRole,
    isSuperAdmin,
    isAdmin,
    isViewer,
  };
} 