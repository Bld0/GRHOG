'use client';

import { useCallback, useEffect, useState } from 'react';

import { apiClient } from '@/lib/api-client';

/** Дэлгэрэнгүй дэлгэцэд хэрэглэх савны хэлбэр. */
export interface BinDetail {
  id: number | string;
  binId: string;
  binName: string;
  khoroo: number | null;
  phone: string | null;
  details: string | null;
  location: string;
  fillPercentage: number;
  batteryLevel: number;
  active: boolean;
  coordinates: { lat: number; lng: number };
  clearedAt: Date | null;
  storageLevelBeforeClear: number;
  createdAt: Date;
  totalUsages: number;
  lastEmptied: Date;
  lastEmptyFillLevel: number;
  type: string;
  serialNumber: string;
  installDate: Date;
}

/**
 * Савны дэлгэрэнгүй ба хоослох түүхийг зэрэг татна.
 *
 * Жагсаалт дахин татагдах боломжтой байхын тулд [refetch] гаргана — өмнө нь
 * засварын дараа `window.location.reload()` дуудаж бүх хуудсыг сэргээдэг байв.
 */
export function useBinDetail(id: string) {
  const [bin, setBin] = useState<BinDetail | null>(null);
  const [clearings, setClearings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [binResponse, clearingsResponse] = await Promise.all([
        apiClient.fetchWithAuth(`/api/bins/${id}`),
        apiClient.fetchWithAuth(`/api/bins/${id}/clearings`)
      ]);

      if (!binResponse.ok) {
        setError(binResponse.status === 404 ? 'Сав олдсонгүй' : 'Алдаа гарлаа');
        return;
      }

      const raw = await binResponse.json();
      if (!raw) {
        setError('Сав олдсонгүй');
        return;
      }

      const clearingsData = await clearingsResponse.json();
      setClearings(clearingsData.content || clearingsData || []);
      setError(null);
      setBin({
        id: raw.id,
        binId: raw.binId,
        khoroo: raw.khoroo ?? null,
        phone: raw.phone ?? null,
        details: raw.details ?? null,
        binName: raw.binName || 'Савны нэр олгоогүй',
        location: raw.location || 'Байршил тодорхойгүй',
        fillPercentage: raw.storageLevelPercent || 0,
        batteryLevel: raw.batteryLevelPercent || 0,
        active: raw.active || raw.isActive || false,
        coordinates: { lat: raw.latitude || 0, lng: raw.longitude || 0 },
        clearedAt: raw.clearedAt ? new Date(raw.clearedAt) : null,
        storageLevelBeforeClear: raw.storageLevelBeforeClearPercent || 0,
        createdAt: new Date(raw.createdAt),
        totalUsages: raw.usageCount || 0,
        lastEmptied: raw.lastEmptied
          ? new Date(raw.lastEmptied)
          : new Date(raw.createdAt),
        lastEmptyFillLevel: raw.lastEmptyFillLevel || 0,
        type: raw.type || 'Стандарт',
        // Сериал дугаар байхгүй бол ЗОХИОХГҮЙ. Өмнө нь `SN${Math.random()...}`
        // гэж үүсгэдэг тул хуудас сэргээх бүрд өөр дугаар гарч байв.
        serialNumber: raw.serialNumber || raw.binId || '—',
        installDate: raw.installDate
          ? new Date(raw.installDate)
          : new Date(raw.createdAt)
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return { bin, clearings, loading, error, refetch: load };
}
