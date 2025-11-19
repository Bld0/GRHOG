'use client';

import { useMemo } from 'react';
import { useAuth } from './use-auth';

export function useRolePermissions() {
  const { user, hasPermission, canPerform, getUserRole, isSuperAdmin, isAdmin, isViewer, isLoading } = useAuth();

  const permissions = useMemo(() => {
    if (!user) {
      return {
        canGet: false,
        canPost: false,
        canPut: false,
        canDelete: false,
        canViewAllData: false,
        canManageBins: false,
        canManageClients: false,
        canManageUsers: false,
        canViewAnalytics: false,
        canViewDashboard: false,
        canViewTransactions: false,
        canViewReports: false,
      };
    }

    return user.permissions;
  }, [user]);

  const config = useMemo(() => {
    if (!user) {
      return {
        showUserManagement: false,
        showBinManagement: false,
        showClientManagement: false,
        showAnalytics: false,
        showDashboard: false,
        showTransactions: false,
        showReports: false,
        canCreateUsers: false,
        canEditUsers: false,
        canDeleteUsers: false,
        canCreateBins: false,
        canEditBins: false,
        canDeleteBins: false,
        canCreateClients: false,
        canEditClients: false,
        canDeleteClients: false,
      };
    }

    return user.config;
  }, [user]);

  const userRole = useMemo(() => getUserRole(), [getUserRole]);

  // Helper functions for HTTP method permissions
  const canGet = useMemo(() => permissions.canGet, [permissions.canGet]);
  const canPost = useMemo(() => permissions.canPost, [permissions.canPost]);
  const canPut = useMemo(() => permissions.canPut, [permissions.canPut]);
  const canDelete = useMemo(() => permissions.canDelete, [permissions.canDelete]);

  // Helper function to check if user can perform a specific HTTP method
  const canPerformMethod = (method: 'GET' | 'POST' | 'PUT' | 'DELETE') => {
    switch (method) {
      case 'GET':
        return canGet;
      case 'POST':
        return canPost;
      case 'PUT':
        return canPut;
      case 'DELETE':
        return canDelete;
      default:
        return false;
    }
  };

  // Ensure these return boolean values and handle the case where user might not be loaded yet
  const isSuperAdminValue = useMemo(() => {
    if (!user) return false;
    return isSuperAdmin();
  }, [user, isSuperAdmin]);

  const isAdminValue = useMemo(() => {
    if (!user) return false;
    return isAdmin();
  }, [user, isAdmin]);

  const isViewerValue = useMemo(() => {
    if (!user) return false;
    return isViewer();
  }, [user, isViewer]);

  return {
    userRole,
    userConfig: user,
    permissions,
    config,
    isSuperAdmin: isSuperAdminValue,
    isAdmin: isAdminValue,
    isViewer: isViewerValue,
    canPerformAction: canPerform,
    hasPermission,
    isLoading,
    // HTTP method permissions
    canGet,
    canPost,
    canPut,
    canDelete,
    canPerformMethod,
  };
}
