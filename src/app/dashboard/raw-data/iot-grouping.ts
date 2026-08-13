/**
 * Бүлэглэх логик: нэг карт уншуулах = battery → storage → on-read-card гэсэн
 * 3 IoT хүсэлт (firmware-ийн тогтмол дараалал). Серверт correlation id байхгүй
 * тул (binId + цаг хугацааны цонх + дараалал)-аар card-ийг анкер болгож сэргээнэ.
 *
 * Зорилго: developer/tech team-д "3 хүсэлт тус бүрээр, дутуу бол ялгацтай"
 * харуулах + алдагдлын хувийг (нотолгоо) тооцох.
 *
 * ⚠️ Энэ нь heuristic — нэг савыг богино хугацаанд олон удаа уншуулахад
 * attribution бүрхэг. Нийт алдагдлын хувийг үнэлэхэд хангалттай.
 */

export interface IotRow {
  id: number;
  endpoint: string;
  raw_body: string | null;
  received_at: string;
  parsed: boolean | number | null;
  parsed_data: string | null;
  // Durable-queue fields (null on rows that were never queued)
  status: 'PENDING' | 'DONE' | 'FAILED' | null;
  attempts: number | null;
  last_error: string | null;
  processed_at: string | null;
}

export type Slot =
  | {
      received: true;
      value: string;
      id: number;
      at: string;
      parsed: boolean;
      status?: IotRow['status'];
    }
  | { received: false };

export interface Read {
  binId: string;
  at: string; // төлөөлөх цаг (хамгийн эртний ирсэн хүсэлт)
  cardAt: string | null;
  battery: Slot;
  storage: Slot;
  card: (Slot & { cardId?: string });
  duplicates: number; // нэг болгож хураасан card retry-ийн тоо
  retries: { id: number; at: string; value: string }[]; // хураагдсан retry-үүд өөрсдөө
  presentCount: number; // 0..3
  missing: string[]; // ['battery'|'storage'|'card']-ийн дэд олонлог
  complete: boolean;
}

export interface GroupStats {
  totalReads: number;
  complete: number;
  missingBattery: number;
  missingStorage: number;
  missingCard: number; // orphan telemetry (card ирээгүй)
  duplicateCards: number;
  parseFailures: number;
  corrupted: number;
  totalRows: number;
}

const ENDPOINT_KIND: Record<string, 'battery' | 'storage' | 'card'> = {
  '/battery-level': 'battery',
  '/storage': 'storage',
  '/on-read-card': 'card'
};

export function parseTime(s: string): number {
  if (!s) return NaN;
  const t = s.includes('T') ? s : s.replace(' ', 'T');
  return Date.parse(t);
}

/**
 * Гажуудсан raw_body доторх жинхэнэ JSON-ий байрлал. Модемын шуугиан урд нь
 * `{` тэмдэгт агуулж болдог тул эхлэлийг `{"`-ээр хайна (олдохгүй бол `{`).
 */
export function jsonBounds(
  raw: string | null
): { start: number; end: number } | null {
  if (!raw) return null;
  const q = raw.indexOf('{"');
  const start = q >= 0 ? q : raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  return { start, end: end + 1 };
}

