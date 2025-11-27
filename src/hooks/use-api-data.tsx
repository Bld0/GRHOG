'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Bin,
  Client,
  BinUsage,
  BinClearing,
  BinStatistics,
  UsageStatistics,
  PenetrationAnalysis,
  ClearingEfficiency,
  ClientActivity,
  DashboardActiveBins,
  DashboardTotalCards,
  DashboardCurrentUsage,
  DashboardAverageFilling,
  CollectionTrends,
  DistrictKhorooGroup,
  TotalHouseholdsData
} from '@/types';
import axios from 'axios';
import { API_ENDPOINTS } from '@/lib/api';
import { authUtils } from '@/lib/auth';
import { PaginationParams } from './use-pagination';

// Common pagination state interface
interface PaginationState {
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
  statistics?: Statistics;
}

interface Statistics {
  uniqueClientCount: number;
  uniqueBinCount: number;
  totalAccessedCount: number;
  totalActiveBins: number;
  overallAvgStorageLevelPercent: number;
  overallAvgBatteryLevelPercent: number;
}

// Common hook return type
interface HookReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  pagination: PaginationState;
  refetch: () => void;
}

// Generic function to handle pagination response
const handlePaginationResponse = (
  data: any
): { content: any[]; pagination: PaginationState } => {
  if (Array.isArray(data)) {
    // Handle direct array response (backward compatibility)
    return {
      content: data,
      pagination: {
        page: 0,
        size: data.length,
        totalElements: data.length,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false
      }
    };
  } else if (data && data.content && Array.isArray(data.content)) {
    // Handle PagedResponse format with statistics
    return {
      content: data.content,
      pagination: {
        page: data.page || 0,
        size: data.size || 20,
        totalElements: data.totalElements || 0,
        totalPages: data.totalPages || 0,
        hasNext: data.hasNext || false,
        hasPrevious: data.hasPrevious || false,
        // Extract statistics fields
        totalBins: data.totalBins,
        activeBins: data.activeBins,
        averageStorageLevel: data.averageStorageLevel,
        totalUsages: data.totalUsages,
        uniqueClients: data.uniqueClients,
        uniqueBins: data.uniqueBins,
        totalClients: data.totalClients,
        totalAccess: data.totalAccess,
        activeClients: data.activeClients,
        // Extract statistics object
        statistics: data.statistics
      }
    };
  } else {
    // Handle unexpected format
    console.warn('Unexpected data format:', data);
    return {
      content: [],
      pagination: {
        page: 0,
        size: 20,
        totalElements: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false
      }
    };
  }
};

