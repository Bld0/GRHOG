import { extractJson, parseTime, type IotRow } from '../iot-grouping';

export type Status = 'idle' | 'loading' | 'success' | 'error';

export const PAGE_SIZE = 25;
// PENDING мөр энэ хугацаанаас удаан хүлээвэл queue worker гацсан гэж үзнэ
export const STUCK_PENDING_MS = 2 * 60 * 1000;
// Real-time: энэ интервалаар автоматаар дахин татна
export const AUTO_REFRESH_MS = 10 * 1000;

export type StatusFilter = 'ALL' | 'DONE' | 'PENDING' | 'FAILED' | 'STUCK';
export type EndpointFilter = 'ALL' | '/on-read-card' | '/battery-level' | '/storage';

export const ENDPOINT_LABEL: Record<string, string> = {
  '/on-read-card': 'Карт',
  '/battery-level': 'Battery',
  '/storage': 'Storage'
};

export const ENDPOINT_BADGE_CLASS: Record<string, string> = {
  '/on-read-card': 'bg-blue-500/15 text-blue-600 hover:bg-blue-500/15',
  '/battery-level': 'bg-violet-500/15 text-violet-600 hover:bg-violet-500/15',
  '/storage': 'bg-teal-500/15 text-teal-600 hover:bg-teal-500/15'
};

export function fmtTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('mn-MN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

export function isStuckPending(row: IotRow, nowMs: number): boolean {
  if (row.status !== 'PENDING') return false;
  const t = parseTime(row.received_at);
  return !Number.isNaN(t) && nowMs - t > STUCK_PENDING_MS;
}

/** received_at → processed_at хоцролт, хүн уншихаар. */
export function fmtLatency(row: IotRow): string {
  if (!row.processed_at) return '—';
  const a = parseTime(row.received_at);
  const b = parseTime(row.processed_at);
  if (Number.isNaN(a) || Number.isNaN(b)) return '—';
  const sec = (b - a) / 1000;
  if (sec < 60) return `${sec.toFixed(1)}s`;
  return `${Math.floor(sec / 60)}m ${Math.round(sec % 60)}s`;
}

/** Мөрийн гол утга — endpoint-оос нь хамаарч cardId / battery / storage. */
export function rowValue(row: IotRow): { binId: string; value: string } {
  const obj = extractJson(row);
  const binRaw = (obj?.binId ?? obj?.binID ?? null) as string | null;
  const binId = binRaw ? String(binRaw).trim().toUpperCase() : '—';
  let value = '—';
  if (row.endpoint === '/battery-level') {
    value = obj?.battery_Level != null ? String(obj.battery_Level) : '—';
  } else if (row.endpoint === '/storage') {
    value = obj?.storageLevel != null ? String(obj.storageLevel) : '—';
  } else if (row.endpoint === '/on-read-card') {
    value = obj?.cardId != null ? String(obj.cardId) : '—';
  }
  return { binId, value };
}
