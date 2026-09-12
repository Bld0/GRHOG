'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  IconAlertTriangle,
  IconDownload,
  IconSearch,
  IconTrash,
  IconX
} from '@tabler/icons-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { ActiveFilters } from '@/components/ui/active-filters';
import { useTableFilters } from '@/components/ui/table-header-filter';
import { TablePagination } from '@/components/ui/table-pagination';
import PageContainer from '@/components/layout/page-container';
import { useGroupedBins } from '@/hooks/use-api-data';
import { useBinSummary } from '@/hooks/use-bin-stats';
import { PaginationParams } from '@/hooks/use-pagination';
import { useRolePermissions } from '@/hooks/use-role-permissions';
import { buildFilterSearch } from '@/lib/table-filter-query';
import { downloadXlsx } from '@/lib/export-xlsx';

import { BinDeleteDialog } from './bin-delete-dialog';
import { BinsGroupedStats } from './bins-grouped-stats';
import { BinsGroupedTable } from './bins-grouped-table';

/**
 * Дүүрэг/хороогоор бүлэглэсэн савны жагсаалт — зохицуулалт л хийнэ.
 *
 * Хүснэгт, нэгдсэн үзүүлэлт, устгах цонх тус бүр өөрийн файлтай. Өмнө нь энэ
 * бүхэн 865 мөрийн нэг функц дотор байв.
 */
