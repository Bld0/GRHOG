// Тайлангийн модулийн төрлүүд. Backend: ReportController (/reports/*).

export interface ReportFilters {
  startDate: string;
  endDate: string;
  district: string;
  khoroo: string;
}

/** Тайлангийн шүүлтүүрийг query string болгоно (хоосон утгыг алгасна). */
export function toQuery(
  filters: ReportFilters,
  extra: Record<string, string | number | undefined> = {}
): string {
  const params = new URLSearchParams();
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  if (filters.district) params.set('district', filters.district);
  if (filters.khoroo) params.set('khoroo', filters.khoroo);
  Object.entries(extra).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  return params.toString();
}

// ---------------- Хэрэглэгчийн идэвх ----------------

export interface KhorooActivityRow {
  district: string | null;
  khoroo: number | null;
  total: number;
  active: number;
  inactive: number;
  activePercent: number;
  inactivePercent: number;
}

export interface ClientActivityReport {
  startDate: string;
  endDate: string;
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  activePercent: number;
  inactivePercent: number;
  byKhoroo: KhorooActivityRow[];
  buckets: {
    days7: number;
    days14: number;
    days30: number;
    never: number;
  };
}

export interface InactiveClient {
  id: number;
  name: string | null;
  phone: string | null;
  address: string | null;
  district: string | null;
  khoroo: number | null;
  streetBuilding: string | null;
  apartmentNumber: string | null;
  type: string | null;
  cardId: string | null;
  lastUsedAt: string | null;
  totalAccess: number;
  createdAt: string | null;
  /** Сүүлд уншуулснаас хойшхи хоног. Хэзээ ч уншуулаагүй бол null. */
  daysInactive: number | null;
  /** Бүртгүүлснээс хойшхи хоног — уншуулаагүй хэрэглэгчийг хэмжих цорын ганц хэмжүүр. */
  daysSinceRegistered: number | null;
  neverUsed: boolean;
  /**
   * Тайлан bin_usage-аас олсон хэрэглээ нь `client` хүснэгтэд хадгалагдсанаас
   * зөрж байна. Ангилал (7/14/30/хэзээ ч) нь хадгалагдсан утгаар хийгддэг тул
   * ийм мөр буруу ангилалд орсон байх магадлалтай — нөхөх ажиллагаа хэрэгтэй.
   */
  usageOutOfSync: boolean;
}

/** Идэвхгүй байдлын ангилал — backend-ийн `bucket` параметртэй тохирно. */
export type InactivityBucket = '7' | '14' | '30' | 'never' | 'all';

export const BUCKET_LABEL: Record<InactivityBucket, string> = {
  '7': '7–13 хоног',
  '14': '14–29 хоног',
  '30': '30+ хоног',
  never: 'Хэзээ ч ашиглаагүй',
  all: 'Бүх идэвхгүй'
};

// ---------------- Хоослолт ----------------

export interface ClearingBinRow {
  id: number;
  binId: string;
  binName: string | null;
  location: string | null;
  district: string | null;
  khoroo: number | null;
  count: number;
  averageFillBeforeClear: number | null;
  lastClearedAt: string | null;
}

export interface ClearingKhorooRow {
  district: string | null;
  khoroo: number | null;
  count: number;
  averageFillBeforeClear: number | null;
}

export interface ClearingCollectorRow {
  cardId: string;
  name: string | null;
  count: number;
  confirmedCount: number;
  confirmedPercent: number;
}

export interface ClearingReport {
  startDate: string;
  endDate: string;
  totalClearings: number;
  averageFillBeforeClear: number | null;
  binCount: number;
  bySource: { CARD: number; SENSOR: number };
  cardReportedPercent: number;
  byStatus: Record<string, number>;
  byKhoroo: ClearingKhorooRow[];
  byBin: ClearingBinRow[];
  byCollector: ClearingCollectorRow[];
}

export const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: 'Баталгаажсан',
  PENDING: 'Шалгаж байна',
  NOT_CONFIRMED: 'Зөрүүтэй',
  ALREADY_EMPTY: 'Хоосон сав байсан',
  NO_TELEMETRY: 'Мэдээлэлгүй'
};