export function tryParseJson(
  str: string | null
): Record<string, unknown> | null {
  if (!str) return null;
  try {
    const o = JSON.parse(str);
    return o && typeof o === 'object' ? (o as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function extractJson(row: IotRow): Record<string, unknown> | null {
  const fromParsed = tryParseJson(row.parsed_data);
  if (fromParsed) return fromParsed;
  // fallback: гажуудсан raw_body дотроос {...}-г сугалах
  const raw = row.raw_body ?? '';
  const b = jsonBounds(raw);
  if (b) return tryParseJson(raw.slice(b.start, b.end));
  return null;
}

interface Ev {
  id: number;
  kind: 'battery' | 'storage' | 'card';
  binId: string;
  at: string;
  atMs: number;
  parsed: boolean;
  value: string;
  cardId?: string;
  status: IotRow['status'];
}

function toEv(row: IotRow): Ev | null {
  const kind = ENDPOINT_KIND[(row.endpoint ?? '').trim()];
  if (!kind) return null;
  const obj = extractJson(row);
  const binRaw = (obj?.binId ?? obj?.binID ?? null) as string | null;
  const binId = binRaw ? String(binRaw).trim().toUpperCase() : 'UNKNOWN';
  const atMs = parseTime(row.received_at);
  let value = '';
  let cardId: string | undefined;
  if (kind === 'battery') value = obj?.battery_Level != null ? String(obj.battery_Level) : '';
  else if (kind === 'storage') value = obj?.storageLevel != null ? String(obj.storageLevel) : '';
  else {
    cardId = obj?.cardId != null ? String(obj.cardId) : undefined;
    value = cardId ?? '';
  }
  return {
    id: row.id,
    kind,
    binId,
    at: row.received_at,
    atMs,
    parsed: row.parsed === true || row.parsed === 1,
    value,
    cardId,
    status: row.status ?? null
  };
}

function slot(e: Ev): Slot {
  return {
    received: true,
    value: e.value,
    id: e.id,
    at: e.at,
    parsed: e.parsed,
    status: e.status
  };
}

function finalize(r: Read): void {
  const missing: string[] = [];
  if (!r.battery.received) missing.push('battery');
  if (!r.storage.received) missing.push('storage');
  if (!r.card.received) missing.push('card');
  r.missing = missing;
  r.presentCount = 3 - missing.length;
  r.complete = missing.length === 0;
}

function makeOrphan(bin: string, b?: Ev, s?: Ev): Read {
  const times = [b?.atMs, s?.atMs].filter((x): x is number => x != null);
  const minMs = times.length ? Math.min(...times) : NaN;
  return {
    binId: bin,
    at: Number.isNaN(minMs) ? '' : new Date(minMs).toISOString(),
    cardAt: null,
    battery: b ? slot(b) : { received: false },
    storage: s ? slot(s) : { received: false },
    card: { received: false },
    duplicates: 0,
    retries: [],
    presentCount: 0,
    missing: [],
    complete: false
  };
}

/**
 * IoT log мөрүүдийг уншуулалт болгон бүлэглэнэ.
 * @param corrSec battery/storage-ийг card-тай холбох цонх (сек)
 * @param retrySec card retry-г нэг болгох цонх (сек)
 */
export function groupReads(
  rows: IotRow[],
  corrSec = 120,
  retrySec = 90
): { reads: Read[]; stats: GroupStats } {
  const evs = rows
    .map(toEv)
    .filter((e): e is Ev => !!e && !Number.isNaN(e.atMs))
    .sort((a, b) => a.atMs - b.atMs || a.id - b.id);

  const pendingBat: Record<string, Ev> = {};
  const pendingSto: Record<string, Ev> = {};
  const current: Record<string, { read: Read; cardMs: number }> = {};
  const reads: Read[] = [];

  for (const ev of evs) {
    const bin = ev.binId;
    if (ev.kind === 'battery') {
      pendingBat[bin] = ev;
      continue;
    }
    if (ev.kind === 'storage') {
      pendingSto[bin] = ev;
      continue;
    }
    // card
    const cur = current[bin];
    if (cur && (ev.atMs - cur.cardMs) / 1000 <= retrySec) {
      cur.read.duplicates += 1;
      cur.read.retries.push({ id: ev.id, at: ev.at, value: ev.value });
      cur.cardMs = ev.atMs;
      continue;
    }
    const read: Read = {
      binId: bin,
      at: ev.at,
      cardAt: ev.at,
      battery: { received: false },
      storage: { received: false },
      card: { received: true, value: ev.value, id: ev.id, at: ev.at, parsed: ev.parsed, cardId: ev.cardId, status: ev.status },
      duplicates: 0,
      retries: [],
      presentCount: 0,
      missing: [],
      complete: false
    };
    const b = pendingBat[bin];
    if (b && b.atMs <= ev.atMs && (ev.atMs - b.atMs) / 1000 <= corrSec) {
      read.battery = slot(b);
      delete pendingBat[bin];
    }
    const s = pendingSto[bin];
    if (s && s.atMs <= ev.atMs && (ev.atMs - s.atMs) / 1000 <= corrSec) {
      read.storage = slot(s);
      delete pendingSto[bin];
    }
    const times = [
      read.battery.received ? (b as Ev).atMs : null,
      read.storage.received ? (s as Ev).atMs : null,
      ev.atMs
    ].filter((x): x is number => x != null);
    read.at = new Date(Math.min(...times)).toISOString();
    reads.push(read);
    current[bin] = { read, cardMs: ev.atMs };
  }

  // orphan telemetry (card ирээгүй) — алдагдсан card эсвэл цонхны хязгаар
  const orphanBins: Record<string, true> = {};
  Object.keys(pendingBat).forEach((b) => (orphanBins[b] = true));
  Object.keys(pendingSto).forEach((b) => (orphanBins[b] = true));
  Object.keys(orphanBins).forEach((bin) => {
    const b = pendingBat[bin];
    const s = pendingSto[bin];
    if (b && s && Math.abs(b.atMs - s.atMs) / 1000 <= corrSec) {
      reads.push(makeOrphan(bin, b, s));
    } else {
      if (b) reads.push(makeOrphan(bin, b, undefined));
      if (s) reads.push(makeOrphan(bin, undefined, s));
    }
  });

  for (const r of reads) finalize(r);
  reads.sort((a, b) => parseTime(b.at) - parseTime(a.at));

  const truthyParsed = (r: IotRow) => r.parsed === true || r.parsed === 1;
  const stats: GroupStats = {
    totalReads: reads.length,
    complete: reads.filter((r) => r.complete).length,
    missingBattery: reads.filter((r) => r.card.received && !r.battery.received).length,
    missingStorage: reads.filter((r) => r.card.received && !r.storage.received).length,
    missingCard: reads.filter((r) => !r.card.received).length,
    duplicateCards: reads.reduce((n, r) => n + r.duplicates, 0),
    parseFailures: rows.filter((r) => !truthyParsed(r)).length,
    corrupted: rows.filter((r) => ((r.raw_body ?? '').trim()[0] ?? '') !== '{').length,
    totalRows: rows.length
  };

  return { reads, stats };
}

// ---------------------------------------------------------------------------
// Battery солилт — вольтын огцом өсөлтөөр илрүүлнэ
// ---------------------------------------------------------------------------

/**
 * Battery солигдсон гэж үзэх хамгийн бага үсрэлт (вольт).
 * Уншуулалт бүрт вольт аажим буурч ирдэг; огцом өсөх нь зөвхөн цэнэгтэй
 * баттерей тавьсны шинж. Хэмжилтийн шуугиан/сэргэлт ихдээ ~0.5V тул 1.0V.
 */
export const BATTERY_JUMP_V = 1.0;

export interface BatteryChange {
  /** Үсрэлт гарсан (шинэ баттерейгаар ирсэн эхний) уншуулалтын цаг. */
  at: string;
  /** Түүний өмнөх уншуулалтын вольт. */
  fromV: number;
  /** Үсрэлт гарсан уншуулалтын вольт. */
  toV: number;
}

/** Уншуулалтын battery вольт — мэдрэгчийн алдаатай утгыг хаяна. */
function batteryVolts(read: Read): number | null {
  if (!read.battery.received) return null;
  const v = Number(read.battery.value);
  // 0 / сөрөг / утгагүй өндөр = мэдрэгч уншаагүй, тооцоонд оруулахгүй.
  if (!Number.isFinite(v) || v <= 1 || v > 30) return null;
  return v;
}

/**
 * Хамгийн сүүлийн баттерей солилтыг олно.
 *
 * @param reads   нэг савны уншуулалтууд, ШИНЭ нь эхэндээ (groupByBin-ийн эрэмбэ)
 * @param minJumpV солилт гэж үзэх хамгийн бага өсөлт
 */
export function detectBatteryChange(
  reads: Read[],
  minJumpV = BATTERY_JUMP_V
): BatteryChange | null {
  // Хугацааны дарааллаар (хуучин → шинэ) вольтын цуваа болгоно.
  const series: { at: string; v: number }[] = [];
  for (let i = reads.length - 1; i >= 0; i--) {
    const v = batteryVolts(reads[i]);
    if (v != null) series.push({ at: reads[i].at, v });
  }

  // Сүүлийн үсрэлтийг хайх тул хойноос нь урагшаа шалгана.
  for (let i = series.length - 1; i >= 1; i--) {
    const prev = series[i - 1];
    const cur = series[i];
    if (cur.v - prev.v < minJumpV) continue;
    // Ганц удаагийн мэдрэгчийн үсрэлтийг хасна: дараагийн уншуулалт бас
    // өндөр хэвээр байж байж л баттерей үнэхээр солигдсон гэж үзнэ.
    const next = series[i + 1];
    if (next && next.v < prev.v + minJumpV / 2) continue;
    return { at: cur.at, fromV: prev.v, toV: cur.v };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Per-bin grouping — returns each bin's latest read + all reads for that bin
// ---------------------------------------------------------------------------

export interface BinGroup {
  binId: string;
  /**
   * Савны хүний уншиж ойлгох нэр (bin.bin_name), binId-аар хайж олсон.
   * bin хүснэгтэд бүртгэлгүй төхөөрөмжөөс өгөгдөл ирвэл null.
   */
  binName: string | null;
  /** bin.is_active — бүртгэлгүй (лог дотор л байгаа) сав дээр null. */
  isActive: boolean | null;
  /** bin хүснэгтэд бүртгэлтэй эсэх. */
  registered: boolean;
  /** Most recent read for this bin, or null when the bin has no reads at all. */
  latest: Read | null;
  /**
   * Хамгийн сүүлд баттерей солигдсон гэж таамаглаж буй үе (вольт огцом өссөн).
   * Хамрагдсан уншуулалтуудад ийм үсрэлт байхгүй бол null.
   */
  batteryChange: BatteryChange | null;
  /** This bin's reads, newest-first, capped at `maxReads`. */
  reads: Read[];
  /** Уншуулалтын бодит нийт тоо (таслахаас өмнөх). */
  totalReadCount: number;
  /** `reads` нь maxReads-ээр таслагдсан эсэх. */
  truncated: boolean;
  /** Stats computed only over this bin's (capped) reads. */
  stats: GroupStats;
}

/** bin хүснэгтээс ирсэн бүртгэлтэй савны мэдээлэл. */
export interface BinRef {
  binId: string;
  binName: string | null;
  isActive: boolean | null;
}

/**
 * Takes the already-grouped read list and organises it by binId.
 *
 * Бүртгэлтэй БҮХ сав (`bins`) мөр болж гарна — идэвхгүй болсон, эсвэл сүүлийн
 * лог цонхонд огт өгөгдөлгүй сав ч "өгөгдөл алга" төлөвтэйгөөр харагдана.
 * Ингэснээр идэвхтэй савууд идэвхгүйг нь дарж нуухгүй.
 *
 * Эрэмбэ: өгөгдөлтэй савууд сүүлийн уншуулалтаараа (шинэ нь дээр), дараа нь
 * огт өгөгдөлгүй савууд binId-гаараа.
 *
 * @param bins     bin хүснэгтийн бүртгэл (binId ИХ үсгээр). Дамжуулаагүй бол
 *                 зөвхөн лог дотор өгөгдөлтэй савууд гарна.
 * @param maxReads нэг савын `reads`-ийн дээд хязгаар (дэлгэрэнгүйд харуулах
 *                 хамгийн сүүлийн N уншуулалт).
 */
export function groupByBin(
  reads: Read[],
  allRows: IotRow[],
  bins?: Map<string, BinRef>,
  maxReads = 100
): BinGroup[] {
  // Bucket reads by binId
  const buckets = new Map<string, Read[]>();
  for (const r of reads) {
    if (!buckets.has(r.binId)) buckets.set(r.binId, []);
    buckets.get(r.binId)!.push(r);
  }

  // For per-bin parse-failure / corrupted counts we need the matching raw rows
  const rowsByBin = new Map<string, IotRow[]>();
  for (const row of allRows) {
    // We don't re-parse here; attribute each raw row to a bin via its
    // parsed_data / raw_body JSON binId field — same logic as toEv().
    const tryGet = (s: string | null): string | null => {
      if (!s) return null;
      try {
        const o = JSON.parse(s);
        if (o && typeof o === 'object') {
          const v = o.binId ?? o.binID;
          return v != null ? String(v).trim().toUpperCase() : null;
        }
      } catch { /* ignore */ }
      return null;
    };
    const raw = row.raw_body ?? '';
    const b = jsonBounds(raw);
    const fromRaw = b ? tryGet(raw.slice(b.start, b.end)) : null;
    const binId = tryGet(row.parsed_data) ?? fromRaw ?? 'UNKNOWN';
    if (!rowsByBin.has(binId)) rowsByBin.set(binId, []);
    rowsByBin.get(binId)!.push(row);
  }

  const truthyParsed = (r: IotRow) => r.parsed === true || r.parsed === 1;

  // Бүртгэлтэй бүх сав + логт таарсан бүртгэлгүй binId-ууд
  const allBinIds = new Set<string>([
    ...Array.from(bins?.keys() ?? []),
    ...Array.from(buckets.keys())
  ]);

  const groups: BinGroup[] = [];
  for (const binId of Array.from(allBinIds)) {
    const allReads = buckets.get(binId) ?? [];
    // Already sorted newest-first by groupReads()
    const binReads = allReads.slice(0, Math.max(1, maxReads));
    const binRows = rowsByBin.get(binId) ?? [];
    const ref = bins?.get(binId);
    const stats: GroupStats = {
      totalReads: binReads.length,
      complete: binReads.filter((r) => r.complete).length,
      missingBattery: binReads.filter((r) => r.card.received && !r.battery.received).length,
      missingStorage: binReads.filter((r) => r.card.received && !r.storage.received).length,
      missingCard: binReads.filter((r) => !r.card.received).length,
      duplicateCards: binReads.reduce((n, r) => n + r.duplicates, 0),
      parseFailures: binRows.filter((r) => !truthyParsed(r)).length,
      corrupted: binRows.filter((r) => ((r.raw_body ?? '').trim()[0] ?? '') !== '{').length,
      totalRows: binRows.length
    };
    groups.push({
      binId,
      binName: ref?.binName ?? null,
      isActive: ref?.isActive ?? null,
      registered: !!ref,
      latest: binReads[0] ?? null,
      batteryChange: detectBatteryChange(binReads),
      reads: binReads,
      totalReadCount: allReads.length,
      truncated: allReads.length > binReads.length,
      stats
    });
  }

  // Хамгийн сүүлд уншуулсан сав хамгийн дээр (real-time харагдах зорилготой),
  // огт өгөгдөлгүй савууд хамгийн доор binId-гаараа эрэмбэлэгдэнэ.
  groups.sort((a, b) => {
    if (!a.latest && !b.latest) return a.binId.localeCompare(b.binId);
    if (!a.latest) return 1;
    if (!b.latest) return -1;
    return parseTime(b.latest.at) - parseTime(a.latest.at);
  });
  return groups;
}
