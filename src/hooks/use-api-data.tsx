'use client';

import { useMemo } from 'react';

import {
  Bin,
  BinClearing,
  BinStatistics,
  BinUsage,
  Client,
  ClearingEfficiency,
  ClientActivity,
  CollectionTrends,
  DashboardActiveBins,
  DashboardAverageFilling,
  DashboardCurrentUsage,
  DashboardTotalCards,
  DistrictKhorooGroup,
  PenetrationAnalysis,
  TotalHouseholdsData,
  UsageStatistics
} from '@/types';
import { API_ENDPOINTS } from '@/lib/api';
import { PaginationParams } from './use-pagination';
import { HookReturn, buildQueryParams, withQuery } from './api/pagination';
import { useApiResource } from './api/use-api-resource';
import { usePagedResource } from './api/use-paged-resource';

export type { HookReturn, PaginationState, Statistics } from './api/pagination';

// ---------------------------------------------------------------------------
// Хуудаслалттай жагсаалтууд
//
// Дөрвүүлээ `usePagedResource`-ийн нимгэн бүрхүүл. Өмнө нь тус бүрдээ ижил
// 76 мөрийг (useState ×4, useCallback, try/catch, useEffect) давтдаг байв.
// ---------------------------------------------------------------------------

export function useBins(
  enabled: boolean = true,
  paginationParams?: PaginationParams
): HookReturn<Bin> {
  return usePagedResource<Bin>(API_ENDPOINTS.BINS, enabled, paginationParams);
}

/**
 * Дүүрэг/хороогоор бүлэглэсэн сав.
 *
 * `useBins`-тэй ЯГ ижил цэг рүү ханддаг — ялгаа нь зөвхөн хариуг хэрхэн
 * тайлбарлах TypeScript төрөл.
 */
export function useGroupedBins(
  enabled: boolean = true,
  paginationParams?: PaginationParams
): HookReturn<DistrictKhorooGroup> {
  return usePagedResource<DistrictKhorooGroup>(
    API_ENDPOINTS.BINS,
    enabled,
    paginationParams
  );
}

export function useClients(
  enabled: boolean = true,
  paginationParams?: PaginationParams
): HookReturn<Client> {
  return usePagedResource<Client>(
    API_ENDPOINTS.CLIENTS,
    enabled,
    paginationParams
  );
}

export function useBinUsages(
  enabled: boolean = true,
  paginationParams?: PaginationParams
): HookReturn<BinUsage> {
  return usePagedResource<BinUsage>(
    API_ENDPOINTS.BIN_USAGES,
    enabled,
    paginationParams
  );
}

/**
 * Хоослолтууд — бусад жагсаалтаас ялгаатай нь `PagedResponse`-ийг задлалгүй
 * бүтнээр нь буцаадаг тул дуудагчийн гэрээ өөр.
 */
export function useClearings(params?: {
  startDate?: string;
  endDate?: string;
  binId?: number;
  page?: number;
  size?: number;
}) {
  const url = useMemo(
    () => withQuery(API_ENDPOINTS.CLEARINGS, buildQueryParams(params as any)),
    [params]
  );
  const { data, loading, error, refetch } = useApiResource<{
    content: BinClearing[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    size: number;
  }>(url);
  return { clearings: data, loading, error, refetch };
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export function useBinStatistics() {
  return useApiResource<BinStatistics>(API_ENDPOINTS.ANALYTICS_BIN_STATISTICS);
}

export function useUsageStatistics(
  period: string = 'daily',
  startDate?: string,
  endDate?: string
) {
  const url = useMemo(() => {
    const query = new URLSearchParams({ period });
    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);
    return `${API_ENDPOINTS.ANALYTICS_USAGE_STATISTICS}?${query.toString()}`;
  }, [period, startDate, endDate]);
  return useApiResource<UsageStatistics>(url);
}

export function usePenetrationAnalysis() {
  return useApiResource<PenetrationAnalysis>(
    API_ENDPOINTS.ANALYTICS_PENETRATION_ANALYSIS
  );
}

export function useClearingEfficiency() {
  return useApiResource<ClearingEfficiency>(
    API_ENDPOINTS.ANALYTICS_CLEARING_EFFICIENCY
  );
}

/** [cardId] хоосон бол хүсэлт явуулахгүй. */
export function useClientActivity(cardId: string) {
  return useApiResource<ClientActivity>(
    `/api/clients/${cardId}/activity`,
    Boolean(cardId)
  );
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export function useDashboardActiveBins() {
  return useApiResource<DashboardActiveBins>(
    API_ENDPOINTS.DASHBOARD_ACTIVE_BINS
  );
}

export function useTotalHouseHoldsCount() {
  return useApiResource<TotalHouseholdsData>(
    API_ENDPOINTS.DASHBOARD_TOTAL_HOUSEHOLDS
  );
}

/** Картын төрөл бүрийн тоо — массив. */
export function useDashboardTotalCards() {
  return useApiResource<DashboardTotalCards[]>(
    API_ENDPOINTS.DASHBOARD_TOTAL_CARDS
  );
}

/** Идэвхтэй картын тоо — цэвэр тоо. */
export function useDashboardActiveCards() {
  return useApiResource<number>(API_ENDPOINTS.DASHBOARD_ACTIVE_CARDS);
}

export function useDashboardCurrentUsage() {
  return useApiResource<DashboardCurrentUsage>(
    API_ENDPOINTS.DASHBOARD_CURRENT_USAGE
  );
}

export function useDashboardAverageFilling() {
  return useApiResource<DashboardAverageFilling>(
    API_ENDPOINTS.DASHBOARD_AVERAGE_FILLING
  );
}

export function useCollectionTrends() {
  return useApiResource<CollectionTrends>('/api/dashboard/collection-trends');
}

export function useClientActivityChange() {
  return useApiResource<{
    currentRate: number;
    previousRate: number;
    change: number;
    changePercentage: number;
    isPositive: boolean;
  }>('/api/dashboard/client-activity-change');
}
