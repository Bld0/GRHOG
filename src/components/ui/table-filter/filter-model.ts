import { format } from 'date-fns';

export type FilterFieldType = 'text' | 'number' | 'boolean' | 'date';

export interface FilterField {
  value: string;
  label: string;
  type: FilterFieldType;
}

export interface FilterOperator {
  value: string;
  label: string;
}

export interface ActiveFilter {
  id: string;
  field: string;
  operator: string;
  value:
    | string
    | number
    | boolean
    | { start: string; end: string }
    | { min: number; max: number };
  label: string;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

/** Талбарын төрлөөс хамаарсан үндсэн операторууд. */
export function defaultOperatorsFor(type: FilterFieldType): FilterOperator[] {
  switch (type) {
    case 'text':
      return [
        { value: 'is', label: 'тэнцүү' },
        { value: 'is_not', label: 'тэнцүү биш' },
        { value: 'contains', label: 'агуулсан' },
        { value: 'starts_with', label: 'эхэлсэн' },
        { value: 'ends_with', label: 'төгссөн' },
        { value: 'is_empty', label: 'хоосон' }
      ];
    case 'number':
      return [
        { value: 'is', label: 'тэнцүү' },
        { value: 'is_not', label: 'тэнцүү биш' },
        { value: 'greater_than', label: 'их' },
        { value: 'less_than', label: 'бага' },
        { value: 'between', label: 'хооронд' },
        { value: 'is_empty', label: 'хоосон' }
      ];
    case 'boolean':
      return [
        { value: 'is', label: 'тэнцүү' },
        { value: 'is_not', label: 'тэнцүү биш' }
      ];
    case 'date':
      return [
        { value: 'is', label: 'тэнцүү' },
        { value: 'is_not', label: 'тэнцүү биш' },
        { value: 'before', label: 'өмнө' },
        { value: 'after', label: 'дараа' },
        { value: 'between', label: 'хооронд' },
        { value: 'is_empty', label: 'хоосон' }
      ];
    default:
      return [{ value: 'is', label: 'тэнцүү' }];
  }
}

interface BuildArgs {
  field: string;
  label: string;
  type: FilterFieldType;
  operator: string;
  operators: FilterOperator[];
  /** Текст/тоо/boolean-ийн утга, эсвэл `between`-ийн эхний утга. */
  value: string;
  /** `between`-ийн хоёр дахь утга. */
  value2?: string;
  /** Огнооны талбарт утгын оронд ашиглана. */
  date?: Date;
  date2?: Date;
}

/**
 * Шүүлтүүрийн объект бүтээнэ. Утга дутуу бол `null` — дуудагч юу ч хийхгүй.
 *
 * Өмнө нь энэ логик `applyFilter`, `handleOperatorChange`, `handleDateChange`
 * гэсэн ГУРВАН газар бага зэрэг ялгаатайгаар хуулагдсан байсан тул
 * шинэ оператор нэмэхэд гурвуулангийнх нь тохирох салааг олох шаардлагатай
 * байв.
 */
export function buildFilter(args: BuildArgs): ActiveFilter | null {
  const { field, label, type, operator, operators } = args;
  const operatorLabel =
    operators.find((op) => op.value === operator)?.label ?? 'тэнцүү';

  // "хоосон" нь утга шаарддаггүй цорын ганц оператор.
  if (operator === 'is_empty') {
    return {
      id: `${field}_${Date.now()}`,
      field,
      operator,
      value: '',
      label: `${label} хоосон`
    };
  }

  const made =
    type === 'date'
      ? buildDate(args, operatorLabel)
      : buildValue(args, operatorLabel);
  if (!made) return null;

  return {
    id: `${field}_${Date.now()}`,
    field,
    operator,
    value: made.value,
    label: made.label
  };
}

function buildValue(
  { label, type, operator, value, value2 }: BuildArgs,
  operatorLabel: string
): { value: ActiveFilter['value']; label: string } | null {
  if (type === 'boolean') {
    if (!value) return null;
    const isTrue = value === 'true';
    return {
      value: isTrue,
      label: `${label} ${operatorLabel} ${isTrue ? 'Идэвхтэй' : 'Идэвхгүй'}`
    };
  }

  if (operator === 'between' && type === 'number') {
    if (!value.trim() || !value2?.trim()) return null;
    return {
      value: { min: parseFloat(value), max: parseFloat(value2) },
      label: `${label} ${value}-${value2} хооронд`
    };
  }

  const trimmed = value.trim();
  if (!trimmed) return null;
  return { value: trimmed, label: `${label} ${operatorLabel} ${trimmed}` };
}

function buildDate(
  { label, operator, date, date2 }: BuildArgs,
  operatorLabel: string
): { value: ActiveFilter['value']; label: string } | null {
  if (operator === 'between') {
    if (!date || !date2) return null;
    return {
      value: { start: isoDay(date), end: isoDay(date2) },
      label: `${label} ${format(date, 'yyyy.MM.dd')}-${format(date2, 'yyyy.MM.dd')} хооронд`
    };
  }

  if (!date) return null;
  return {
    value: isoDay(date),
    label: `${label} ${format(date, 'yyyy.MM.dd')} ${operatorLabel}`
  };
}

const isoDay = (date: Date) => date.toISOString().split('T')[0];

/**
 * Тухайн талбарын шүүлтүүрийг ҮРГЭЛЖ солино.
 *
 * Өмнө нь `handleOperatorChange` ба `handleDateChange` нь эхлээд
 * `removeFilterByField()` дуудаад (тэр нь `onFilterChange`-ийг шинэ жагсаалтаар
 * дуудна) дараа нь ХУУЧИН `activeFilters` дээр нэмдэг байсан — устгалт нь
 * дарагдаж, нэг талбарт ХОЁР шүүлтүүр үлддэг байв.
 */
export function replaceFilter(
  filters: ActiveFilter[],
  next: ActiveFilter
): ActiveFilter[] {
  return [...filters.filter((f) => f.field !== next.field), next];
}
