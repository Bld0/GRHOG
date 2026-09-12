'use client';

import { useState } from 'react';

import type { ActiveFilter, SortConfig } from './filter-model';

/** Хүснэгтийн шүүлтүүр ба эрэмбийн төлөв. */
export function useTableFilters(initialFilters: ActiveFilter[] = []) {
  const [activeFilters, setActiveFilters] =
    useState<ActiveFilter[]>(initialFilters);
  const [sortConfig, setSortConfig] = useState<SortConfig | undefined>();

  const addFilter = (filter: ActiveFilter) =>
    setActiveFilters((prev) => [...prev, filter]);

  const removeFilter = (filterId: string) =>
    setActiveFilters((prev) => prev.filter((f) => f.id !== filterId));

  const removeFilterByField = (field: string) =>
    setActiveFilters((prev) => prev.filter((f) => f.field !== field));

  const clearAllFilters = () => setActiveFilters([]);

  /** Нэг талбар дээр дахин дарвал чиглэл сольж, өөр талбар бол `asc`-ээс. */
  const handleSort = (field: string) =>
    setSortConfig((prev) =>
      prev?.field === field
        ? { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { field, direction: 'asc' }
    );

  return {
    activeFilters,
    sortConfig,
    addFilter,
    removeFilter,
    removeFilterByField,
    clearAllFilters,
    handleSort,
    setActiveFilters
  };
}
