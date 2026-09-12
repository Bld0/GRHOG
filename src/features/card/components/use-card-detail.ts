'use client';

import { useCallback, useEffect, useState } from 'react';

import { apiClient } from '@/lib/api-client';

export interface CardDetail {
  id: number;
  name: string;
  cardId: string;
  cardIdDec: string | null;
  cardIdConverted: boolean;
  address: string | null;
  status: 'active' | 'inactive';
  totalAccess: number;
  uniqueBins: number;
  /** Бүртгэгдсэнээс хойшхи өдрийн дундаж (backend тооцоолно). */
  accessesPerDay: number;
  /** Сүүлийн 7 хоногийн БОДИТ тоо (backend тооцоолно). */
  recentAccess: number;
  lastAccess: Date | null;
  email: string | null;
  phone: string | null;
  createdAt: Date | undefined;
  updatedAt: Date | undefined;
  mostUsedBin: string;
  district: string | null;
  khoroo: number | null;
  streetBuilding: string | null;
  apartmentNumber: number | null;
  type: 'ААНБ' | 'СӨХ' | 'Айл' | 'Ажилтан' | null;
}

export interface AccessHistoryItem {
  id: number;
  binId: string | number;
  binName: string;
  binLocation: string;
  createdAt: string;
  storageLevel: number;
  batteryLevel: string;
}

/**
 * Нэг картын идэвхийн мэдээлэл ба нэвтрэлтийн түүх.
 *
 * Өмнө нь энэ дуудлага дэлгэцийн `useEffect` дотор байсан бөгөөд гурван
 * ЗОХИОМОЛ үзүүлэлт тооцдог байв: `averageAccessPerWeek = accessesPerDay * 7`,
 * `monthlyAccess = accessesPerDay * 30` (хэмжилт биш, зүгээр үржвэр) ба
 * `activityScore = accessesPerDay / 2 * 100` («өдөрт 2 удаа = 100%» гэсэн
 * зохиомол босго). Гурвуулаа хувь/тоо хэлбэрээр харагддаг тул хэрэглэгч
 * бодит хэмжилт гэж уншдаг байсан — бүгдийг хассан.
 */
export function useCardDetail(cardId: string) {
  const [card, setCard] = useState<CardDetail | null>(null);
  const [history, setHistory] = useState<AccessHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.fetchWithAuth(
        `/api/clients/${cardId}/activity`
      );
      if (!response.ok) {
        setError(response.status === 404 ? 'Карт олдсонгүй' : 'Алдаа гарлаа');
        return;
      }

      const data = await response.json();
      setHistory(data.activityHistory || []);
      setError(null);
      setCard({
        id: data.id,
        name: data.clientName,
        cardId: data.cardId,
        cardIdDec: data.clientCardIdDec,
        cardIdConverted: data.cardIdConverted || false,
        address: data.clientAddress,
        status: data.clientStatus || 'active',
        totalAccess: data.totalAccess,
        uniqueBins: data.uniqueBins,
        accessesPerDay: data.accessesPerDay || 0,
        recentAccess: data.recentAccess,
        lastAccess: data.lastAccess ? new Date(data.lastAccess) : null,
        email: data.clientEmail,
        phone: data.clientPhone,
        createdAt: data.clientCreatedAt
          ? new Date(data.clientCreatedAt)
          : undefined,
        updatedAt: data.clientUpdatedAt
          ? new Date(data.clientUpdatedAt)
          : undefined,
        mostUsedBin: data.mostUsedBin,
        district: data.clientDistrict || null,
        khoroo: data.clientKhoroo || null,
        streetBuilding: data.clientStreetBuilding || null,
        apartmentNumber: data.clientApartmentNumber || null,
        type: data.clientType || null
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  }, [cardId]);

  useEffect(() => {
    load();
  }, [load]);

  return { card, history, loading, error, refetch: load };
}

/** Сүүлийн [days] хоногт хийгдсэн нэвтрэлтийн БОДИТ тоо. */
export function countRecent(
  history: AccessHistoryItem[],
  days: number
): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);
  return history.filter((item) => new Date(item.createdAt) >= cutoff).length;
}
