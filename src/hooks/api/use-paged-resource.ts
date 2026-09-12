'use client';

import { useCallback, useEffect, useState } from 'react';

import { apiAxios as axios } from '@/lib/api-axios';
import { authUtils } from '@/lib/auth';
import { PaginationParams } from '../use-pagination';
import {
  EMPTY_PAGINATION,
  HookReturn,
  PaginationState,
  buildQueryParams,
  handlePaginationResponse,
  withQuery
} from './pagination';

/**
 * Хуудаслалттай жагсаалт татдаг hook.
 *
 * `useBins`, `useGroupedBins`, `useClients`, `useBinUsages` дөрвүүлээ ижил
 * 76 мөрийг үсэг үсгээр давтдаг байсан — ялгаа нь зөвхөн endpoint ба
 * TypeScript-ийн төрөл. `useGroupedBins` бүр `useBins`-тэй ЯГ ижил цэг рүү
 * ханддаг байв.
 */
export function usePagedResource<T>(
  endpoint: string,
  enabled: boolean = true,
  paginationParams?: PaginationParams
): HookReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    ...EMPTY_PAGINATION,
    page: paginationParams?.page || 0,
    size: paginationParams?.size || 20
  });

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const url = withQuery(endpoint, buildQueryParams(paginationParams));
      const response = await axios.get(url, {
        headers: authUtils.getAuthHeader()
      });
      if (response.status !== 200) {
        throw new Error(`Failed to fetch ${endpoint}`);
      }

      const { content, pagination: paginationData } = handlePaginationResponse(
        response.data
      );
      setData(content);
      setPagination(paginationData);
    } catch (err) {
      // Нэвтрэлтийн алдааг нэг газраас зохицуулна.
      if (!authUtils.handleAuthError(err)) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
      setData([]);
      setPagination(EMPTY_PAGINATION);
    } finally {
      setLoading(false);
    }
  }, [endpoint, enabled, paginationParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, pagination, refetch: fetchData };
}
