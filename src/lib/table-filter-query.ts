import type { ActiveFilter } from '@/components/ui/table-header-filter';

/**
 * Хүснэгтийн шүүлтүүрүүдийг backend-ийн `search` мөр болгоно.
 *
 * `SearchQueryParser`-ийн хүлээж авдаг хэлбэр: `field: {"op": "value"}`,
 * олон нөхцөлийг `; `-ээр залгана.
 *
 * Энэ хөрвүүлэлт card / bins / bins-grouped / transactions дөрвөн харагдац
 * дээр, тус бүрдээ жагсаалт ба Excel экспортод гэж хоёр удаа — нийт долоон
 * хувь болж хуулагдсан байв. Нэг операторын зан төлөвийг өөрчлөхийн тулд
 * долоон газар засах шаардлагатай болдог.
 */
export function buildFilterSearch(filters: ActiveFilter[]): string | undefined {
  const parts = filters
    .map(toSearchPart)
    .filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join('; ') : undefined;
}

function toSearchPart(filter: ActiveFilter): string | null {
  const { field, operator, value } = filter;

  if (operator === 'between') {
    const range = toRange(value);
    return range ? `${field}: {"between": ${range}}` : null;
  }

  switch (operator) {
    case 'is':
    case 'is_not':
    case 'contains':
    case 'greater_than':
    case 'less_than':
      return `${field}: {"${operator}": "${value}"}`;
    default:
      return null;
  }
}

/**
 * `between`-ийн утга гурван хэлбэрээр ирдэг: тоон муж (`{min, max}`),
 * огнооны муж (`{start, end}`) ба массив (`[min, max]`). Гурвуулаа бодит
 * хэрэглээнд тохиолддог тул гурвыг нь дэмжинэ — өмнө нь `card` ба `bins`
 * харагдац эхнийхийг л мэддэг тул огноогоор шүүх нь чимээгүй үр дүнгүй
 * үлддэг байв.
 */
function toRange(value: unknown): string | null {
  if (Array.isArray(value) && value.length === 2) {
    return `{"min": "${value[0]}", "max": "${value[1]}"}`;
  }
  if (typeof value !== 'object' || value === null) return null;
  if ('min' in value && 'max' in value) {
    const range = value as { min: unknown; max: unknown };
    return `{"min": "${range.min}", "max": "${range.max}"}`;
  }
  if ('start' in value && 'end' in value) {
    const range = value as { start: unknown; end: unknown };
    return `{"start": "${range.start}", "end": "${range.end}"}`;
  }
  return null;
}