// Generic function to build query parameters
const buildQueryParams = (
  paginationParams?: PaginationParams
): URLSearchParams => {
  const queryParams = new URLSearchParams();

  if (paginationParams?.page !== undefined) {
    queryParams.append('page', paginationParams.page.toString());
  }
  if (paginationParams?.size !== undefined) {
    queryParams.append('size', paginationParams.size.toString());
  }
  if (paginationParams?.sortBy) {
    queryParams.append('sortBy', paginationParams.sortBy);
  }
  if (paginationParams?.sortDirection) {
    queryParams.append('sortDirection', paginationParams.sortDirection);
  }

  // Basic filter parameters
  if (paginationParams?.search) {
    queryParams.append('search', paginationParams.search);
  }
  if (paginationParams?.isActive !== undefined) {
    queryParams.append('isActive', paginationParams.isActive.toString());
  }
  if (paginationParams?.cardId) {
    queryParams.append('cardId', paginationParams.cardId);
  }
  if (paginationParams?.name) {
    queryParams.append('name', paginationParams.name);
  }
  if (paginationParams?.email) {
    queryParams.append('email', paginationParams.email);
  }
  if (paginationParams?.phone) {
    queryParams.append('phone', paginationParams.phone);
  }
  if (paginationParams?.startDate) {
    queryParams.append('startDate', paginationParams.startDate);
  }
  if (paginationParams?.endDate) {
    queryParams.append('endDate', paginationParams.endDate);
  }

  // Bin filter parameters
  if (paginationParams?.location) {
    queryParams.append('location', paginationParams.location);
  }
  if (paginationParams?.binId) {
    queryParams.append('binId', paginationParams.binId);
  }
  if (paginationParams?.binName) {
    queryParams.append('binName', paginationParams.binName);
  }
  if (paginationParams?.minStorageLevel !== undefined) {
    queryParams.append(
      'minStorageLevel',
      paginationParams.minStorageLevel.toString()
    );
  }
  if (paginationParams?.maxStorageLevel !== undefined) {
    queryParams.append(
      'maxStorageLevel',
      paginationParams.maxStorageLevel.toString()
    );
  }
  if (paginationParams?.batteryLevel) {
    queryParams.append('batteryLevel', paginationParams.batteryLevel);
  }
  if (paginationParams?.minBatteryLevel !== undefined) {
    queryParams.append(
      'minBatteryLevel',
      paginationParams.minBatteryLevel.toString()
    );
  }
  if (paginationParams?.maxBatteryLevel !== undefined) {
    queryParams.append(
      'maxBatteryLevel',
      paginationParams.maxBatteryLevel.toString()
    );
  }
  if (paginationParams?.type) {
    queryParams.append('type', paginationParams.type);
  }

  // Card/Client filter parameters
  if (paginationParams?.district) {
    queryParams.append('district', paginationParams.district);
  }
  if (paginationParams?.khoroo) {
    queryParams.append('khoroo', paginationParams.khoroo);
  }
  if (paginationParams?.streetBuilding) {
    queryParams.append('streetBuilding', paginationParams.streetBuilding);
  }
  if (paginationParams?.apartmentNumber) {
    queryParams.append('apartmentNumber', paginationParams.apartmentNumber);
  }
  if (paginationParams?.totalAccess !== undefined) {
    queryParams.append('totalAccess', paginationParams.totalAccess.toString());
  }
  if (paginationParams?.cardUsedAt) {
    queryParams.append('cardUsedAt', paginationParams.cardUsedAt);
  }

  // Transaction/Usage filter parameters
  if (paginationParams?.clientName) {
    queryParams.append('clientName', paginationParams.clientName);
  }
  if (paginationParams?.clientType) {
    queryParams.append('clientType', paginationParams.clientType);
  }
  if (paginationParams?.storageLevel !== undefined) {
    queryParams.append(
      'storageLevel',
      paginationParams.storageLevel.toString()
    );
  }

  // Bin usage filter parameters
  if (paginationParams?.binIdFilter !== undefined) {
    queryParams.append('binId', paginationParams.binIdFilter.toString());
  }
  if (paginationParams?.cardIdFilter) {
    queryParams.append('cardId', paginationParams.cardIdFilter);
  }
  if (paginationParams?.clientPhone) {
    queryParams.append('clientPhone', paginationParams.clientPhone);
  }
  if (paginationParams?.clientAddress) {
    queryParams.append('clientAddress', paginationParams.clientAddress);
  }

  // Clearing filter parameters
  if (paginationParams?.clearingBinId !== undefined) {
    queryParams.append('binId', paginationParams.clearingBinId.toString());
  }
  if (paginationParams?.minFillLevel !== undefined) {
    queryParams.append(
      'minFillLevel',
      paginationParams.minFillLevel.toString()
    );
  }
  if (paginationParams?.maxFillLevel !== undefined) {
    queryParams.append(
      'maxFillLevel',
      paginationParams.maxFillLevel.toString()
    );
  }

  return queryParams;
};

