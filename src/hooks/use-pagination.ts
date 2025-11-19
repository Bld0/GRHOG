import { useState, useCallback } from 'react';

export interface PaginationState {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  // Statistics fields from API response
  totalBins?: number;
  activeBins?: number;
  averageStorageLevel?: number;
  totalUsages?: number;
  uniqueClients?: number;
  uniqueBins?: number;
  totalClients?: number;
  totalAccess?: number;
  activeClients?: number;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  
  // Filter parameters for clients/cards
  search?: string;
  isActive?: boolean;
  cardId?: string;
  name?: string;
  email?: string;
  phone?: string;
  startDate?: string;
  endDate?: string;
  district?: string;
  khoroo?: string;
  streetBuilding?: string;
  apartmentNumber?: string;
  type?: string;
  totalAccess?: number;
  cardUsedAt?: string;
  
  // Filter parameters for bins
  location?: string;
  binId?: string;
  binName?: string;
  minStorageLevel?: number;
  maxStorageLevel?: number;
  batteryLevel?: string;
  minBatteryLevel?: number;
  maxBatteryLevel?: number;
  
  // Filter parameters for bin usages/transactions
  binIdFilter?: number;
  cardIdFilter?: string;
  clientPhone?: string;
  clientAddress?: string;
  clientName?: string;
  clientType?: string;
  storageLevel?: number;
  statistics?: any;
  
  // Filter parameters for clearings
  clearingBinId?: number;
  minFillLevel?: number;
  maxFillLevel?: number;
  
  // Advanced filter operators
  [key: string]: any; // Allow dynamic filter fields for advanced filtering
}

export function usePagination(initialPage: number = 0, initialSize: number = 20) {
  const [pagination, setPagination] = useState<PaginationState>({
    page: initialPage,
    size: initialSize,
    totalElements: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  });

  const updatePagination = useCallback((data: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  }) => {
    setPagination(data);
  }, []);

  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const setSize = useCallback((size: number) => {
    setPagination(prev => ({ ...prev, size, page: 0 })); // Reset to first page when changing size
  }, []);

  const nextPage = useCallback(() => {
    if (pagination.hasNext) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }));
    }
  }, [pagination.hasNext]);

  const previousPage = useCallback(() => {
    if (pagination.hasPrevious) {
      setPagination(prev => ({ ...prev, page: prev.page - 1 }));
    }
  }, [pagination.hasPrevious]);

  const goToPage = useCallback((page: number) => {
    if (page >= 0 && page < pagination.totalPages) {
      setPagination(prev => ({ ...prev, page }));
    }
  }, [pagination.totalPages]);

  const resetPagination = useCallback(() => {
    setPagination({
      page: initialPage,
      size: initialSize,
      totalElements: 0,
      totalPages: 0,
      hasNext: false,
      hasPrevious: false,
    });
  }, [initialPage, initialSize]);

  return {
    pagination,
    updatePagination,
    setPage,
    setSize,
    nextPage,
    previousPage,
    goToPage,
    resetPagination,
  };
} 