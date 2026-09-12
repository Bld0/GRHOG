import { PaginationParams } from '../use-pagination';

export interface Statistics {
  uniqueClientCount: number;
  uniqueBinCount: number;
  totalAccessedCount: number;
  totalActiveBins: number;
  overallAvgStorageLevelPercent: number;
  overallAvgBatteryLevelPercent: number;
}

export interface PaginationState {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  // API-аас ирдэг нэгдсэн үзүүлэлтүүд
  totalBins?: number;
  activeBins?: number;
  averageStorageLevel?: number;
  totalUsages?: number;
  uniqueClients?: number;
  uniqueBins?: number;
  totalClients?: number;
  totalAccess?: number;
  activeClients?: number;
  statistics?: Statistics;
}

/** Хуудаслалттай жагсаалт татдаг бүх hook-ийн нийтлэг хариу. */
export interface HookReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  pagination: PaginationState;
  refetch: () => void;
}

export const EMPTY_PAGINATION: PaginationState = {
  page: 0,
  size: 20,
  totalElements: 0,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false
};

/**
 * Backend хоёр хэлбэрээр хариулдаг: цэвэр массив (хуучин цэгүүд) эсвэл
 * `PagedResponse` объект. Хоёуланг нь нэг хэлбэрт оруулна.
 */
export function handlePaginationResponse(data: any): {
  content: any[];
  pagination: PaginationState;
} {
  if (Array.isArray(data)) {
    return {
      content: data,
      pagination: { ...EMPTY_PAGINATION, size: data.length, totalElements: data.length, totalPages: 1 }
    };
  }

  if (data && Array.isArray(data.content)) {
    return {
      content: data.content,
      pagination: {
        page: data.page || 0,
        size: data.size || 20,
        totalElements: data.totalElements || 0,
        totalPages: data.totalPages || 0,
        hasNext: data.hasNext || false,
        hasPrevious: data.hasPrevious || false,
        totalBins: data.totalBins,
        activeBins: data.activeBins,
        averageStorageLevel: data.averageStorageLevel,
        totalUsages: data.totalUsages,
        uniqueClients: data.uniqueClients,
        uniqueBins: data.uniqueBins,
        totalClients: data.totalClients,
        totalAccess: data.totalAccess,
        activeClients: data.activeClients,
        statistics: data.statistics
      }
    };
  }

  console.warn('Unexpected data format:', data);
  return { content: [], pagination: EMPTY_PAGINATION };
}

/**
 * Хүсэлтийн параметрийн нэр backend дээр өөр байдаг цөөн тохиолдол.
 *
 * `binId` гурван эх сурвалжтай (`binIdFilter`, `clearingBinId`) тул
 * `PaginationParams` дотор өөр өөр нэртэй байдаг.
 */
const RENAMED: Record<string, string> = {
  binIdFilter: 'binId',
  cardIdFilter: 'cardId',
  clearingBinId: 'binId'
};

/**
 * `PaginationParams`-ыг query string болгоно.
 *
 * Өмнө нь энэ нь 38 талбар бүрийг гараар шалгасан 120 мөрийн `if`-ийн цуваа
 * байв — шинэ шүүлтүүр нэмэх бүрд өөр нэг `if` бичих шаардлагатай байсан.
 * `0` ба `false` утга ИЛГЭЭГДЭНЭ (хуудасны дугаар, `isActive=false`), зөвхөн
 * `undefined`, `null`, хоосон мөр алгасагдана.
 */
export function buildQueryParams(
  paginationParams?: PaginationParams
): URLSearchParams {
  const queryParams = new URLSearchParams();
  if (!paginationParams) return queryParams;

  for (const [key, value] of Object.entries(paginationParams)) {
    if (value === undefined || value === null || value === '') continue;
    queryParams.append(RENAMED[key] ?? key, String(value));
  }
  return queryParams;
}

/** Query string-тэй бол `?`-той залгана. */
export function withQuery(endpoint: string, params: URLSearchParams): string {
  const query = params.toString();
  return query ? `${endpoint}?${query}` : endpoint;
}
