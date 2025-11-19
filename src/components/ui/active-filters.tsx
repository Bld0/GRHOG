'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IconX } from '@tabler/icons-react';
import { ActiveFilter } from './table-header-filter';

interface ActiveFiltersProps {
  activeFilters: ActiveFilter[];
  onRemoveFilter: (filterId: string) => void;
  onClearAll: () => void;
  className?: string;
}

export function ActiveFilters({ 
  activeFilters, 
  onRemoveFilter, 
  onClearAll, 
  className = '' 
}: ActiveFiltersProps) {
  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className={`mb-4 ${className}`}>
      <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/30 rounded-lg">
        <span className="text-sm font-medium text-muted-foreground mr-2">
          Идэвхитэй фильтр:
        </span>
        
        {activeFilters.map((filter) => (
          <Badge
            key={filter.id}
            variant="secondary"
            className="flex items-center gap-1 px-2 py-1"
          >
            <span className="text-xs truncate" title={filter.label}>
              {filter.label}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-transparent hover:text-destructive flex-shrink-0"
              onClick={() => onRemoveFilter(filter.id)}
            >
              <IconX className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
        
        {activeFilters.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Цэвэрлэх
          </Button>
        )}
      </div>
    </div>
  );
}
