'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useRolePermissions } from '@/hooks/use-role-permissions';
import { ClientOnly } from './client-only';
import { authUtils } from '@/lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'SUPER_ADMIN' | 'ADMIN' | 'VIEWER';
  requiredPermission?: string;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  requiredPermission, 
  fallback 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { hasPermission, canPerformAction } = useRolePermissions();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const validateAuthentication = async () => {
      // Check if token is expired
      if (authUtils.isTokenExpired()) {
        authUtils.removeAuthData();
        router.push('/auth/sign-in');
        return;
      }

      // Validate current authentication
      if (!authUtils.validateAuth()) {
        router.push('/auth/sign-in');
        return;
      }

      setIsValidating(false);
    };

    if (!isLoading) {
      validateAuthentication();
    }
  }, [isLoading, router]);

  useEffect(() => {
    if (!isLoading && !isValidating && !isAuthenticated && !user?.active && !user?.isActive && requiredPermission) {
      const redirectUrl = searchParams.get('redirect') || '/dashboard';
      router.push(`/auth/sign-in?redirect=${encodeURIComponent(redirectUrl)}`);
    }
  }, [isLoading, isValidating, isAuthenticated, router, searchParams, user, requiredPermission]);

  // Show loading while validating
  if (isLoading || isValidating) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // All checks passed, render children
  return (
    <ClientOnly
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      }
    >
      {children}
    </ClientOnly>
  );
}
