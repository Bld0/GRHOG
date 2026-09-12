import type { IotRow, Read } from '../iot-grouping';

export const PAGE_SIZE = 20;
/** Real-time: энэ интервалаар автоматаар дахин татна (IngestionTable-тэй адил). */
export const AUTO_REFRESH_MS = 10 * 1000;
/** Нэг савд харуулах уншуулалтын дээд хязгаар (дэлгэрэнгүй цонх). */
export const MAX_READS_PER_BIN = 100;
/**
 * Backend-ээс сав тус бүрд татах түүхий мөрийн хязгаар. Нэг уншуулалт = 3
 * хүсэлт (battery + storage + card) тул 100 уншуулалтад ~300 мөр хэрэгтэй.
 */
export const PER_BIN_ROWS = MAX_READS_PER_BIN * 3;
/** Auto-refresh дээр зөвхөн сүүлийн мөрүүдийг татаж, snapshot дээр нэмнэ. */
export const TAIL_ROWS = 500;

// "Battery" ба "Battery сольсон огноо" нь нэг сэдвийн хос багана: вольт ба
// тэр вольт хамгийн сүүлд үсэрсэн үе. Дотор талаараа наалдаж, гадна талдаа
// өргөн зай + босоо зураас авснаар бусад баганаас тусдаа бүлэг мэт уншигдана.
// Толгой болон мөрийн нүд ижил утга авч байж зураас нь босоогоороо эгнэнэ.
export const BATTERY_GROUP_LEFT = 'border-l pr-1 pl-5';
export const BATTERY_GROUP_RIGHT = 'border-r pr-5 pl-1';

export function fmtTime(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
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

export const pct = (n: number, total: number) =>
  total ? `${Math.round((n / total) * 100)}%` : '0%';

/** Шинэ мөрүүдийг хуучин дээр нэмж нэгтгэнэ (id-гаар давхардлыг арилгана). */
export function mergeRows(prev: IotRow[] | null, incoming: IotRow[]): IotRow[] {
  const byId = new Map<number, IotRow>();
  for (const r of prev ?? []) byId.set(r.id, r);
  for (const r of incoming) byId.set(r.id, r);
  return Array.from(byId.values()).sort((a, b) => b.id - a.id);
}

/** Мөрийн өнгө — дутуу ирсэн уншуулалтыг ялгаж харуулна. */
export function rowTone(r: Read): string {
  if (r.complete) return '';
  if (!r.card.received) return 'bg-red-500/5';
  return 'bg-amber-500/5';
}
