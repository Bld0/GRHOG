'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

/**
 * Дүүрэг ба хорооны сонголтууд.
 *
 * Жагсаалт нь ӨГӨГДЛӨӨС гардаг (`/dashboard/getDistrict`, `/dashboard/getKhoroo`),
 * албан ёсны тогтмол жагсаалтаас биш. Тиймээс:
 * - өгөгдөлд нэг ч сав/иргэн байхгүй дүүрэг энд харагдахгүй;
 * - хорооны жагсаалтад 0, 99 гэх мэт бодит бус утга орж ирж болно.
 * Аль аль нь өгөгдлийн чанарын асуудал — цэгцлэхэд жагсаалт өөрөө засагдана.
 */
export function useDistrictOptions() {
  const [districts, setDistricts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    apiClient
      .fetchWithAuth('/api/dashboard/getDistrict')
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => {
        if (!cancelled) setDistricts(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setDistricts([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { districts, isLoading };
}

/**
 * Нэг дүүргийн хороод. `district` хоосон бол огт татахгүй — хороо нь дүүргээсээ
 * салангид утгагүй (хоёр дүүрэгт ижил дугаартай хороо байдаг).
 */
export function useKhorooOptions(district: string | null) {
  const [khoroos, setKhoroos] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!district) {
      setKhoroos([]);
      return;
    }
    setIsLoading(true);
    try {
      const response = await apiClient.fetchWithAuth(
        `/api/dashboard/getKhoroo?district=${encodeURIComponent(district)}`
      );
      const data = response.ok ? await response.json() : [];
      setKhoroos(Array.isArray(data) ? data : []);
    } catch {
      setKhoroos([]);
    } finally {
      setIsLoading(false);
    }
  }, [district]);

  useEffect(() => {
    load();
  }, [load]);

  return { khoroos, isLoading };
}
