'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { apiClient } from '@/lib/api-client';
import {
  groupByBin,
  groupReads,
  type BatteryChange,
  type BinRef,
  type IotRow
} from '../iot-grouping';
import {
  AUTO_REFRESH_MS,
  MAX_READS_PER_BIN,
  PER_BIN_ROWS,
  TAIL_ROWS,
  mergeRows
} from './iot-format';

export type Status = 'idle' | 'loading' | 'success' | 'error';

/**
 * IoT логийн бүх таталт, нэгтгэл, auto-refresh-ийг нэг газар.
 *
 * Өмнө нь энэ 160 мөр (дөрвөн `useCallback` таталт, хоёр `useEffect`, зургаан
 * `useState`) нь 366 мөрийн дэлгэцийн component дотор JSX-тэй холилдож байв.
 */
export function useIotSnapshot() {
  const [rows, setRows] = useState<IotRow[] | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);
  // binId → бүртгэлийн мэдээлэл. IoT лог дотор зөвхөн binId ирдэг тул савны
  // нэр/идэвхтэй эсэхийг bin хүснэгтээс тусад нь татаж авна.
  const [bins, setBins] = useState<Map<string, BinRef>>(new Map());
  // binId → сүүлийн баттерей солилт. Backend нь бүх түүхээр хайдаг тул энд
  // татсан цонхноос эрт болсон солилтыг ч олдог.
  const [batteryChanges, setBatteryChanges] = useState<
    Map<string, BatteryChange>
  >(new Map());
  // by-bin snapshot-ийн мета (хэдэн мөр уншсан, гүйцэд хамарсан эсэх)
  const [meta, setMeta] = useState<{
    scanned: number;
    exhausted: boolean;
    perBin: number;
  } | null>(null);

  /**
   * Бүрэн snapshot — сав тус бүрээр цонхолсон (by-bin) таталт.
   * Энгийн "сүүлийн 5000 мөр" таталтад идэвхтэй савууд бүх мөрийг эзэлдэг тул
   * чимээгүй болсон/идэвхгүй савууд цонхноос гарч, хүснэгтээс алга болдог.
   * by-bin нь сав бүрд өөрийн хэсгийг баталгаажуулна.
   */
  const fetchSnapshot = useCallback(async (silent = false) => {
    if (!silent) setStatus('loading');
    try {
      const res = await apiClient.fetchWithAuth(
        `/api/raw-data/iot-request-log/by-bin?perBin=${PER_BIN_ROWS}`
      );
      if (res.ok) {
        const json = (await res.json()) as
          | IotRow[]
          | { rows: IotRow[]; scanned: number; exhausted: boolean; perBin: number };
        if (Array.isArray(json)) {
          setRows(json);
          setMeta(null);
        } else {
          setRows(json.rows ?? []);
          setMeta({
            scanned: json.scanned ?? 0,
            exhausted: json.exhausted ?? false,
            perBin: json.perBin ?? PER_BIN_ROWS
          });
        }
        setStatus('success');
        setLastFetchedAt(Date.now());
        return;
      }
      // by-bin-гүй хуучин backend дээр ажиллаж байвал хуучин байдлаар татна.
      const legacy = await apiClient.fetchWithAuth(
        '/api/raw-data/iot-request-log?limit=5000'
      );
      if (legacy.ok) {
        setRows((await legacy.json()) as IotRow[]);
        setMeta(null);
        setStatus('success');
        setLastFetchedAt(Date.now());
      } else if (!silent) {
        setStatus('error');
      }
    } catch {
      if (!silent) setStatus('error');
    }
  }, []);

  /**
   * Real-time шинэчлэлт — зөвхөн хамгийн сүүлийн мөрүүдийг татаад snapshot
   * дээр нэмнэ. Ингэснээр 10 сек тутамд бүх түүхийг дахин татахгүй.
   */
  const fetchTail = useCallback(async () => {
    try {
      const res = await apiClient.fetchWithAuth(
        `/api/raw-data/iot-request-log?limit=${TAIL_ROWS}`
      );
      if (!res.ok) return;
      const tail = (await res.json()) as IotRow[];
      setRows((prev) => mergeRows(prev, tail));
      setLastFetchedAt(Date.now());
    } catch {
      /* чимээгүй шинэчлэлт унавал өмнөх өгөгдөл хэвээр үлдэнэ */
    }
  }, []);

  // Савны бүртгэлийг ганц удаа татна — bin бүртгэл 10 сек тутам өөрчлөгддөггүй
  // тул auto-refresh-д оруулах шаардлагагүй. Амжилтгүй болбол хүснэгт зөвхөн
  // логт таарсан савуудаар binId-гаараа хэвийн ажиллана.
  const fetchBins = useCallback(async () => {
    try {
      const res = await apiClient.fetchWithAuth('/api/raw-data/bin?limit=1000');
      if (!res.ok) return;
      const list = (await res.json()) as Record<string, unknown>[];
      const map = new Map<string, BinRef>();
      for (const b of list) {
        const id = b.bin_id;
        if (id == null || !String(id).trim()) continue;
        const name = b.bin_name;
        const active = b.is_active ?? b.isActive ?? b.active;
        map.set(String(id).trim().toUpperCase(), {
          binId: String(id).trim().toUpperCase(),
          binName: name != null && String(name).trim() ? String(name).trim() : null,
          isActive: active == null ? null : active === true || active === 1
        });
      }
      setBins(map);
    } catch {
      /* бүртгэл татагдаагүй нь хүснэгтийг блоклохгүй */
    }
  }, []);

  /**
   * Баттерей солилтыг backend-ээс татна — тэнд бүх түүхээр хайдаг тул
   * дэлгэцэнд татсан {MAX_READS_PER_BIN} уншуулалтаас эрт солигдсон савууд ч
   * олдоно. Backend дээр 5 минут cache-тэй, солилт ховор тул нэг л удаа татна.
   * Амжилтгүй болбол хүснэгт client-side илрүүлэлтээрээ хэвийн ажиллана.
   */
  const fetchBatteryChanges = useCallback(async () => {
    try {
      const res = await apiClient.fetchWithAuth('/api/raw-data/battery-changes');
      if (!res.ok) return;
      const json = (await res.json()) as {
        changes?: Record<string, { at: string; fromV: number; toV: number }>;
      };
      const map = new Map<string, BatteryChange>();
      for (const [binId, c] of Object.entries(json.changes ?? {})) {
        if (!c?.at || c.fromV == null || c.toV == null) continue;
        map.set(binId.trim().toUpperCase(), {
          at: c.at,
          fromV: Number(c.fromV),
          toV: Number(c.toV)
        });
      }
      setBatteryChanges(map);
    } catch {
      /* client-side илрүүлэлт fallback болно */
    }
  }, []);

  useEffect(() => {
    fetchSnapshot();
    fetchBins();
    fetchBatteryChanges();
  }, [fetchSnapshot, fetchBins, fetchBatteryChanges]);

  // Real-time auto-refresh — идэвхтэй tab дээр л ажиллана, сая уншуулсан сав
  // groupByBin-ийн шинэ эрэмбээр (хамгийн сүүлийн нь эхэнд) автоматаар дээшээ гарна.
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        fetchTail();
      }
    }, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [autoRefresh, fetchTail]);

  const { reads, stats } = useMemo(() => groupReads(rows ?? []), [rows]);
  const binGroups = useMemo(
    () => groupByBin(reads, rows ?? [], bins, MAX_READS_PER_BIN, batteryChanges),
    [reads, rows, bins, batteryChanges]
  );

  return {
    status,
    stats,
    binGroups,
    meta,
    lastFetchedAt,
    autoRefresh,
    setAutoRefresh,
    refetch: fetchSnapshot
  };
}
