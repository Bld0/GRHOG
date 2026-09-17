'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

export interface KhorooHouseholdRow {
  district: string | null;
  khoroo: number | null;
  total: number;
  inactive: number;
}

export interface CardBucketRow {
  cards: number;
  addresses: number;
}

export interface IncompleteRow {
  district: string | null;
  khoroo: number | null;
  cards: number;
}

export interface AddressStats {
  byKhoroo: KhorooHouseholdRow[];
  cardDistribution: CardBucketRow[];
  incompleteByKhoroo: IncompleteRow[];
}

const EMPTY: AddressStats = {
  byKhoroo: [],
  cardDistribution: [],
  incompleteByKhoroo: []
};

/**
 * Дашбоардын өрхийн үзүүлэлтүүд (`GET /addresses/stats`).
 *
 * Гурван чарт (өрхийн идэвх, картын тархалт, хаяг дутуу) ижил хариунаас
 * уншдаг тул нэг л газар татна.
 *
 * @param enabled false бол огт татахгүй — картын горимд байгаа чартад
 *                хэрэггүй хүсэлт явуулахгүйн тулд
 */
export function useAddressStats(district: string, enabled = true) {
  const [stats, setStats] = useState<AddressStats>(EMPTY);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    const query = district ? `?district=${encodeURIComponent(district)}` : '';
    apiClient
      .fetchWithAuth(`/api/addresses/stats${query}`)
      .then(async (response) => {
        if (!response.ok) throw new Error(await response.text());
        return response.json();
      })
      .then((json: AddressStats) => {
        if (cancelled) return;
        setStats({
          byKhoroo: json?.byKhoroo ?? [],
          cardDistribution: json?.cardDistribution ?? [],
          incompleteByKhoroo: json?.incompleteByKhoroo ?? []
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Алдаа');
        setStats(EMPTY);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [district, enabled]);

  return { stats, loading, error };
}
