'use client';

import { useCallback, useEffect, useState } from 'react';

import { apiAxios as axios } from '@/lib/api-axios';
import { authUtils } from '@/lib/auth';

export interface ApiResourceReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Нэг объект татдаг hook.
 *
 * Analytics ба dashboard-ын 13 hook тус бүрдээ ижил 40 мөрийг (`useState` ×3,
 * `useCallback`, `try/catch`, `authUtils.handleAuthError`, `useEffect`)
 * хуулж бичсэн байв — ялгаа нь зөвхөн URL ба алдааны мессеж.
 *
 * [enabled] `false` бол хүсэлт явуулахгүй (жишээ нь `cardId` хоосон үед).
 */
export function useApiResource<T>(
  url: string,
  enabled: boolean = true
): ApiResourceReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(url, {
        headers: authUtils.getAuthHeader()
      });
      if (response.status !== 200) {
        throw new Error(`Failed to fetch ${url}`);
      }
      setData(response.data);
    } catch (err) {
      // Нэвтрэлтийн алдааг нэг газраас зохицуулна.
      if (!authUtils.handleAuthError(err)) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  }, [url, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
