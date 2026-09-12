'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { apiClient } from '@/lib/api-client';
import { useDebounce } from '@/hooks/use-debounce';
import {
  ActivityClient,
  ActivityTab,
  ClientActivityReport as ActivityReport,
  InactivityBucket,
  ReportFilters,
  UsageBucket,
  toQuery
} from '../../types';

export const PAGE_SIZE = 20;

/**
 * Идэвхийн тайлангийн бүх таталт ба шүүлтүүрийн төлөв.
 *
 * Өмнө нь энэ 132 мөр (гурван таталт, гурван `useEffect`, арван `useState`)
 * нь 669 мөрийн дэлгэцийн component дотор JSX-тэй холилдож байв.
 */
export function useClientActivityReport(filters: ReportFilters) {
  const [report, setReport] = useState<ActivityReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [tab, setTab] = useState<ActivityTab>('inactive');
  const [bucket, setBucket] = useState<InactivityBucket>('all');
  const [usageBucket, setUsageBucket] = useState<UsageBucket>('all');
  const [khorooFilter, setKhorooFilter] = useState<number | null>(null);
  const [clients, setClients] = useState<ActivityClient[]>([]);
  const [totalClients, setTotalClients] = useState(0);
  const [page, setPage] = useState(0);
  const [listLoading, setListLoading] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [isBackfilling, setIsBackfilling] = useState(false);

  const isActiveTab = tab === 'active';

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.fetchWithAuth(
        `/api/reports/client-activity?${toQuery(filters)}`
      );
      if (!response.ok) throw new Error('Идэвхийн тайлан татахад алдаа гарлаа');
      setReport(await response.json());
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Тайлан татахад алдаа гарлаа'
      );
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const fetchClients = useCallback(async () => {
    setListLoading(true);
    try {
      const query = toQuery(
        {
          ...filters,
          khoroo: khorooFilter != null ? String(khorooFilter) : filters.khoroo
        },
        {
          // Хугацааны ангилал зөвхөн идэвхгүй жагсаалтад утгатай — идэвхтэй нь
          // ганц нөхцөл: сонгосон хугацаанд уншуулсан эсэх. Харин уншуулалтын
          // тоогоор шүүх нь эсрэгээрээ зөвхөн идэвхтэй жагсаалтад хамаатай.
          bucket: isActiveTab || bucket === 'all' ? undefined : bucket,
          usage:
            !isActiveTab || usageBucket === 'all' ? undefined : usageBucket,
          search: debouncedSearch.trim() || undefined,
          page,
          size: PAGE_SIZE
        }
      );
      const response = await apiClient.fetchWithAuth(
        `/api/reports/client-activity/${isActiveTab ? 'active' : 'inactive'}?${query}`
      );
      if (!response.ok)
        throw new Error(
          `${isActiveTab ? 'Идэвхтэй' : 'Идэвхгүй'} хэрэглэгчийн жагсаалт татахад алдаа гарлаа`
        );
      const data = await response.json();
      setClients(data.content ?? []);
      setTotalClients(data.totalElements ?? 0);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Жагсаалт татахад алдаа гарлаа'
      );
    } finally {
      setListLoading(false);
    }
  }, [
    filters,
    khorooFilter,
    bucket,
    usageBucket,
    debouncedSearch,
    page,
    isActiveTab
  ]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Шүүлтүүр солигдвол эхний хуудас руу буцна.
  useEffect(() => {
    setPage(0);
  }, [tab, bucket, usageBucket, khorooFilter, debouncedSearch, filters]);

  /**
   * Хадгалагдсан `card_used_at` талбарыг bin_usage-аас нөхнө.
   *
   * Ангиллын тоонууд (7/14/30/хэзээ ч) нь тэр талбараар хийгддэг тул зөвхөн
   * харагдах утгыг эх сурвалжаас тооцоолоод хангалтгүй — ангилал зөв болохын
   * тулд талбарыг өөрийг нь нөхөх ёстой.
   */
  const runBackfill = async () => {
    setIsBackfilling(true);
    try {
      const response = await apiClient.fetchWithAuth(
        '/api/users/clients/update-total-access',
        { method: 'POST' }
      );
      if (!response.ok) {
        throw new Error('Дахин тооцоолоход алдаа гарлаа');
      }
      const data = await response.json();
      toast.success(
        `${data.updatedClients ?? 0} хэрэглэгчийн хэрэглээ шинэчлэгдлээ` +
          (data.clientsGainedLastUsed
            ? ` (${data.clientsGainedLastUsed} нь "уншуулаагүй" гэж буруу бүртгэгдсэн байсан)`
            : '')
      );
      fetchReport();
      fetchClients();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Дахин тооцоолоход алдаа гарлаа'
      );
    } finally {
      setIsBackfilling(false);
    }
  };

  return {
    report,
    isLoading,
    tab,
    setTab,
    bucket,
    setBucket,
    usageBucket,
    setUsageBucket,
    khorooFilter,
    setKhorooFilter,
    clients,
    totalClients,
    page,
    setPage,
    listLoading,
    search,
    setSearch,
    isActiveTab,
    isBackfilling,
    runBackfill
  };
}