export const STATUS_STYLE: Record<string, string> = {
  CONFIRMED:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  PENDING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  NOT_CONFIRMED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  ALREADY_EMPTY:
    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  NO_TELEMETRY: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
};

// ---------------- Батерей ----------------

export interface BatteryBinRow {
  id: number;
  binId: string;
  binName: string | null;
  location: string | null;
  district: string | null;
  khoroo: number | null;
  batteryLevel: string | null;
  currentPercent: number;
  averagePercent: number;
  minPercent: number;
  maxPercent: number;
  /** Хоногт хэдэн хувиар зарцуулж байна */
  drainPerDay: number;
  /** Цэнэглэлт хооронд хэдэн хоног барьсан */
  holdDays: number;
  /** Бүтэн мөчлөг ажиглагдсан эсэх — үгүй бол holdDays нь доод хязгаар */
  completeCycle: boolean;
  rechargeCount: number;
  dayCount: number;
}

export interface BatteryReport {
  startDate: string;
  endDate: string;
  binCount: number;
  averagePercent: number | null;
  lowPercentThreshold: number;
  lowBatteryCount: number;
  longestHolding: BatteryBinRow | null;
  fastestDrain: BatteryBinRow | null;
  lowBatteryBins: BatteryBinRow[];
}

export interface BatteryCoverage {
  totalReadings: number;
  earliestReading: string | null;
  retentionMonths: number;
}

// ---------------- Засвар үйлчилгээ ----------------

export type MaintenanceCategory =
  | 'BATTERY'
  | 'SENSOR'
  | 'DOOR_LOCK'
  | 'MODEM'
  | 'CARD_READER'
  | 'BODY'
  | 'OTHER';

export const CATEGORY_LABEL: Record<string, string> = {
  BATTERY: 'Батерей',
  SENSOR: 'Мэдрэгч',
  DOOR_LOCK: 'Хаалга/цоож',
  MODEM: 'Модем/холбоо',
  CARD_READER: 'Карт уншигч',
  BODY: 'Их бие/механик',
  OTHER: 'Бусад'
};

export interface MaintenanceRecord {
  id: number;
  bin: {
    id: number;
    binId: string;
    binName: string | null;
    location: string | null;
    district: string | null;
    khoroo: number | null;
  } | null;
  performedAt: string;
  category: MaintenanceCategory;
  reason: string | null;
  actionTaken: string | null;
  performedBy: string | null;
  cost: number | null;
  createdBy: string | null;
  createdAt: string;
}

export interface MaintenanceReport {
  startDate: string;
  endDate: string;
  totalRecords: number;
  binCount: number;
  totalCost: number | null;
  averagePerBin: number;
  topCategory: string | null;
  byCategory: {
    category: string;
    count: number;
    binCount: number;
    totalCost: number | null;
    percent: number;
  }[];
  byBin: {
    id: number;
    binId: string;
    binName: string | null;
    location: string | null;
    district: string | null;
    khoroo: number | null;
    count: number;
    lastPerformedAt: string | null;
  }[];
  byKhoroo: { district: string | null; khoroo: number | null; count: number }[];
}

// ---------------- Тайлан татах ----------------

export type ReportType =
  | 'client-activity'
  | 'clearings'
  | 'battery'
  | 'maintenance';

/**
 * Тайланг файлаар татна.
 *
 * Энгийн <a href> болохгүй: export endpoint-ууд Authorization толгой шаарддаг
 * тул токентой fetch хийж, хариуг blob болгож хадгална.
 */
export async function downloadReport(
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>,
  type: ReportType,
  format: 'excel' | 'pdf',
  filters: ReportFilters
): Promise<void> {
  const response = await fetchWithAuth(
    `/api/export/reports/${type}/${format}?${toQuery(filters)}`
  );
  if (!response.ok) {
    throw new Error('Тайлан татахад алдаа гарлаа');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${type}_${filters.startDate}_${filters.endDate}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Blob URL-ийг суллахгүй бол таб хаагдтал санах ойд үлдэнэ.
  URL.revokeObjectURL(url);
}
