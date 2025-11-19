'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ResponsiveTable as Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import PageContainer from '@/components/layout/page-container';
import { useBinUsages } from '@/hooks/use-api-data';
import { PaginationParams } from '@/hooks/use-pagination';
import { calculateBatteryPercentage, normalizeStorageLevel } from '@/lib/utils';
import { 
  useTodayUsage, 
  useTodayAverage, 
  useActiveBinsToday, 
  useOverallAverage 
} from '@/hooks/use-transaction-stats';
import { 
  IconSearch,
  IconDownload,
  IconWeight,
  IconClock,
  IconUser,
  IconTrash,
  IconAlertTriangle,
  IconTrendingUp,
  IconTrendingDown,
  IconReceipt,
  IconBattery,
  IconMapPin
} from '@tabler/icons-react';
import { TableHeaderFilter, useTableFilters } from '@/components/ui/table-header-filter';
import { ActiveFilters } from '@/components/ui/active-filters';
import { toast } from 'sonner';
import { authUtils } from '@/lib/auth';

export function TransactionsView() {
  const [currentPage, setCurrentPage] = useState(0); // Changed to 0-based for API
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Enhanced filter system state
  const {
    activeFilters,
    sortConfig,
    removeFilter,
    removeFilterByField,
    clearAllFilters,
    handleSort,
    setActiveFilters
  } = useTableFilters();

  // Create pagination params for the API with backend filters
  const paginationParams: PaginationParams = useMemo(() => {
    const params: any = {
      page: currentPage,
      size: itemsPerPage,
      sortBy: sortConfig?.field || 'createdAt',
      sortDirection: sortConfig?.direction || 'desc'
    };

    // Build search query from advanced filters
    const searchParts: string[] = [];
    
    console.log('🔍 Building search params with filters:', activeFilters);
    
    activeFilters.forEach(filter => {
      let searchPart = '';
      
      console.log(`🔍 Processing filter:`, filter);
      
      switch (filter.operator) {
        case 'is':
          searchPart = `${filter.field}: {"is": "${filter.value}"}`;
          break;
        case 'is_not':
          searchPart = `${filter.field}: {"is_not": "${filter.value}"}`;
          break;
        case 'contains':
          searchPart = `${filter.field}: {"contains": "${filter.value}"}`;
          break;
        case 'greater_than':
          searchPart = `${filter.field}: {"greater_than": "${filter.value}"}`;
          break;
        case 'less_than':
          searchPart = `${filter.field}: {"less_than": "${filter.value}"}`;
          break;  
        case 'between':
          // Handle between logic for range filtering
          if (filter.value && typeof filter.value === 'object' && 'min' in filter.value && 'max' in filter.value) {
            searchPart = `${filter.field}: {"between": {"min": "${filter.value.min}", "max": "${filter.value.max}"}}`;
            console.log(`🔍 Created between search part: ${searchPart}`);
          } else if (filter.value && typeof filter.value === 'object' && 'start' in filter.value && 'end' in filter.value) {
            // Handle date between format
            searchPart = `${filter.field}: {"between": {"start": "${filter.value.start}", "end": "${filter.value.end}"}}`;
            console.log(`🔍 Created date between search part: ${searchPart}`);
          } else if (filter.value && Array.isArray(filter.value) && filter.value.length === 2) {
            // Handle array format [min, max]
            searchPart = `${filter.field}: {"between": {"min": "${filter.value[0]}", "max": "${filter.value[1]}"}}`;
            console.log(`🔍 Created array between search part: ${searchPart}`);
          } else {
            console.log(`🔍 Between filter value not recognized:`, filter.value);
          }
          break;
      }
      
      if (searchPart) {
        searchParts.push(searchPart);
      }
    });

    // Combine existing search with filter search parts
    if (searchParts.length > 0) {
      const filterSearch = searchParts.join('; ');
      if (params.search) {
        params.search = `${params.search} ${filterSearch}`;
      } else {
        params.search = filterSearch;
      }
      console.log('🔍 Final search params:', params.search);
    }

    return params;
  }, [currentPage, itemsPerPage, activeFilters, sortConfig]);

  // Fetch real API data with pagination and backend filters
  const { data: apiBinUsages, loading, error, pagination } = useBinUsages(true, paginationParams);

  // Fetch statistics data
  const { data: todayUsageData, loading: todayUsageLoading } = useTodayUsage();
  const { data: todayAverageData, loading: todayAverageLoading } = useTodayAverage();
  const { data: activeBinsData, loading: activeBinsLoading } = useActiveBinsToday();
  const { data: overallAverageData, loading: overallAverageLoading } = useOverallAverage();

  // Transform API data to match component expectations
  const transformedTransactions = useMemo(() => {
    // Ensure apiBinUsages is an array before calling map
    if (!Array.isArray(apiBinUsages)) {
      return [];
    }
    
    return apiBinUsages.map((usage) => {
      return {
        id: `TXN-${String(usage.id).padStart(4, '0')}`,
        date: new Date(usage.createdAt),
        residentId: usage.cardIdDec || '-', // Use cardId if available, otherwise "Систем шинэчлэл"
        clientName: usage.clientName || '-',
        clientType: usage.clientType || '-',
        clientPhone: usage.clientPhone || '-',
        clientAddress: usage.clientAddress || '-',
        binId: usage.bin?.id?.toString() || '-',
        binName: usage.bin?.binName || '-',
        binLocation: usage.bin?.location || '-',
        storageLevel: usage.storageLevelPercent !== null && usage.storageLevelPercent !== undefined ? usage.storageLevelPercent : 0,
        batteryLevel: usage.batteryLevelPercent !== null && usage.batteryLevelPercent !== undefined ? usage.batteryLevelPercent : 0,
      };
    });
  }, [apiBinUsages]);

  // Apply client-side weight filter only (other filters handled by backend)
  const filteredTransactions = useMemo(() => {
    // Always return data, even when loading new filter results
    return transformedTransactions
  }, [transformedTransactions]);

  // Reset to first page when backend filters change
  React.useEffect(() => {
    setCurrentPage(0);
  }, [activeFilters, sortConfig]);

  const formatDateTime = (dateString: Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('mn-MN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportToExcel = async () => {
    try {
      console.log('🚀 Starting Excel export...');
      
      // Build query parameters from active filters
      const queryParams = new URLSearchParams();
      
      // Add search query if there are active filters
      if (activeFilters.length > 0) {
        const searchParts: string[] = [];
        
        activeFilters.forEach(filter => {
          let searchPart = '';
          
          switch (filter.operator) {
            case 'is':
              searchPart = `${filter.field}: {"is": "${filter.value}"}`;
              break;
            case 'is_not':
              searchPart = `${filter.field}: {"is_not": "${filter.value}"}`;
              break;
            case 'contains':
              searchPart = `${filter.field}: {"contains": "${filter.value}"}`;
              break;
            case 'greater_than':
              searchPart = `${filter.field}: {"greater_than": "${filter.value}"}`;
              break;
            case 'less_than':
              searchPart = `${filter.field}: {"less_than": "${filter.value}"}`;
              break;
            case 'between':
              if (filter.value && typeof filter.value === 'object' && 'min' in filter.value && 'max' in filter.value) {
                searchPart = `${filter.field}: {"between": {"min": "${filter.value.min}", "max": "${filter.value.max}"}}`;
              } else if (filter.value && typeof filter.value === 'object' && 'start' in filter.value && 'end' in filter.value) {
                // Handle date between format
                searchPart = `${filter.field}: {"between": {"start": "${filter.value.start}", "end": "${filter.value.end}"}}`;
              } else if (filter.value && Array.isArray(filter.value) && filter.value.length === 2) {
                // Handle array format [min, max]
                searchPart = `${filter.field}: {"between": {"min": "${filter.value[0]}", "max": "${filter.value[1]}"}}`;
              }
              break;
          }
          
          if (searchPart) {
            searchParts.push(searchPart);
          }
        });
        
        if (searchParts.length > 0) {
          queryParams.append('search', searchParts.join('; '));
        }
      }

      // Add other filter parameters
      if (sortConfig?.field) {
        queryParams.append('sortBy', sortConfig.field);
      }
      if (sortConfig?.direction) {
        queryParams.append('sortDirection', sortConfig.direction);
      }

      const url = `/api/export/transactions?${queryParams.toString()}`;
      console.log('📤 Export URL:', url);
      
      // Get authentication headers
      const authHeaders = authUtils.getAuthHeader();
      console.log('🔐 Auth headers:', authHeaders);
      
      // Fetch the Excel file with authentication
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...authHeaders,
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Export failed:', response.status, errorText);
        throw new Error(`Export failed: ${response.status} - ${errorText}`);
      }

      // Get the Excel file as blob
      const blob = await response.blob();
      console.log('📄 Excel blob received:', blob.size, 'bytes');
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `transactions_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(downloadUrl);
      
      console.log('✅ Export completed successfully');
      toast.success('Excel файл татаж эхэллээ');
    } catch (error) {
      console.error('❌ Export error:', error);
      toast.error('Экспорт хийхэд алдаа гарлаа: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    const totalPages = pagination.totalPages;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 2) {
        for (let i = 0; i <= 3; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages - 1);
      } else if (currentPage >= totalPages - 3) {
        pages.push(0);
        pages.push('ellipsis');
        for (let i = totalPages - 4; i < totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(0);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages - 1);
      }
    }
    
    return pages;
  };

  // Show loading state only on initial load (not for filters)
  const isInitialLoad = loading && !apiBinUsages;
  if (isInitialLoad) {
    return (
      <PageContainer>
        <div className="flex flex-1 flex-col space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Ашиглалтын түүх</h1>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
                  <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  // Show error state
  if (error) {
    return (
      <PageContainer>
        <div className="flex flex-1 flex-col items-center justify-center space-y-4">
          <IconAlertTriangle className="h-12 w-12 text-muted-foreground" />
          <div className="text-center">
            <h2 className="text-lg font-semibold">Алдаа гарлаа</h2>
            <p className="text-muted-foreground">Ашиглалтын мэдээлэл ачааллахад алдаа гарлаа: {error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Дахин оролдох
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ашиглалтын түүх</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={exportToExcel} variant="outline" size="sm">
              <IconDownload className="h-4 w-4 mr-2" />
              Excel татах
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Өнөөдрийн ашиглалт</CardTitle>
                <IconReceipt className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayUsageLoading ? '...' : todayUsageData?.todayCount || 0}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>Нийт ашиглалт: {pagination.totalElements}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Өнөөдрийн дундаж</CardTitle>
                <IconWeight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayAverageLoading ? '...' : todayAverageData?.todayAverage.toFixed(1) || '0.0'}%
              </div>
              <div className="flex items-center gap-1 text-xs">
                {todayAverageData && todayAverageData.percentageChange !== 0 && (
                  <>
                    {todayAverageData.trend === 'up' ? (
                      <IconTrendingUp className="h-3 w-3 text-green-600" />
                    ) : (
                      <IconTrendingDown className="h-3 w-3 text-red-600" />
                    )}
                    <span className={todayAverageData.trend === 'up' ? "text-green-600" : "text-red-600"}>
                      {todayAverageData.trend === 'up' ? '+' : ''}{todayAverageData.percentageChange.toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground">өчигдөртэй харьцуулбал</span>
                  </>
                )}
                {(!todayAverageData || todayAverageData.percentageChange === 0) && (
                  <span className="text-muted-foreground">Өчигдөртэй ижил</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Ашигласан сав</CardTitle>
                <IconTrash className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activeBinsLoading ? '...' : activeBinsData?.todayActiveBins || 0}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>Нийт {activeBinsData?.totalBins || 0} савнаас</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Нийт дундаж</CardTitle>
                <IconUser className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overallAverageLoading ? '...' : overallAverageData?.overallAverage.toFixed(1) || '0.0'}%
              </div>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-muted-foreground">Нийт дундаж дүүргэлтийн түвшин</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Transactions Table */}
        <Card>
        <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle>Ашиглалтын түүх</CardTitle>
                <CardDescription>
                  {pagination.totalElements} ашиглалт олдлоо • {pagination.statistics?.uniqueClientCount || 0} хэрэглэгч • {pagination.statistics?.uniqueBinCount || 0} сав • Хуудас{' '}
                  {currentPage + 1}/{pagination.totalPages}
                </CardDescription>
              </div>
              <div className='flex items-center gap-2'>
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
                    <SelectItem value='5'>5</SelectItem>
                    <SelectItem value='10'>10</SelectItem>
                    <SelectItem value='20'>20</SelectItem>
                    <SelectItem value='50'>50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Active Filter Chips */}
            <ActiveFilters
              activeFilters={activeFilters}
              onRemoveFilter={removeFilter}
              onClearAll={clearAllFilters}
            />

            <div className="rounded-md border overflow-x-auto">
              <div className="w-full overflow-x-auto">
                <Table className="min-w-[900px] w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center w-[150px] relative">
                      <TableHeaderFilter
                        field="createdAt"
                        label="Огноо цаг"
                        type="date"
                        currentSort={sortConfig}
                        activeFilters={activeFilters}
                        onSort={handleSort}
                        onFilterChange={setActiveFilters}
                      />
                    </TableHead>
                    <TableHead className="text-center w-[200px] relative">
                      <TableHeaderFilter
                        field="clientAddress"
                        label="Хаяг"
                        type="text"
                        currentSort={sortConfig}
                        activeFilters={activeFilters}
                        onSort={handleSort}
                        onFilterChange={setActiveFilters}
                      />
                    </TableHead>
                    <TableHead className="text-center w-[120px] relative">
                      <TableHeaderFilter
                        field="clientType"
                        label="Төрөл"
                        type="text"
                        currentSort={sortConfig}
                        activeFilters={activeFilters}
                        onSort={handleSort}
                        onFilterChange={setActiveFilters}
                      />
                    </TableHead>
                    <TableHead className="text-center w-[150px] relative">
                      <TableHeaderFilter
                        field="clientName"
                        label="Нэр"
                        type="text"
                        currentSort={sortConfig}
                        activeFilters={activeFilters}
                        onSort={handleSort}
                        onFilterChange={setActiveFilters}
                      />
                    </TableHead>
                    <TableHead className="text-center w-[120px] relative">
                      <TableHeaderFilter
                        field="binName"
                        label="Сав"
                        type="text"
                        currentSort={sortConfig}
                        activeFilters={activeFilters}
                        onSort={handleSort}
                        onFilterChange={setActiveFilters}
                      />
                    </TableHead>
                    <TableHead className="text-center w-[150px] relative">
                      <TableHeaderFilter
                        field="storageLevelPercent"
                        label="Дүүргэлтийн түвшин"
                        type="number"
                        currentSort={sortConfig}
                        activeFilters={activeFilters}
                        onSort={handleSort}
                        onFilterChange={setActiveFilters}
                      />
                    </TableHead>
                    <TableHead className="text-center w-[150px] relative">
                      <TableHeaderFilter
                        field="batteryLevelPercent"
                        label="Батарейны түвшин"
                        type="number"
                        currentSort={sortConfig}
                        activeFilters={activeFilters}
                        onSort={handleSort}
                        onFilterChange={setActiveFilters}
                      />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <IconClock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {formatDateTime(transaction.date)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <IconMapPin className="h-4 w-4 text-muted-foreground text-center" />
                          <span className="font-medium">{transaction.clientAddress}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {transaction.clientType}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <IconUser className="h-4 w-4 text-muted-foreground text-center" />
                          <span className="font-medium">{transaction.clientName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <IconTrash className="h-4 w-4 text-muted-foreground text-center" />
                          <Link 
                            href={`/dashboard/bins/${transaction.binId}`}
                            className="font-medium text-primary hover:text-primary/80 hover:underline cursor-pointer"
                          >
                            {transaction.binName}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-center">
                          <IconWeight className="h-4 w-4 text-muted-foreground text-center" />
                          <Badge 
                            variant={transaction.storageLevel === -1 ? 'secondary' : 
                                    transaction.storageLevel >= 85 ? 'destructive' : 
                                    transaction.storageLevel >= 50 ? 'default' : 'secondary'}
                          >
                            {transaction.storageLevel === -1 ? 'Data coming soon' : transaction.storageLevel.toFixed(1)}%
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-center">
                          <IconBattery className="h-4 w-4 text-muted-foreground text-center " />
                          <span className="text-sm">{transaction.batteryLevel === -1 ? 'Data coming soon' : transaction.batteryLevel.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <IconSearch className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            {activeFilters.length > 0
                              ? 'Хайлтын үр дүн олдсонгүй' 
                              : 'Ашиглалтын түүх байхгүй'}
                          </p>
                          {activeFilters.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setCurrentPage(0);
                                clearAllFilters();
                              }}
                              className="mt-2"
                            >
                              Шүүлтүүр цэвэрлэх
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 py-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (pagination.hasPrevious) setCurrentPage(currentPage - 1);
                        }}
                        className={!pagination.hasPrevious ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                    
                    {getPageNumbers().map((page, index) => (
                      <PaginationItem key={index}>
                        {page === 'ellipsis' ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(page as number);
                            }}
                            isActive={currentPage === page}
                          >
                            {(page as number) + 1}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (pagination.hasNext) setCurrentPage(currentPage + 1);
                        }}
                        className={!pagination.hasNext ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
} 