// Hook for fetching bins data with pagination
export function useBins(
  enabled: boolean = true,
  paginationParams?: PaginationParams
): HookReturn<Bin> {
  const [bins, setBins] = useState<Bin[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    page: paginationParams?.page || 0,
    size: paginationParams?.size || 20,
    totalElements: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false
  });

  const fetchBins = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const queryParams = buildQueryParams(paginationParams);
      const url = `${API_ENDPOINTS.BINS}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await axios.get(url, {
        headers: authUtils.getAuthHeader()
      });

      if (response.status !== 200) {
        throw new Error('Failed to fetch bins');
      }

      const { content, pagination: paginationData } = handlePaginationResponse(
        response.data
      );
      setBins(content);
      setPagination(paginationData);
    } catch (err) {
      // Handle auth errors globally
      if (!authUtils.handleAuthError(err)) {
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
      }
      setBins([]);
      setPagination({
        page: 0,
        size: 20,
        totalElements: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false
      });
    } finally {
      setLoading(false);
    }
  }, [enabled, paginationParams]);

  useEffect(() => {
    fetchBins();
  }, [fetchBins]);

  return {
    data: bins,
    loading,
    error,
    pagination,
    refetch: fetchBins
  };
}

// Hook for fetching grouped bins data (by district & khoroo)
export function useGroupedBins(
  enabled: boolean = true,
  paginationParams?: PaginationParams
): HookReturn<DistrictKhorooGroup> {
  const [groups, setGroups] = useState<DistrictKhorooGroup[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    page: paginationParams?.page || 0,
    size: paginationParams?.size || 20,
    totalElements: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false
  });

  const fetchGroupedBins = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const queryParams = buildQueryParams(paginationParams);
      const url = `${API_ENDPOINTS.BINS}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await axios.get(url, {
        headers: authUtils.getAuthHeader()
      });

      if (response.status !== 200) {
        throw new Error('Failed to fetch grouped bins');
      }

      const { content, pagination: paginationData } = handlePaginationResponse(
        response.data
      );
      setGroups(content);
      setPagination(paginationData);
    } catch (err) {
      // Handle auth errors globally
      if (!authUtils.handleAuthError(err)) {
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
      }
      setGroups([]);
      setPagination({
        page: 0,
        size: 20,
        totalElements: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false
      });
    } finally {
      setLoading(false);
    }
  }, [enabled, paginationParams]);

  useEffect(() => {
    fetchGroupedBins();
  }, [fetchGroupedBins]);

  return {
    data: groups,
    loading,
    error,
    pagination,
    refetch: fetchGroupedBins
  };
}

// Hook for fetching clients data with pagination
export function useClients(
  enabled: boolean = true,
  paginationParams?: PaginationParams
): HookReturn<Client> {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    page: paginationParams?.page || 0,
    size: paginationParams?.size || 20,
    totalElements: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false
  });

  const fetchClients = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const queryParams = buildQueryParams(paginationParams);
      const url = `${API_ENDPOINTS.CLIENTS}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await axios.get(url, {
        headers: authUtils.getAuthHeader()
      });

      if (response.status !== 200) {
        throw new Error('Failed to fetch clients');
      }

      const { content, pagination: paginationData } = handlePaginationResponse(
        response.data
      );
      setClients(content);
      setPagination(paginationData);
    } catch (err) {
      // Handle auth errors globally
      if (!authUtils.handleAuthError(err)) {
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
      }
      setClients([]);
      setPagination({
        page: 0,
        size: 20,
        totalElements: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false
      });
    } finally {
      setLoading(false);
    }
  }, [enabled, paginationParams]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return {
    data: clients,
    loading,
    error,
    pagination,
    refetch: fetchClients
  };
}

// Hook for fetching bin usages data with pagination
export function useBinUsages(
  enabled: boolean = true,
  paginationParams?: PaginationParams
): HookReturn<BinUsage> {
  const [binUsages, setBinUsages] = useState<BinUsage[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    page: paginationParams?.page || 0,
    size: paginationParams?.size || 20,
    totalElements: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false
  });

  const fetchBinUsages = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const queryParams = buildQueryParams(paginationParams);
      const url = `${API_ENDPOINTS.BIN_USAGES}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await axios.get(url, {
        headers: authUtils.getAuthHeader()
      });

      if (response.status !== 200) {
        throw new Error('Failed to fetch bin usages');
      }

      const { content, pagination: paginationData } = handlePaginationResponse(
        response.data
      );
      setBinUsages(content);
      setPagination(paginationData);
    } catch (err) {
      // Handle auth errors globally
      if (!authUtils.handleAuthError(err)) {
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
      }
      setBinUsages([]);
      setPagination({
        page: 0,
        size: 20,
        totalElements: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false
      });
    } finally {
      setLoading(false);
    }
  }, [enabled, paginationParams]);

  useEffect(() => {
    fetchBinUsages();
  }, [fetchBinUsages]);

  return {
    data: binUsages,
    loading,
    error,
    pagination,
    refetch: fetchBinUsages
  };
}

