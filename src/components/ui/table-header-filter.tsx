'use client';

import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
  IconCalendar,
  IconChevronDown,
  IconChevronUp,
  IconChevronsDown,
  IconSearch
} from '@tabler/icons-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  ActiveFilter,
  FilterFieldType,
  FilterOperator,
  buildFilter,
  defaultOperatorsFor,
  replaceFilter
} from './table-filter/filter-model';

export type {
  ActiveFilter,
  FilterField,
  FilterOperator,
  SortConfig
} from './table-filter/filter-model';
export { useTableFilters } from './table-filter/use-table-filters';

interface TableHeaderFilterProps {
  field: string;
  label: string;
  type: FilterFieldType;
  sortable?: boolean;
  filterable?: boolean;
  currentSort?: { field: string; direction: 'asc' | 'desc' };
  activeFilters: ActiveFilter[];
  onSort: (field: string) => void;
  onFilterChange: (filters: ActiveFilter[]) => void;
  filterOperators?: FilterOperator[];
  customFilterOptions?: React.ReactNode;
  className?: string;
}

/** Хүснэгтийн баганын толгой — эрэмбэ ба шүүлтүүр. */
export function TableHeaderFilter({
  field,
  label,
  type,
  sortable = true,
  filterable = true,
  currentSort,
  activeFilters,
  onSort,
  onFilterChange,
  filterOperators,
  customFilterOptions,
  className = ''
}: TableHeaderFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [operator, setOperator] = useState('');
  const [value, setValue] = useState('');
  const [value2, setValue2] = useState('');
  const [date, setDate] = useState<Date | undefined>();
  const [date2, setDate2] = useState<Date | undefined>();

  const operators = filterOperators ?? defaultOperatorsFor(type);
  const isBetweenNumber = operator === 'between' && type === 'number';
  const hasFilter = activeFilters.some((f) => f.field === field);

  const resetInputs = () => {
    setOperator('');
    setValue('');
    setValue2('');
    setDate(undefined);
    setDate2(undefined);
  };

  /** Нээхэд одоо үйлчилж буй шүүлтүүрийг талбарууд руу буулгана. */
  const loadExisting = () => {
    const existing = activeFilters.find((f) => f.field === field);
    if (!existing) return;
    setOperator(existing.operator);
    const raw = existing.value;
    if (typeof raw === 'string' || typeof raw === 'number') {
      setValue(String(raw));
    } else if (typeof raw === 'object') {
      if ('min' in raw && 'max' in raw) {
        setValue(String(raw.min));
        setValue2(String(raw.max));
      } else if ('start' in raw && 'end' in raw) {
        setValue(raw.start);
        setValue2(raw.end);
      }
    }
  };

  const clearField = () => {
    onFilterChange(activeFilters.filter((f) => f.field !== field));
    setValue('');
    setValue2('');
  };

  const close = () => {
    setIsOpen(false);
    resetInputs();
  };

  /**
   * Шүүлтүүрийг үүсгээд ҮРГЭЛЖ солино.
   *
   * Өмнө нь гурван тусдаа зам (Хайх товч, оператор солих, огноо сонгох) тус
   * бүрдээ утга/шошго бүтээх кодоо давтаж бичсэн бөгөөд хоёр нь хуучин
   * жагсаалт дээр нэмдэг тул нэг талбарт ХОЁР шүүлтүүр үлдээдэг байв.
   */
  const commit = (
    overrides: Partial<{
      operator: string;
      value: string;
      value2: string;
      date: Date | undefined;
      date2: Date | undefined;
    }> = {}
  ) => {
    const op = overrides.operator ?? operator ?? operators[0]?.value;
    if (!op) return;

    const next = buildFilter({
      field,
      label,
      type,
      operator: op,
      operators,
      value: overrides.value ?? value,
      value2: overrides.value2 ?? value2,
      date: 'date' in overrides ? overrides.date : date,
      date2: 'date2' in overrides ? overrides.date2 : date2
    });
    if (next) onFilterChange(replaceFilter(activeFilters, next));
  };

  const changeValue = (next: string, isSecond = false) => {
    if (isSecond) setValue2(next);
    else setValue(next);

    // Бүх талбар хоосорсон үед шүүлтүүрийг автоматаар авна.
    const first = isSecond ? value : next;
    const second = isSecond ? next : value2;
    const empty = isBetweenNumber
      ? !first.trim() && !second.trim()
      : !next.trim();
    if (empty) clearField();
  };

  const changeOperator = (next: string) => {
    setOperator(next);
    // Утга аль хэдийн бичигдсэн бол оператор солиход шууд хэрэгжинэ.
    if (type !== 'date' && value.trim()) commit({ operator: next });
  };

  const changeDate = (next: Date | undefined, isSecond = false) => {
    if (isSecond) setDate2(next);
    else setDate(next);
    if (next) commit(isSecond ? { date2: next } : { date: next });
  };

  // Гадуур дарахад хаана — Select/Popover-ийн дотоод элементийг тооцохгүй.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.closest('.table-header-filter-dropdown') ||
        target.closest('.table-header-filter-trigger') ||
        target.closest('[role="listbox"]') ||
        target.closest('[role="option"]') ||
        target.closest('[role="combobox"]') ||
        target.closest('input') ||
        target.closest('button')
      ) {
        return;
      }
      close();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sorted = currentSort?.field === field ? currentSort.direction : null;
  const canApply = isBetweenNumber
    ? Boolean(value.trim() && value2.trim())
    : Boolean(value.trim());

  return (
    <div className={`relative ${className}`}>
      <div className='flex items-center justify-center gap-2'>
        <span className='text-center'>{label}</span>

        {sortable && (
          <Button
            variant='ghost'
            size='sm'
            className='h-6 w-6 p-0 hover:bg-transparent'
            onClick={() => onSort(field)}
            title={
              sorted
                ? `Sorted by ${label} (${sorted === 'asc' ? 'ascending' : 'descending'})`
                : `Sort by ${label}`
            }
          >
            <span className={sorted ? 'text-foreground' : 'text-muted-foreground'}>
              {sorted === 'asc' ? (
                <IconChevronUp className='h-4 w-4' />
              ) : sorted === 'desc' ? (
                <IconChevronDown className='h-4 w-4' />
              ) : (
                <IconChevronsDown className='h-4 w-4' />
              )}
            </span>
          </Button>
        )}

        {filterable && (
          <Button
            variant='ghost'
            size='sm'
            className='table-header-filter-trigger h-6 w-6 p-0 hover:bg-transparent'
            onClick={() => {
              if (isOpen) {
                close();
                return;
              }
              resetInputs();
              loadExisting();
              setIsOpen(true);
            }}
            title='Хуудасны талбарын утгуудын хувьсагч сонгох'
          >
            <IconSearch className='text-muted-foreground hover:text-foreground h-4 w-4' />
          </Button>
        )}
      </div>

      {isOpen && (
        <div className='table-header-filter-dropdown absolute top-full left-0 z-50 mt-1 w-64 rounded-lg border bg-white p-3 shadow-lg'>
          <div className='space-y-2'>
            <Select value={operator} onValueChange={changeOperator}>
              <SelectTrigger
                size='sm'
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <SelectValue placeholder='Хувьсагч' />
              </SelectTrigger>
              <SelectContent onCloseAutoFocus={(e) => e.preventDefault()}>
                {operators.map((op) => (
                  <SelectItem key={op.value} value={op.value}>
                    {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {customFilterOptions ?? (
              <FilterInputs
                type={type}
                operator={operator}
                value={value}
                value2={value2}
                date={date}
                date2={date2}
                onValueChange={changeValue}
                onDateChange={changeDate}
              />
            )}

            <div className='flex gap-2'>
              {type !== 'date' && canApply && (
                <Button
                  variant='default'
                  size='sm'
                  onClick={() => commit()}
                  className='flex-1'
                >
                  Хайх
                </Button>
              )}
              {type !== 'date' &&
                (canApply || value.trim() || value2.trim() || hasFilter) && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      resetInputs();
                      clearField();
                    }}
                    className='flex-1'
                  >
                    Цэвэрлэх
                  </Button>
                )}
              <Button
                variant='outline'
                size='sm'
                onClick={close}
                className='flex-1'
              >
                Хаах
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Талбарын төрлөөс хамаарсан оролтууд. */
function FilterInputs({
  type,
  operator,
  value,
  value2,
  date,
  date2,
  onValueChange,
  onDateChange
}: {
  type: FilterFieldType;
  operator: string;
  value: string;
  value2: string;
  date: Date | undefined;
  date2: Date | undefined;
  onValueChange: (value: string, isSecond?: boolean) => void;
  onDateChange: (date: Date | undefined, isSecond?: boolean) => void;
}) {
  if (type === 'date') {
    if (operator === 'between') {
      return (
        <div className='grid grid-cols-2 gap-2'>
          <DatePicker
            date={date}
            placeholder='Эхлэх...'
            onSelect={(d) => onDateChange(d)}
          />
          <DatePicker
            date={date2}
            placeholder='Дуусах...'
            onSelect={(d) => onDateChange(d, true)}
          />
        </div>
      );
    }
    return (
      <DatePicker
        date={date}
        placeholder='Сонгох...'
        longFormat
        onSelect={(d) => onDateChange(d)}
      />
    );
  }

  if (operator === 'between' && type === 'number') {
    return (
      <div className='grid grid-cols-2 gap-2'>
        <Input
          placeholder='Min'
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          type='number'
        />
        <Input
          placeholder='Max'
          value={value2}
          onChange={(e) => onValueChange(e.target.value, true)}
          type='number'
        />
      </div>
    );
  }

  if (type === 'boolean') {
    return (
      <Select value={value} onValueChange={(v) => onValueChange(v)}>
        <SelectTrigger size='sm'>
          <SelectValue placeholder='Сонгоно уу' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='true'>Идэвхтэй</SelectItem>
          <SelectItem value='false'>Идэвхгүй</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  return (
    <Input
      placeholder='Утга оруулах'
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      type={type === 'number' ? 'number' : 'text'}
    />
  );
}

function DatePicker({
  date,
  placeholder,
  longFormat = false,
  onSelect
}: {
  date: Date | undefined;
  placeholder: string;
  longFormat?: boolean;
  onSelect: (date: Date | undefined) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className='w-full justify-start text-left font-normal'
        >
          <IconCalendar className='mr-1 h-3 w-3' />
          {date ? format(date, longFormat ? 'MMM dd, yyyy' : 'MMM dd') : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='start'>
        <Calendar mode='single' selected={date} onSelect={onSelect} initialFocus />
      </PopoverContent>
    </Popover>
  );
}
