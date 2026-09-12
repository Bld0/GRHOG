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
        { value: 'is', label: 'is' },
        { value: 'is_not', label: 'is not' },
        { value: 'contains', label: 'contains' },
        { value: 'starts_with', label: 'starts with' },
        { value: 'ends_with', label: 'ends with' }
      ];
    case 'number':
      return [
        { value: 'is', label: 'is' },
        { value: 'is_not', label: 'is not' },
        { value: 'greater_than', label: 'is greater than' },
        { value: 'less_than', label: 'is less than' },
        { value: 'between', label: 'is between' }
      ];
    case 'boolean':
      return [
        { value: 'is', label: 'is' },
        { value: 'is_not', label: 'is not' }
      ];
    case 'date':
      return [
        { value: 'is', label: 'is' },
        { value: 'is_not', label: 'is not' },
        { value: 'before', label: 'is before' },
        { value: 'after', label: 'is after' },
        { value: 'between', label: 'is between' }
      ];
    default:
      return [{ value: 'is', label: 'is' }];
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
    operators.find((op) => op.value === operator)?.label ?? 'is';

  const made = type === 'date' ? buildDate(args, operatorLabel) : buildValue(args, operatorLabel);
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
      label: `${label} is between ${value} and ${value2}`
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
      label: `${label} is between ${format(date, 'MMM dd, yyyy')} and ${format(date2, 'MMM dd, yyyy')}`
    };
  }

  if (!date) return null;
  return {
    value: isoDay(date),
    label: `${label} ${operatorLabel} ${format(date, 'MMM dd, yyyy')}`
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
