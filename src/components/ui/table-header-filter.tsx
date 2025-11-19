'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { IconSearch, IconChevronUp, IconChevronDown, IconChevronsDown, IconCalendar } from '@tabler/icons-react';
import { format } from 'date-fns';

export interface FilterField {
  value: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'date';
}

export interface FilterOperator {
  value: string;
  label: string;
}

export interface ActiveFilter {
  id: string;
  field: string;
  operator: string;
  value: string | number | boolean | { start: string; end: string } | { min: number; max: number };
  label: string;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

interface TableHeaderFilterProps {
  // Column configuration
  field: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'date';
  sortable?: boolean;
  filterable?: boolean;
  
  // Current state
  currentSort?: SortConfig;
  activeFilters: ActiveFilter[];
  
  // Callbacks
  onSort: (field: string) => void;
  onFilterChange: (filters: ActiveFilter[]) => void;
  
  // Filter options
  filterOperators?: FilterOperator[];
  customFilterOptions?: React.ReactNode;
  
  // Styling
  className?: string;
  width?: string;
}

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
  className = '',
  width = 'w-[100px]'
}: TableHeaderFilterProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [filterValue2, setFilterValue2] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedDate2, setSelectedDate2] = useState<Date | undefined>();
  const [hasAppliedFilter, setHasAppliedFilter] = useState(false);
  const [isApplyingFilter, setIsApplyingFilter] = useState(false);

  // Default filter operators based on field type
  const defaultOperators: FilterOperator[] = filterOperators || (() => {
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
  })();

  // Get sort indicator
  const getSortIndicator = () => {
    if (!currentSort || currentSort.field !== field) {
              return { icon: <IconChevronsDown className="h-4 w-4" />, className: 'text-muted-foreground' };
    }
    
    if (currentSort.direction === 'asc') {
      return { icon: <IconChevronUp className="h-4 w-4" />, className: 'text-foreground' };
    } else {
      return { icon: <IconChevronDown className="h-4 w-4" />, className: 'text-foreground' };
    }
  };

  // Get sort tooltip
  const getSortTooltip = () => {
    if (!currentSort || currentSort.field !== field) {
      return `Sort by ${label}`;
    }
    
    if (currentSort.direction === 'asc') {
      return `Sorted by ${label} (ascending)`;
    } else {
      return `Sorted by ${label} (descending)`;
    }
  };

  // Reset filter state
  const resetFilterState = () => {
    setSelectedOperator('');
    setFilterValue('');
    setFilterValue2('');
    setSelectedDate(undefined);
    setSelectedDate2(undefined);
    setHasAppliedFilter(false);
    setIsApplyingFilter(false);
    // Don't clear existing filters here - let the user decide
  };

  // Initialize filter state with existing filter
  const initializeFilterState = () => {
    const existingFilter = activeFilters.find(f => f.field === field);
    if (existingFilter) {
      setSelectedOperator(existingFilter.operator);
      if (typeof existingFilter.value === 'string' || typeof existingFilter.value === 'number') {
        setFilterValue(existingFilter.value.toString());
      } else if (existingFilter.operator === 'between' && typeof existingFilter.value === 'object') {
        // Handle between operator values
        if ('min' in existingFilter.value && 'max' in existingFilter.value) {
          setFilterValue(existingFilter.value.min.toString());
          setFilterValue2(existingFilter.value.max.toString());
        } else if ('start' in existingFilter.value && 'end' in existingFilter.value) {
          // Handle date between values
          setFilterValue(existingFilter.value.start);
          setFilterValue2(existingFilter.value.end);
        }
      }
      setHasAppliedFilter(true); // Mark as already applied
    }
  };

  // Remove existing filter for this field
  const removeFilterByField = () => {
    const newFilters = activeFilters.filter(f => f.field !== field);
    onFilterChange(newFilters);
    // Reset filter values when removing
    setFilterValue('');
    setFilterValue2('');
  };

  // Close filter dropdown
  const closeFilter = () => {
    setIsFilterOpen(false);
    resetFilterState();
    // Don't clear existing filters - just reset the input state
  };

  // Apply filter with current values
  const applyFilter = () => {
    if (type !== 'date' && !isApplyingFilter) {
      // For between operator, we need both values
      if (selectedOperator === 'between' && type === 'number') {
        if (!filterValue.trim() || !filterValue2.trim()) {
          return; // Don't apply until both values are set
        }
      } else if (!filterValue.trim()) {
        return; // Don't apply if no value for non-between operators
      }
      
      setIsApplyingFilter(true);
      
      const operatorToUse = selectedOperator || defaultOperators[0]?.value;
      
      if (operatorToUse) {
        // Always remove any existing filter for this field first
        removeFilterByField();
        
        let filterValueToUse: string | number | boolean | { min: number; max: number };
        let filterLabel = '';
        
        if (type === 'boolean') {
          filterValueToUse = filterValue === 'true';
          const operator = defaultOperators.find(op => op.value === operatorToUse);
          const valueLabel = filterValue === 'true' ? 'Идэвхтэй' : 'Идэвхгүй';
          filterLabel = `${label} ${operator?.label || 'is'} ${valueLabel}`;
        } else if (operatorToUse === 'between' && type === 'number') {
          // Handle between operator for numbers
          filterValueToUse = { 
            min: parseFloat(filterValue), 
            max: parseFloat(filterValue2) 
          };
          filterLabel = `${label} is between ${filterValue} and ${filterValue2}`;
        } else {
          filterValueToUse = filterValue.trim();
          const operator = defaultOperators.find(op => op.value === operatorToUse);
          filterLabel = `${label} ${operator?.label || 'is'} ${filterValue.trim()}`;
        }

        if (filterValueToUse !== undefined && filterValueToUse !== '') {
          const newFilter: ActiveFilter = {
            id: `${field}_${Date.now()}`,
            field,
            operator: operatorToUse,
            value: filterValueToUse,
            label: filterLabel
          };
          
          // Create a new array with the new filter, ensuring no duplicates
          const updatedFilters = activeFilters.filter(f => f.field !== field);
          onFilterChange([...updatedFilters, newFilter]);
          
          // Mark that we've applied a filter to prevent duplicate applications
          setHasAppliedFilter(true);
        }
        
        // Reset the applying flag after a short delay
        setTimeout(() => {
          setIsApplyingFilter(false);
        }, 100);
      } else {
        setIsApplyingFilter(false);
      }
    }
  };

  // Clear filter when input is cleared
  const clearFilterIfEmpty = (value: string) => {
    if (!value.trim()) {
      // For between operator, only clear if both values are empty
      if (selectedOperator === 'between' && type === 'number') {
        if (!filterValue.trim() && !filterValue2.trim()) {
          removeFilterByField();
        }
      } else {
        removeFilterByField();
      }
    }
  };

  // Handle filter value change
  const handleFilterValueChange = (value: string, isSecondValue = false) => {
    if (isSecondValue) {
      setFilterValue2(value);
      // For between operator, only clear if both values are empty
      if (selectedOperator === 'between' && type === 'number') {
        if (!filterValue.trim() && !value.trim()) {
          removeFilterByField();
        }
      } else {
        clearFilterIfEmpty(value);
      }
    } else {
      setFilterValue(value);
      if (type !== 'boolean') {
        // For between operator, only clear if both values are empty
        if (selectedOperator === 'between' && type === 'number') {
          if (!value.trim() && !filterValue2.trim()) {
            removeFilterByField();
          }
        } else {
          clearFilterIfEmpty(value);
        }
      }
    }

    // Reset the applied filter flag when user changes input
    setHasAppliedFilter(false);

    // Don't auto-apply filter as user types - only store the value
    // Filter will be applied when user selects an operator or when filter is submitted
  };

  // Handle input key press (Enter key)
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Don't auto-apply on Enter - let user click Apply Filter button
      e.preventDefault();
    }
  };

  // Handle input blur (when input loses focus)
  const handleInputBlur = () => {
    // Don't auto-apply on blur - let user click Apply Filter button
    // This prevents accidental filter applications
  };

  // Handle operator change
  const handleOperatorChange = (value: string) => {
    setSelectedOperator(value);
    
    // Reset the applied filter flag when operator changes
    setHasAppliedFilter(false);
    
    // Apply filter when operator is selected and there's a value
    if (type !== 'date' && filterValue.trim()) {
      removeFilterByField();
      
      let filterValueToUse: string | number | boolean | { min: number; max: number };
      let filterLabel = '';
      
      if (type === 'boolean') {
        filterValueToUse = filterValue === 'true';
        const operator = defaultOperators.find(op => op.value === value);
        const valueLabel = filterValue === 'true' ? 'Идэвхтэй' : 'Идэвхгүй';
        filterLabel = `${label} ${operator?.label || 'is'} ${valueLabel}`;
      } else if (value === 'between' && type === 'number') {
        // For between operator, we need both values
        if (filterValue.trim() && filterValue2.trim()) {
          filterValueToUse = { 
            min: parseFloat(filterValue), 
            max: parseFloat(filterValue2) 
          };
          filterLabel = `${label} is between ${filterValue} and ${filterValue2}`;
        } else {
          return; // Don't apply until both values are set
        }
      } else {
        filterValueToUse = filterValue.trim();
        const operator = defaultOperators.find(op => op.value === value);
        filterLabel = `${label} ${operator?.label || 'is'} ${filterValue.trim()}`;
      }

      if (filterValueToUse !== undefined && filterValueToUse !== '') {
        const newFilter: ActiveFilter = {
          id: `${field}_${Date.now()}`,
          field,
          operator: value,
          value: filterValueToUse,
          label: filterLabel
        };
        
        onFilterChange([...activeFilters, newFilter]);
      }
    }
  };

  // Handle date selection
  const handleDateChange = (date: Date | undefined, isSecondDate = false) => {
    if (isSecondDate) {
      setSelectedDate2(date);
    } else {
      setSelectedDate(date);
    }

    // Apply filter when date is selected
    if (date) {
      // If no operator is selected, use the first one as default
      const operatorToUse = selectedOperator || defaultOperators[0]?.value;
      
      if (operatorToUse) {
        removeFilterByField();
        
        let filterValueToUse: string | number | boolean | { start: string; end: string };
        let filterLabel = '';
        
        if (operatorToUse === 'between' && type === 'date') {
          // For between operator, we need both dates
          const startDate = isSecondDate ? selectedDate : date;
          const endDate = isSecondDate ? date : selectedDate2;
          
          if (startDate && endDate) {
            filterValueToUse = { 
              start: startDate.toISOString().split('T')[0], 
              end: endDate.toISOString().split('T')[0] 
            };
            filterLabel = `${label} is between ${format(startDate, 'MMM dd, yyyy')} and ${format(endDate, 'MMM dd, yyyy')}`;
          } else {
            return; // Don't apply until both dates are set
          }
        } else {
          filterValueToUse = date.toISOString().split('T')[0];
          const operator = defaultOperators.find(op => op.value === operatorToUse);
          filterLabel = `${label} ${operator?.label || 'is'} ${format(date, 'MMM dd, yyyy')}`;
        }

        if (filterValueToUse) {
          const newFilter: ActiveFilter = {
            id: `${field}_${Date.now()}`,
            field,
            operator: operatorToUse,
            value: filterValueToUse,
            label: filterLabel
          };
          
          onFilterChange([...activeFilters, newFilter]);
        }
      }
    }
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Don't close if clicking on:
      // 1. The filter dropdown itself
      // 2. The filter trigger button
      // 3. Any Select component elements (listbox, options, etc.)
      // 4. Any Input elements within the dropdown
      if (target.closest('.table-header-filter-dropdown') || 
          target.closest('.table-header-filter-trigger') ||
          target.closest('[role="listbox"]') ||
          target.closest('[role="option"]') ||
          target.closest('[role="combobox"]') ||
          target.closest('input') ||
          target.closest('button')) {
        return;
      }
      
      closeFilter();
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center justify-center gap-2">
        <span className="text-center">{label}</span>
        
        {/* Sort Button */}
        {sortable && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-transparent"
            onClick={() => onSort(field)}
            title={getSortTooltip()}
          >
            <span className={getSortIndicator().className}>
              {getSortIndicator().icon}
            </span>
          </Button>
        )}
        
        {/* Filter Button */}
        {filterable && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-transparent table-header-filter-trigger"
            onClick={() => {
              if (isFilterOpen) {
                closeFilter();
              } else {
                resetFilterState();
                initializeFilterState();
                setIsFilterOpen(true);
              }
            }}
            title="Хуудасны талбарын утгуудын хувьсагч сонгох"
          >
            <IconSearch className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </Button>
        )}
      </div>

      {/* Filter Dropdown */}
      {isFilterOpen && (
        <div 
          key={`${field}-filter-${selectedOperator}-${isFilterOpen}`}
          className="absolute top-full left-0 mt-1 w-64 bg-white border rounded-lg shadow-lg z-50 p-3 table-header-filter-dropdown"
        >
          <div className="space-y-2">
            {/* Operator Select */}
            <Select value={selectedOperator} onValueChange={handleOperatorChange}>
              <SelectTrigger 
                size="sm" 
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <SelectValue placeholder="Хувьсагч" />
              </SelectTrigger>
              <SelectContent onCloseAutoFocus={(e) => e.preventDefault()}>
                {defaultOperators.map((op) => (
                  <SelectItem key={op.value} value={op.value}>
                    {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Custom Filter Options */}
            {customFilterOptions ? (
              customFilterOptions
            ) : (
              <>
                {/* Date Fields */}
                {type === 'date' ? (
                  <>
                    {selectedOperator === 'between' ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start text-left font-normal"
                              >
                                <IconCalendar className="mr-1 h-3 w-3" />
                                {selectedDate ? format(selectedDate, 'MMM dd') : 'Эхлэх...'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => handleDateChange(date)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start text-left font-normal"
                              >
                                <IconCalendar className="mr-1 h-3 w-3" />
                                {selectedDate2 ? format(selectedDate2, 'MMM dd') : 'Дуусах...'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={selectedDate2}
                                onSelect={(date) => handleDateChange(date, true)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    ) : (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start text-left font-normal"
                          >
                            <IconCalendar className="mr-2 h-4 w-4" />
                            {selectedDate ? format(selectedDate, 'MMM dd, yyyy') : 'Сонгох...'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => handleDateChange(date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  </>
                ) : (
                  /* Non-Date Fields */
                  <>
                    {selectedOperator === 'between' && type === 'number' ? (
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Min"
                          value={filterValue}
                          onChange={(e) => handleFilterValueChange(e.target.value)}
                          onKeyDown={handleInputKeyDown}
                          onBlur={handleInputBlur}
                          type="number"
                        />
                        <Input
                          placeholder="Max"
                          value={filterValue2}
                          onChange={(e) => handleFilterValueChange(e.target.value, true)}
                          onKeyDown={handleInputKeyDown}
                          onBlur={handleInputBlur}
                          type="number"
                        />
                      </div>
                    ) : type === 'boolean' ? (
                      <Select value={filterValue} onValueChange={handleFilterValueChange}>
                        <SelectTrigger size="sm">
                          <SelectValue placeholder="Сонгоно уу" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Идэвхтэй</SelectItem>
                          <SelectItem value="false">Идэвхгүй</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        placeholder="Утга оруулах"
                        value={filterValue}
                        onChange={(e) => handleFilterValueChange(e.target.value)}
                        onKeyDown={handleInputKeyDown}
                        onBlur={handleInputBlur}
                        type={type === 'number' ? 'number' : 'text'}
                      />
                    )}
                  </>
                )}
              </>
            )}

            {/* Close Button */}
            <div className="flex gap-2">
              {type !== 'date' && (
                (selectedOperator === 'between' && type === 'number' ? 
                  (filterValue.trim() && filterValue2.trim()) : 
                  (filterValue.trim() || (type === 'boolean' && filterValue))
                ) && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={applyFilter}
                    disabled={isApplyingFilter}
                    className="flex-1"
                  >
                    {isApplyingFilter ? 'Хайж байна...' : 'Хайх'}
                  </Button>
                )
              )}
              {type !== 'date' && (
                (selectedOperator === 'between' && type === 'number' ? 
                  (filterValue.trim() || filterValue2.trim()) : 
                  (filterValue.trim() || (type === 'boolean' && filterValue))
                ) || activeFilters.some(f => f.field === field)
              ) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    resetFilterState();
                    removeFilterByField();
                  }}
                  className="flex-1"
                >
                  Цэвэрлэх
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={closeFilter}
                className="flex-1"
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

// Hook for managing filters and sorting
export function useTableFilters(initialFilters: ActiveFilter[] = []) {
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>(initialFilters);
  const [sortConfig, setSortConfig] = useState<SortConfig | undefined>();

  const addFilter = (filter: ActiveFilter) => {
    setActiveFilters(prev => [...prev, filter]);
  };

  const removeFilter = (filterId: string) => {
    setActiveFilters(prev => prev.filter(f => f.id !== filterId));
  };

  const removeFilterByField = (field: string) => {
    setActiveFilters(prev => prev.filter(f => f.field !== field));
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
  };

  const handleSort = (field: string) => {
    setSortConfig(prev => {
      if (prev?.field === field) {
        return {
          field,
          direction: prev.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { field, direction: 'asc' };
    });
  };

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
