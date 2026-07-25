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
// Per-bin grouping — returns each bin's latest read + all reads for that bin
// ---------------------------------------------------------------------------

export interface BinGroup {
  binId: string;
  /** Most recent read for this bin (by `at` timestamp). */
  latest: Read;
  /** All reads for this bin, sorted newest-first. */
  reads: Read[];
  /** Stats computed only over this bin's reads. */
  stats: GroupStats;
}

/**
 * Takes the already-grouped read list and organises it by binId.
 * Returns an array of BinGroup sorted newest-first by each bin's latest
 * read time, so a bin that was just scanned jumps to the top of the table.
 */
export function groupByBin(
  reads: Read[],
  allRows: IotRow[]
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

  const groups: BinGroup[] = [];
  for (const [binId, binReads] of Array.from(buckets.entries())) {
    // Already sorted newest-first by groupReads()
    const latest = binReads[0];
    const binRows = rowsByBin.get(binId) ?? [];
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
    groups.push({ binId, latest, reads: binReads, stats });
  }

  // Хамгийн сүүлд уншуулсан сав хамгийн дээр (real-time харагдах зорилготой)
  groups.sort((a, b) => parseTime(b.latest.at) - parseTime(a.latest.at));
  return groups;
}
