'use client';

import { useCallback, useEffect, useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { parseTime, type IotRow } from '../iot-grouping';
import { AUTO_REFRESH_MS, type Status } from './ingestion-format';

/**
 * IoT логийн түүхий мөрүүд + real-time auto-refresh.
 *
 * `nowMs` нь «гацсан PENDING»-ийг тооцоолоход хэрэгтэй — таталт бүрд шинэчлэгдэнэ.
 */
export function useIngestionRows() {
  const [rows, setRows] = useState<IotRow[] | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);

  // silent = true үед spinner үзүүлэхгүй чимээгүй шинэчилнэ (auto-refresh)
  const fetchRows = useCallback(async (silent = false) => {
    if (!silent) setStatus('loading');
    try {
      const res = await apiClient.fetchWithAuth(
        '/api/raw-data/iot-request-log?limit=5000'
      );
      if (!res.ok) {
        if (!silent) setStatus('error');
        return;
      }
      const json = (await res.json()) as IotRow[];
      // Хамгийн сүүлд ирсэн нь хамгийн эхэнд
      json.sort(
        (a, b) =>
          parseTime(b.received_at) - parseTime(a.received_at) || b.id - a.id
      );
      setRows(json);
      setNowMs(Date.now());
      setLastFetchedAt(Date.now());
      setStatus('success');
    } catch {
      if (!silent) setStatus('error');
    }
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  // Real-time auto-refresh — идэвхтэй tab дээр л ажиллана
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      if (
        typeof document === 'undefined' ||
        document.visibilityState === 'visible'
      ) {
        fetchRows(true);
      }
    }, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [autoRefresh, fetchRows]);

  return {
    rows,
    status,
    nowMs,
    autoRefresh,
    setAutoRefresh,
    lastFetchedAt,
    refetch: fetchRows
  };
}
