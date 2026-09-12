'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  IconAlertTriangle,
  IconDownload,
  IconMapPin,
  IconSearch,
  IconTrendingUp
} from '@tabler/icons-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
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
import { useBins } from '@/hooks/use-api-data';
import { PaginationParams } from '@/hooks/use-pagination';
import { useRolePermissions } from '@/hooks/use-role-permissions';
import { buildFilterSearch } from '@/lib/table-filter-query';
import { downloadXlsx } from '@/lib/export-xlsx';

import { BinDeleteDialog } from './bin-delete-dialog';
import { BinEditDialog } from './bin-edit-dialog';
import { BinStatsCards } from './bin-stats-cards';
import { BinRow, BinsTable } from './bins-table';

const DynamicLeafletMap = dynamic(() => import('@/components/leaflet-map'), {
  ssr: false,
  loading: () => (
    <div className='flex h-96 w-full items-center justify-center rounded-lg border border-gray-200 bg-gray-100'>
      <div className='text-muted-foreground text-center text-sm'>
        Зураг ачаалж байна...
      </div>
    </div>
  )
});

/**
 * Савны жагсаалтын хуудас — зохицуулалт л хийнэ.
 *
 * Нэгдсэн үзүүлэлт, хүснэгт, засах ба устгах цонх тус бүр өөрийн файлтай.
 * Өмнө нь энэ бүхэн 1318 мөрийн нэг функц дотор байв.
 */
export function BinsView() {
  const { canPut, canDelete } = useRolePermissions();
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [editingBin, setEditingBin] = useState<BinRow | null>(null);
  const [deletingBin, setDeletingBin] = useState<BinRow | null>(null);

  // Leaflet нь SSR дээр ажиллахгүй тул зөвхөн клиент дээр зурна.
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  const {
    activeFilters,
    sortConfig,
    removeFilter,
    clearAllFilters,
    handleSort,
    setActiveFilters
  } = useTableFilters();

  const paginationParams: PaginationParams = useMemo(() => {
    const search = buildFilterSearch(activeFilters);
    return {
      page: currentPage,
      size: itemsPerPage,
      sortBy: sortConfig?.field || 'binName',
      sortDirection: sortConfig?.direction || 'desc',
      ...(search ? { search } : {})
    } as PaginationParams;
  }, [currentPage, itemsPerPage, activeFilters, sortConfig]);

  const { data: apiBins, loading, error, pagination, refetch } = useBins(
    true,
    paginationParams
  );

  useEffect(() => {
    setCurrentPage(0);
  }, [activeFilters, sortConfig]);

  const rows: BinRow[] = useMemo(() => {
    if (!Array.isArray(apiBins)) return [];
    return apiBins.map((bin) => ({
      id: bin.id,
      binId: (bin as any).binId,
      binName: bin.binName || 'Савны нэр олгоогүй',
      location: bin.location || 'Байршил тодорхойгүй',
      fillPercentage: bin.storageLevelPercent || 0,
      batteryLevel: bin.batteryLevelPercent || 0,
      clearedAt: bin.clearedAt ?? null,
      active: bin.active ?? false,
      storageLevelBeforeClear: bin.storageLevelBeforeClearPercent || 0,
      coordinates: { lat: bin.latitude || 0, lng: bin.longitude || 0 },
      usageCount: bin.usageCount,
      penetrationsSinceLastClear:
        (bin as any).penetrationsSinceLastClear || 0,
      // Засварын цонх эдгээрийг харуулдаг тул мөрөнд авч явна.
      khoroo: (bin as any).khoroo ?? null,
      phone: (bin as any).phone ?? null,
      details: (bin as any).details ?? null
    }));
  }, [apiBins]);

  const exportToExcel = () => {
    const params = new URLSearchParams();
    const search = buildFilterSearch(activeFilters);
    if (search) params.append('search', search);
    if (sortConfig?.field) params.append('sortBy', sortConfig.field);
    if (sortConfig?.direction) {
      params.append('sortDirection', sortConfig.direction);
    }
    return downloadXlsx('/api/export/bins', params, 'bins_export');
  };

  if (loading && !apiBins) return <BinsViewSkeleton />;

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

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-6'>
        <div className='flex items-center justify-between'>
          <h1 className='text-3xl font-bold tracking-tight'>
            Хогийн савны жагсаалт
          </h1>
          <Button onClick={exportToExcel} variant='outline' size='sm'>
            <IconDownload className='mr-2 h-4 w-4' />
            Excel татах
          </Button>
        </div>

        <BinStatsCards />

        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setViewMode('table')}
            >
              <IconSearch className='mr-2 h-4 w-4' />
              Жагсаалт
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setViewMode('map')}
            >
              <IconMapPin className='mr-2 h-4 w-4' />
              Газрын зураг
            </Button>
          </div>

          {viewMode === 'map' && (
            <Button
              variant={showHeatmap ? 'default' : 'outline'}
              size='sm'
              onClick={() => setShowHeatmap(!showHeatmap)}
            >
              <IconTrendingUp className='mr-2 h-4 w-4' />
              Дулааны зураг
            </Button>
          )}
        </div>

        {viewMode === 'map' && isClient && (
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <IconMapPin className='h-5 w-5' />
                Савны байршил
              </CardTitle>
              <CardDescription>
                {rows.length} савны байршил газрын зураг дээр
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DynamicLeafletMap
                selectedLocation={null}
                multipleLocations={rows.map((row) => ({
                  lat: row.coordinates.lat,
                  lng: row.coordinates.lng,
                  id: row.id.toString(),
                  title: row.binName,
                  fillLevel: row.fillPercentage,
                  batteryLevel: row.batteryLevel,
                  status: row.active ? 'active' : 'inactive'
                }))}
                showHeatmap={showHeatmap}
                height='600px'
                zoom={12}
                readOnly={true}
              />
            </CardContent>
          </Card>
        )}

        {viewMode === 'table' && (
          <Card>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle>Савны жагсаалт</CardTitle>
                  <CardDescription>
                    {pagination.totalElements} сав олдлоо •{' '}
                    {pagination.statistics?.totalActiveBins || 0} идэвхтэй сав •{' '}
                    {pagination.statistics?.overallAvgStorageLevelPercent || 0}%
                    дундаж дүүргэлтийн түвшин •{' '}
                    {pagination.statistics?.overallAvgBatteryLevelPercent || 0}%
                    батарей • Хуудас {currentPage + 1}/{pagination.totalPages}
                  </CardDescription>
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

              <BinsTable
                rows={rows}
                hasActiveFilters={activeFilters.length > 0}
                activeFilters={activeFilters}
                sortConfig={sortConfig}
                onSort={handleSort}
                onFilterChange={setActiveFilters}
                onEdit={setEditingBin}
                onDelete={setDeletingBin}
                canEdit={canPut}
                canDelete={canDelete}
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
        )}
      </div>

      <BinEditDialog
        bin={editingBin}
        onClose={() => setEditingBin(null)}
        onSaved={refetch}
      />

      {/* Устгах нь өмнө нь ямар ч баталгаажуулалтгүй, цэс дээр дармагц
          шууд ажилладаг байв. */}
      <BinDeleteDialog
        open={deletingBin !== null}
        onOpenChange={(open) => !open && setDeletingBin(null)}
        binIds={deletingBin ? [deletingBin.id] : []}
        onDeleted={() => {
          setDeletingBin(null);
          refetch();
        }}
      />
    </PageContainer>
  );
}

function BinsViewSkeleton() {
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