export function BinsViewGrouped() {
  const { canPerformAction, isKhorooLeader } = useRolePermissions();
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedBins, setSelectedBins] = useState<Set<number>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  // `searchInput` нь бичиж буй утга, `searchTerm` нь илгээгдсэн утга (Enter
  // эсвэл «Хайх») — товчлуур дарах бүрд дахин татахгүйн тулд хоёр тусдаа.
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const {
    activeFilters,
    sortConfig,
    removeFilter,
    clearAllFilters,
    handleSort,
    setActiveFilters
  } = useTableFilters();

  const paginationParams: PaginationParams = useMemo(() => {
    const params: any = {
      page: currentPage,
      size: itemsPerPage,
      sortBy: sortConfig?.field || 'district',
      sortDirection: sortConfig?.direction || 'asc'
    };
    // Хайлтын мөр нь баганын шүүлтүүрээс тусдаа `keyword` параметрээр явна.
    if (searchTerm) params.keyword = searchTerm;
    const filterSearch = buildFilterSearch(activeFilters);
    if (filterSearch) params.search = filterSearch;
    return params;
  }, [currentPage, itemsPerPage, activeFilters, sortConfig, searchTerm]);

  const {
    data: groupedBins,
    loading,
    error,
    pagination,
    refetch
  } = useGroupedBins(true, paginationParams);

  // Нийт/идэвхтэй/дүүрсэн савны нэгдсэн тоо.
  const { data: binSummary } = useBinSummary();

  useEffect(() => {
    setCurrentPage(0);
  }, [activeFilters, sortConfig, searchTerm]);

  const toggleGroup = (khoroo: number, location: string) => {
    const key = `${khoroo}-${location}`;
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSelectBin = (binId: number) =>
    setSelectedBins((prev) => {
      const next = new Set(prev);
      if (next.has(binId)) next.delete(binId);
      else next.add(binId);
      return next;
    });

  const toggleSelectGroup = (groupBins: any[]) => {
    const ids = groupBins.map((b) => b.id);
    const allSelected = ids.every((id) => selectedBins.has(id));
    setSelectedBins((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  const exportToExcel = () => {
    const params = new URLSearchParams();
    // Хүснэгтэд харагдаж буй мөрүүдийг л экспортлоно.
    if (searchTerm) params.append('keyword', searchTerm);
    const filterSearch = buildFilterSearch(activeFilters);
    if (filterSearch) params.append('search', filterSearch);
    if (sortConfig?.field) params.append('sortBy', sortConfig.field);
    if (sortConfig?.direction) {
      params.append('sortDirection', sortConfig.direction);
    }
    return downloadXlsx('/api/export/bins', params, 'bins_export');
  };

  if (loading && !groupedBins) return <BinsGroupedSkeleton />;

  if (error) {
    return (
      <PageContainer>
        <div className='flex flex-1 flex-col items-center justify-center space-y-4'>
          <IconAlertTriangle className='text-muted-foreground h-12 w-12' />
          <div className='text-center'>
            <h2 className='text-lg font-semibold'>Алдаа гарлаа</h2>
            <p className='text-muted-foreground'>
              Мэдээлэл ачааллахад алдаа гарлаа: {error}
            </p>
            <Button onClick={refetch} className='mt-4'>
              Дахин оролдох
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  const activeBins =
    binSummary?.active ?? pagination.statistics?.totalActiveBins ?? 0;

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-6'>
        <div className='flex items-center justify-between'>
          <h1 className='text-3xl font-bold tracking-tight'>
            Хогийн савны жагсаалт
          </h1>
          <div className='flex items-center gap-2'>
            {selectedBins.size > 0 && canPerformAction('canDeleteBins') && (
              <Button
                variant='destructive'
                size='sm'
                onClick={() => setShowDeleteDialog(true)}
              >
                <IconTrash className='mr-2 h-4 w-4' />
                Устгах ({selectedBins.size})
              </Button>
            )}
            {/* Экспорт нь бүсээр шүүгддэггүй тул backend дээр /export/** нь
                хорооны даргад 403 буцаана — 403 өгөх товч үзүүлэхгүй. */}
            {!isKhorooLeader && (
              <Button onClick={exportToExcel} variant='outline' size='sm'>
                <IconDownload className='mr-2 h-4 w-4' />
                Excel татах
              </Button>
            )}
          </div>
        </div>

        <BinsGroupedStats
          groupCount={pagination.totalElements}
          activeBins={activeBins}
          totalBins={binSummary?.total ?? activeBins}
          fullBins={binSummary?.full ?? 0}
          lowBatteryBins={binSummary?.lowBattery ?? 0}
          avgStorage={pagination.statistics?.overallAvgStorageLevelPercent || 0}
          avgBattery={pagination.statistics?.overallAvgBatteryLevelPercent || 0}
        />

        <Card>
          <CardHeader>
            <div className='flex flex-wrap items-center justify-between gap-4'>
              <div className='flex flex-wrap items-center gap-4'>
                <div>
                  <CardTitle>
                    Дүүрэг & Хороогоор ангилсан савны жагсаалт
                  </CardTitle>
                  <CardDescription>
                    {pagination.totalElements} бүлэг • {activeBins} идэвхтэй сав
                    • Хуудаслалт {currentPage + 1}/{pagination.totalPages}
                  </CardDescription>
                </div>

                <div className='flex items-center gap-2'>
                  <div className='relative'>
                    <IconSearch className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2' />
                    <Input
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key !== 'Enter') return;
                        e.preventDefault();
                        setSearchTerm(searchInput.trim());
                      }}
                      placeholder='Хороо, дүүрэг, байршил, савны нэр, ID...'
                      className='w-[280px] pl-8'
                    />
                    {searchInput && (
                      <button
                        type='button'
                        onClick={() => {
                          setSearchInput('');
                          setSearchTerm('');
                        }}
                        className='text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2'
                        aria-label='Хайлт цэвэрлэх'
                      >
                        <IconX className='h-4 w-4' />
                      </button>
                    )}
                  </div>
                  <Button
                    onClick={() => setSearchTerm(searchInput.trim())}
                    size='sm'
                  >
                    Хайх
                  </Button>
                </div>
              </div>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(0);
                }}
              >
                <SelectTrigger className='w-[100px]'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 20, 50].map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ActiveFilters
              activeFilters={activeFilters}
              onRemoveFilter={removeFilter}
              onClearAll={clearAllFilters}
            />

            <BinsGroupedTable
              groups={groupedBins}
              selectedBins={selectedBins}
              expandedGroups={expandedGroups}
              onToggleGroup={toggleGroup}
              onToggleSelectBin={toggleSelectBin}
              onToggleSelectGroup={toggleSelectGroup}
              activeFilters={activeFilters}
              sortConfig={sortConfig}
              onSort={handleSort}
              onFilterChange={setActiveFilters}
              hasSearch={Boolean(searchTerm)}
            />

            <TablePagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              hasPrevious={pagination.hasPrevious}
              hasNext={pagination.hasNext}
              onPageChange={setCurrentPage}
            />
          </CardContent>
        </Card>
      </div>

      <BinDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        binIds={Array.from(selectedBins)}
        onDeleted={() => {
          setSelectedBins(new Set());
          refetch();
        }}
      />
    </PageContainer>
  );
}

function BinsGroupedSkeleton() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-6'>
        <h1 className='text-3xl font-bold tracking-tight'>
          Хогийн савны жагсаалт
        </h1>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className='pb-3'>
                <div className='bg-muted h-4 w-24 animate-pulse rounded' />
              </CardHeader>
              <CardContent>
                <div className='bg-muted mb-2 h-8 w-16 animate-pulse rounded' />
                <div className='bg-muted h-3 w-32 animate-pulse rounded' />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