// Hook for fetching clearing data
export function useClearings(params?: {
  startDate?: string;
  endDate?: string;
  binId?: number;
  page?: number;
  size?: number;
}) {
  const [clearings, setClearings] = useState<{
    content: BinClearing[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    size: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClearings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);
      if (params?.binId) queryParams.append('binId', params.binId.toString());
      if (params?.page !== undefined)
        queryParams.append('page', params.page.toString());
      if (params?.size) queryParams.append('size', params.size.toString());

      const url = `${API_ENDPOINTS.CLEARINGS}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await axios.get(url, {
        headers: authUtils.getAuthHeader()
      });

      if (response.status !== 200) {
        throw new Error('Failed to fetch clearings');
      }

      setClearings(response.data);
    } catch (err) {
      // Handle auth errors globally
      if (!authUtils.handleAuthError(err)) {
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchClearings();
  }, [fetchClearings]);

  return { clearings, loading, error, refetch: fetchClearings };
}

// Analytics hooks
export function useBinStatistics() {
  const [data, setData] = useState<BinStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(API_ENDPOINTS.ANALYTICS_BIN_STATISTICS, {
        headers: authUtils.getAuthHeader()
      });

      if (response.status !== 200) {
        throw new Error('Failed to fetch bin statistics');
      }

      setData(response.data);
    } catch (err) {
      // Handle auth errors globally
      if (!authUtils.handleAuthError(err)) {
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useUsageStatistics(
  period: string = 'daily',
  startDate?: string,
  endDate?: string
) {
  const [data, setData] = useState<UsageStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      queryParams.append('period', period);
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);

      const url = `${API_ENDPOINTS.ANALYTICS_USAGE_STATISTICS}?${queryParams.toString()}`;
      const response = await axios.get(url, {
        headers: authUtils.getAuthHeader()
      });

      if (response.status !== 200) {
        throw new Error('Failed to fetch usage statistics');
      }

      setData(response.data);
    } catch (err) {
      // Handle auth errors globally
      if (!authUtils.handleAuthError(err)) {
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [period, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function usePenetrationAnalysis() {
  const [data, setData] = useState<PenetrationAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        API_ENDPOINTS.ANALYTICS_PENETRATION_ANALYSIS,
        {
          headers: authUtils.getAuthHeader()
        }
      );

      if (response.status !== 200) {
        throw new Error('Failed to fetch penetration analysis');
      }

      setData(response.data);
    } catch (err) {
      // Handle auth errors globally
      if (!authUtils.handleAuthError(err)) {
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useClearingEfficiency() {
  const [data, setData] = useState<ClearingEfficiency | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        API_ENDPOINTS.ANALYTICS_CLEARING_EFFICIENCY,
        {
          headers: authUtils.getAuthHeader()
        }
      );

      if (response.status !== 200) {
        throw new Error('Failed to fetch clearing efficiency');
      }

      setData(response.data);
    } catch (err) {
      // Handle auth errors globally
      if (!authUtils.handleAuthError(err)) {
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Client activity hook
export function useClientActivity(cardId: string) {
  const [data, setData] = useState<ClientActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!cardId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`/api/clients/${cardId}/activity`, {
        headers: authUtils.getAuthHeader()
      });

      if (response.status !== 200) {
        throw new Error('Failed to fetch client activity');
      }

      setData(response.data);
    } catch (err) {
      // Handle auth errors globally
      if (!authUtils.handleAuthError(err)) {
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [cardId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Dashboard API hooks with authentication
export function useDashboardActiveBins() {
  const [data, setData] = useState<DashboardActiveBins | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(API_ENDPOINTS.DASHBOARD_ACTIVE_BINS, {
        headers: authUtils.getAuthHeader()
      });

      if (response.status !== 200) {
        throw new Error('Failed to fetch active bins data');
      }

      setData(response.data);
    } catch (err) {
      // Handle auth errors globally
      if (!authUtils.handleAuthError(err)) {
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useTotalHouseHoldsCount() {
  const [data, setData] = useState<TotalHouseholdsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        API_ENDPOINTS.DASHBOARD_TOTAL_HOUSEHOLDS,
        {
          headers: authUtils.getAuthHeader()
        }
      );

      if (response.status != 200) {
        throw new Error('Failed to fetch active cards data');
      }

      setData(response.data);
    } catch (err) {
      // Handle auth errors globally
      if (!authUtils.handleAuthError(err)) {
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useDashboardTotalCards() {
  const [data, setData] = useState<DashboardTotalCards[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(API_ENDPOINTS.DASHBOARD_TOTAL_CARDS, {
        headers: authUtils.getAuthHeader()
      });

      console.log('Dashboard Total Cards Response:', response);
      if (response.status !== 200) {
        throw new Error('Failed to fetch active cards data');
      }

      setData(response.data);
    } catch (err) {
      // Handle auth errors globally
      if (!authUtils.handleAuthError(err)) {
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useDashboardActiveCards() {
  const [data, setData] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(API_ENDPOINTS.DASHBOARD_ACTIVE_CARDS, {
        headers: authUtils.getAuthHeader()
      });

      console.log('Dashboard Active Cards Response:', response);
      if (response.status !== 200) {
        throw new Error('Failed to fetch active cards data');
      }

      setData(response.data);
    } catch (err) {
      // Handle auth errors globally
      if (!authUtils.handleAuthError(err)) {
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useDashboardCurrentUsage() {
  const [data, setData] = useState<DashboardCurrentUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(API_ENDPOINTS.DASHBOARD_CURRENT_USAGE, {
        headers: authUtils.getAuthHeader()
      });

      if (response.status !== 200) {
        throw new Error('Failed to fetch current usage data');
      }

      setData(response.data);
    } catch (err) {
      // Handle auth errors globally
      if (!authUtils.handleAuthError(err)) {
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useDashboardAverageFilling() {
  const [data, setData] = useState<DashboardAverageFilling | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        API_ENDPOINTS.DASHBOARD_AVERAGE_FILLING,
        {
          headers: authUtils.getAuthHeader()
        }
      );

      if (response.status !== 200) {
        throw new Error('Failed to fetch average filling data');
      }

      setData(response.data);
    } catch (err) {
      // Handle auth errors globally
      if (!authUtils.handleAuthError(err)) {
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useCollectionTrends() {
  const [data, setData] = useState<CollectionTrends | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get('/api/dashboard/collection-trends', {
        headers: authUtils.getAuthHeader()
      });

      if (response.status !== 200) {
        throw new Error('Failed to fetch collection trends data');
      }

      setData(response.data);
    } catch (err) {
      // Handle auth errors globally
      if (!authUtils.handleAuthError(err)) {
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useClientActivityChange() {
  const [data, setData] = useState<{
    currentRate: number;
    previousRate: number;
    change: number;
    changePercentage: number;
    isPositive: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        '/api/dashboard/client-activity-change',
        {
          headers: authUtils.getAuthHeader()
        }
      );

      if (response.status !== 200) {
        throw new Error('Failed to fetch client activity change data');
      }

      setData(response.data);
    } catch (err) {
      // Handle auth errors globally
      if (!authUtils.handleAuthError(err)) {
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
