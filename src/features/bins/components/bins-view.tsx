'use client';

import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,  
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ResponsiveTable as Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext, 
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Dynamically import the entire Leaflet map component to avoid SSR issues
const DynamicLeafletMap = dynamic(() => import('@/components/leaflet-map'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-48 md:h-[400px] bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Газрын зураг ачааллаж байна...</p>
      </div>
    </div>
  )
});
import PageContainer from '@/components/layout/page-container';
import { useBins } from '@/hooks/use-api-data';
import { PaginationParams } from '@/hooks/use-pagination';
// Removed utility functions - now using backend percentage fields
import { authUtils } from '@/lib/auth';
import { 
  useTotalBins, 
  useAverageFillLevel, 
  useWarningBins, 
  useAverageBattery 
} from '@/hooks/use-bin-stats';
import { useRolePermissions } from '@/hooks/use-role-permissions';
import { toast } from 'sonner';
import { 
  IconBattery, 
  IconWifi, 
  IconDoor, 
  IconTrash,
  IconMapPin,
  IconWeight,
  IconSearch,
  IconFilter,
  IconPlus,
  IconEdit,
  IconEye,
  IconDownload,
  IconAlertTriangle,
  IconTrendingUp,
  IconTrendingDown,
  IconCalendar,
  IconX,
  IconClock,
  IconNfc,
  IconChevronUp,
  IconChevronDown,
  IconChevronsDown,
  IconMapPin2,
  IconCurrentLocation,
  IconDotsVertical
} from '@tabler/icons-react';
import { TableHeaderFilter, useTableFilters, ActiveFilter } from '@/components/ui/table-header-filter';
import { ActiveFilters } from '@/components/ui/active-filters';
import { Scroll } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export function BinsView() {
  const router = useRouter();
  const { canPerformAction, canPost, canPut, canDelete } = useRolePermissions();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [editingBin, setEditingBin] = useState<any>(null);
  const [clearingBin, setClearingBin] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(0); // Changed to 0-based for API
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
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
  
  // Form state for creating new bin
  const [newBin, setNewBin] = useState({
    id: '',
    location: '',
    latitude: '',
    longitude: '',
  });
  
  // Map state
  const [selectedLocation, setSelectedLocation] = useState<{lat: number; lng: number} | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Check if we're on the client side (to avoid SSR issues with Leaflet)
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Create pagination and filter params for the API
  const paginationParams: PaginationParams = useMemo(() => {
    const params: any = {
      page: currentPage,
      size: itemsPerPage,
      sortBy: sortConfig?.field || 'binName',
      sortDirection: sortConfig?.direction || 'desc'
    };

    // Build search query from advanced filters
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
          // Handle between logic for range filtering
          if (filter.value && typeof filter.value === 'object' && 'min' in filter.value && 'max' in filter.value) {
            searchPart = `${filter.field}: {"between": {"min": "${filter.value.min}", "max": "${filter.value.max}"}}`;
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
    }
    return params;
  }, [currentPage, itemsPerPage, activeFilters, sortConfig]);

  // Fetch real API data with pagination
  const { data: apiBins, loading, error, pagination } = useBins(true, paginationParams);

  // Fetch statistics data
  const { data: totalBinsData, loading: totalBinsLoading } = useTotalBins();
  const { data: averageFillLevelData, loading: averageFillLevelLoading } = useAverageFillLevel();
  const { data: warningBinsData, loading: warningBinsLoading } = useWarningBins();
  const { data: averageBatteryData, loading: averageBatteryLoading } = useAverageBattery();

  // Transform API data to match component expectations
  const transformedBins = useMemo(() => {
    // Ensure apiBins is an array before mapping
    if (!Array.isArray(apiBins)) {
      return [];
    }
    
    return apiBins.map(bin => {
      return {
          id: bin.id, // Use binId if available, fallback to id
          binName: bin.binName || `Савны нэр олгоогүй`, // Use binName, fallback to generated name
          location: bin.location || `Байршил тодорхойгүй`,
          fillPercentage: bin.storageLevelPercent || 0, // Use backend percentage field
          batteryLevel: bin.batteryLevelPercent || 0, // Use backend percentage field
          clearedAt: bin.clearedAt,
          createdAt: bin.createdAt,
          updatedAt: bin.updatedAt,
          active: bin.active, // Use 'active' field from API response
          storageLevelBeforeClear: bin.storageLevelBeforeClearPercent || 0, // Use backend percentage field
          coordinates: {
            lat: bin.latitude || 0,
            lng: bin.longitude || 0
          },
          usageCount: bin.usageCount, // Add usage count to bin data
          penetrationsSinceLastClear: (bin as any).penetrationsSinceLastClear || 0 // Add penetrations since last clear
        };
    });
  }, [apiBins]);

  // Use API pagination data - server-side filtering is now handled by the API
  const paginatedBins = transformedBins;

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [activeFilters, sortConfig]);

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
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

      const url = `/api/export/bins?${queryParams.toString()}`;
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
      link.download = `bins_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      
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

  // Get current location
  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          setSelectedLocation({ lat, lng });
          setNewBin(prev => ({
            ...prev,
            latitude: lat.toString(),
            longitude: lng.toString()
          }));

          reverseGeocode(lat, lng).then(address => {
            if (address) {
              setNewBin(prev => ({
                ...prev,
                location: address
              }));
            }
          });
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Байршил авахад алдаа гарлаа');
          setIsLoadingLocation(false);
        }
      );
    } else {
      alert('Таны браузер байршил тодорхойлохыг дэмжихгүй байна');
      setIsLoadingLocation(false);
    }
  };

  // Refactor reverseGeocode to return address
  const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=mn,en`
      );
      const data = await response.json();
      return data?.display_name || null;
    } catch (error) {
      return null;
    }
  };

  // Handle clearing a bin
  const handleClearBin = async () => {
    if (!clearingBin) return;
    
    try {
      const response = await fetch(`/api/bins/${clearingBin.id}/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fillLevelBeforeClear: clearingBin.fillPercentage,
          penetrationCount: clearingBin.usageCount
        }),
      });

      if (response.ok) {
        setIsClearDialogOpen(false);
        setClearingBin(null);
        // Refresh the page to get updated data
        window.location.reload();
      } else {
        console.error('Failed to clear bin');
      }
    } catch (error) {
      console.error('Error clearing bin:', error);
    }
  };

  // Handler for deleting bin
  const handleDeleteBin = async (binId: number) => {
    if (!confirm('Энэ савыг устгахдаа итгэлтэй байна уу?')) return;

    try {
      // Get authentication headers
      const authHeaders = authUtils.getAuthHeader();
      console.log('🗑️ Delete bin - Auth headers being sent:', authHeaders);
      
      const response = await fetch(`/api/bins/${binId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Bin deleted successfully:', result);
        toast.success(`Сав амжилттай устгагдлаа. ${result.deletedUsages} ашиглалт, ${result.deletedClearings} цэвэрлэлт устгагдлаа`);
        window.location.reload();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Delete bin failed:', response.status, errorData);
        toast.error(`Сав устгахад алдаа гарлаа: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Delete bin error:', error);
      toast.error(`Сав устгахад алдаа гарлаа: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Use statistics from API
  const activeBins = totalBinsData?.activeBins || 0;
  const totalBins = totalBinsData?.totalBins || 0;
  const avgFillLevel = averageFillLevelData?.averageFillLevel || 0;
  const criticalBins = warningBinsData?.criticalBins || 0;
  const warningBins = warningBinsData?.warningBins || 0;
  const avgBatteryLevel = averageBatteryData?.averageBatteryLevel || 0;

  // Show loading state only on initial load
  const isInitialLoad = loading && !apiBins;
  if (isInitialLoad) {
    return (
      <PageContainer>
        <div className="flex flex-1 flex-col space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Хогийн савны жагсаалт</h1>
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
            <p className="text-muted-foreground">Мэдээлэл ачааллахад алдаа гарлаа: {error}</p>
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
            <h1 className="text-3xl font-bold tracking-tight">Хогийн савны жагсаалт</h1>
          </div>
          <div className="flex items-center gap-2">

            {/* Edit Dialog */}
            {isEditDialogOpen && editingBin && (
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Сав засах</DialogTitle>
                    <DialogDescription>Савны мэдээллийг засах</DialogDescription>
                  </DialogHeader>
                  <Tabs defaultValue="map" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="map" className="flex items-center gap-2">
                        <IconMapPin2 className="h-4 w-4" />
                        Газрын зураг
                      </TabsTrigger>
                      <TabsTrigger value="manual" className="flex items-center gap-2">
                        <IconCurrentLocation className="h-4 w-4" />
                        Гараар оруулах
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="map" className="space-y-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">
                            Сав байрлуулах байршлыг сонгоно уу
                          </Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={getCurrentLocation}
                            disabled={isLoadingLocation}
                            className="flex items-center gap-2"
                          >
                            <IconCurrentLocation className="h-4 w-4" />
                            {isLoadingLocation ? 'Олж байна...' : 'Миний байршил'}
                          </Button>
                        </div>
                        <DynamicLeafletMap
                          selectedLocation={editingBin.coordinates}
                          onLocationSelect={async (lat, lng) => {
                            setEditingBin((prev: any) => ({
                              ...prev,
                              coordinates: { lat, lng },
                              latitude: lat.toString(),
                              longitude: lng.toString(),
                              location: 'Байршил тодорхойгүй (ачааллаж байна...)'
                            }));
                            const address = await reverseGeocode(lat, lng);
                            if (address) {
                              setEditingBin((prev: any) => ({
                                ...prev,
                                location: address
                              }));
                            }
                          }}
                          readOnly={false}
                          height="300px"
                          zoom={15}
                        />
                      </div>
                      <div className="grid gap-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-id" className="text-right">
                            Сав ID
                          </Label>
                          <Input
                            disabled={true}
                            id="edit-id"
                            value={editingBin.id}
                            onChange={(e) => setEditingBin({ ...editingBin, id: e.target.value })}
                            placeholder="BIN001"
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-name" className="text-right">
                            Савны нэр
                          </Label>
                          <Input
                            id="edit-name"
                            value={editingBin.binName || ''}
                            onChange={(e) => setEditingBin({ ...editingBin, binName: e.target.value })}
                            placeholder="Савны нэр"
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-location" className="text-right">
                            Байршил
                          </Label>
                          <Textarea
                            id="edit-location"
                            value={editingBin.location}
                            onChange={(e) => setEditingBin({ ...editingBin, location: e.target.value })}
                            placeholder="Байршлын дэлгэрэнгүй мэдээлэл"
                            className="col-span-3"
                            rows={2}
                          />
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="manual" className="space-y-4">
                      <div className="grid gap-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-id-manual" className="text-right">
                            Сав ID
                          </Label>
                          <Input
                            disabled={true}
                            id="edit-id-manual"
                            value={editingBin.id}
                            onChange={(e) => setEditingBin({ ...editingBin, id: e.target.value })}
                            placeholder="BIN001"
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-name-manual" className="text-right">
                            Савны нэр
                          </Label>
                          <Input
                            id="edit-name-manual"
                            value={editingBin.binName || ''}
                            onChange={(e) => setEditingBin({ ...editingBin, binName: e.target.value })}
                            placeholder="Савны нэр"
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-location-manual" className="text-right">
                            Байршил
                          </Label>
                          <Textarea
                            id="edit-location-manual"
                            value={editingBin.location}
                            onChange={(e) => setEditingBin({ ...editingBin, location: e.target.value })}
                            placeholder="Байршлын дэлгэрэнгүй мэдээлэл"
                            className="col-span-3"
                            rows={2}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-latitude-manual" className="text-right">
                            Өргөрөг
                          </Label>
                          <Input
                            id="edit-latitude-manual"
                            type="number"
                            step="any"
                            value={editingBin.latitude || editingBin.coordinates.lat}
                            onChange={(e) => {
                              setEditingBin({
                                ...editingBin,
                                latitude: e.target.value,
                                coordinates: {
                                  lat: parseFloat(e.target.value),
                                  lng: editingBin.coordinates.lng
                                }
                              });
                            }}
                            placeholder="47.9211"
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-longitude-manual" className="text-right">
                            Уртраг
                          </Label>
                          <Input
                            id="edit-longitude-manual"
                            type="number"
                            step="any"
                            value={editingBin.longitude || editingBin.coordinates.lng}
                            onChange={(e) => {
                              setEditingBin({
                                ...editingBin,
                                longitude: e.target.value,
                                coordinates: {
                                  lat: editingBin.coordinates.lat,
                                  lng: parseFloat(e.target.value)
                                }
                              });
                            }}
                            placeholder="106.9154"
                            className="col-span-3"
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                      Цуцлах
                    </Button>
                    <Button
                      type="button"
                      onClick={async () => {
                        if (!editingBin?.id) return;
                        try {
                          const authHeaders = authUtils.getAuthHeader();
                          console.log('🔧 Bins view - Auth headers being sent:', authHeaders);
                          
                          const response = await fetch(`/api/bins/${editingBin.id}`, {
                            method: 'PUT',
                            headers: {
                              'Content-Type': 'application/json',
                              ...authHeaders,
                            }, 
                            body: JSON.stringify({
                              binId: editingBin.binId || editingBin.id,
                              binName: editingBin.binName,
                              location: editingBin.location,
                              latitude: parseFloat(editingBin.latitude || editingBin.coordinates.lat),
                              longitude: parseFloat(editingBin.longitude || editingBin.coordinates.lng),
                              batteryLevel: editingBin.batteryLevel || '12V',
                            }),
                          });
                          if (response.ok) {
                            setIsEditDialogOpen(false);
                            setEditingBin(null);
                            window.location.reload();
                          } else {
                            throw new Error('Failed to update bin');
                          }
                        } catch (error) {
                          alert('Сав засахад алдаа гарлаа');
                        }
                      }}
                    >
                      Хадгалах
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            <Button onClick={exportToExcel} variant="outline" size="sm">
              <IconDownload className="h-4 w-4 mr-2" />
              Excel татах
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader className="pb-3 relative flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Нийт сав</CardTitle>
              <IconTrash className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalBins}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="text-green-600">{activeBins} Идэвхтэй</span>
                <span>•</span>
                <span className="text-gray-600">{totalBins - activeBins} Идэвхгүй</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 relative">
              <CardTitle className="text-sm font-medium">Дундаж дүүргэлтийн түвшин</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgFillLevel.toFixed(2)}%</div>
              <div className="flex items-center gap-1 text-xs">
                {averageFillLevelData?.trend.isPositive ? (
                  <IconTrendingUp className="h-3 w-3 text-red-600" />
                ) : (
                  <IconTrendingDown className="h-3 w-3 text-green-600" />
                )}
                <span className={averageFillLevelData?.trend.isPositive ? 'text-red-600' : 'text-green-600'}>
                  {averageFillLevelData?.trend.isPositive ? 'анхааруулга' : 'хэвийн'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Анхааруулга</CardTitle>
                <IconAlertTriangle className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{criticalBins + warningBins}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="text-red-600">{criticalBins} дүүрэн</span>
                <span>•</span>
                <span className="text-yellow-600">{warningBins} анхааруулга</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 relative flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Дундаж батарей</CardTitle>
              <IconBattery className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgBatteryLevel.toFixed(2)}%</div>
              <div className="flex items-center gap-1 text-xs">
                {averageBatteryData?.trend.isPositive ? (
                  <IconTrendingDown className="h-3 w-3 text-red-600" />
                ) : (
                  <IconTrendingUp className="h-3 w-3 text-green-600" />
                )}
                <span className={averageBatteryData?.trend.isPositive ? 'text-red-600' : 'text-green-600'}>
                  {averageBatteryData?.trend.isPositive ? 'анхааруулга' : 'хэвийн'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <IconSearch className="h-4 w-4 mr-2" />
              Жагсаалт
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('map')}
            >
              <IconMapPin className="h-4 w-4 mr-2" />
              Газрын зураг
            </Button>
          </div>
          
          {viewMode === 'map' && (
            <div className="flex items-center gap-2">
              <Button
                variant={showHeatmap ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowHeatmap(!showHeatmap)}
              >
                <IconTrendingUp className="h-4 w-4 mr-2" />
                Дулааны зураг
              </Button>
            </div>
          )}
        </div>

        {/* Map View */}
        {viewMode === 'map' && isClient && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconMapPin className="h-5 w-5" />
                Савны байршил
              </CardTitle>
              <CardDescription>
                {paginatedBins.length} савны байршил газрын зураг дээр
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DynamicLeafletMap
                selectedLocation={null}
                multipleLocations={paginatedBins.map(bin => ({
                  lat: bin.coordinates.lat,
                  lng: bin.coordinates.lng,
                  id: bin.id.toString(),
                  title: bin.binName,
                  fillLevel: bin.fillPercentage,
                  batteryLevel: bin.batteryLevel,
                  status: bin.active ? 'active' : 'inactive'
                }))}
                showHeatmap={showHeatmap}
                height="600px"
                zoom={12}
                readOnly={true}
              />
            </CardContent>
          </Card>
        )}

        {/* Bins Table */}
        {viewMode === 'table' && (
          <Card>
            <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle>Савны жагсаалт</CardTitle>
                <CardDescription>
                  {pagination.totalElements} сав олдлоо • {pagination.statistics?.totalActiveBins || 0} идэвхтэй сав • {pagination.statistics?.overallAvgStorageLevelPercent || 0}% дундаж дүүргэлтийн түвшин • {pagination.statistics?.overallAvgBatteryLevelPercent || 0}% батарей • Хуудас{' '}
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
                <ScrollArea className="w-full">
                  <Table className="w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center w-[150px] relative">
                        <TableHeaderFilter
                          field="binName"
                          label="Нэр"
                          type="text"
                          currentSort={sortConfig}
                          activeFilters={activeFilters}
                          onSort={handleSort}
                          onFilterChange={setActiveFilters}
                        />
                      </TableHead>
                      <TableHead className="text-center w-[100px] relative">
                        <TableHeaderFilter
                          field="isActive"
                          label="Холболт"
                          type="boolean"
                          currentSort={sortConfig}
                          activeFilters={activeFilters}
                          onSort={handleSort}
                          onFilterChange={setActiveFilters}
                        />
                      </TableHead>
                      <TableHead className="text-center w-[120px] relative">
                        <TableHeaderFilter
                          field="storageLevelPercent"
                          label="Дүүргэлт (%)"
                          type="number"
                          currentSort={sortConfig}
                          activeFilters={activeFilters}
                          onSort={handleSort}
                          onFilterChange={setActiveFilters}
                        />
                      </TableHead>
                      <TableHead className="text-center w-[100px] relative">
                        <TableHeaderFilter
                          field="penetrationsSinceLastClear"
                          label="Сүүлийн хоослолтоос"
                          type="number"
                          currentSort={sortConfig}
                          activeFilters={activeFilters}
                          onSort={handleSort}
                          onFilterChange={setActiveFilters}
                        />
                      </TableHead>
                      <TableHead className="text-center w-[120px] relative">
                        <TableHeaderFilter
                          field="batteryLevelPercent"
                          label="Батарей"
                          type="number"
                          currentSort={sortConfig}
                          activeFilters={activeFilters}
                          onSort={handleSort}
                          onFilterChange={setActiveFilters}
                        />
                      </TableHead>
                      <TableHead className="text-center w-[150px] relative">
                        <TableHeaderFilter
                          field="clearedAt"
                          label="Хоослосон огноо"
                          type="date"
                          currentSort={sortConfig}
                          activeFilters={activeFilters}
                          onSort={handleSort}
                          onFilterChange={setActiveFilters}
                        />
                      </TableHead>
                      <TableHead className="text-center w-[150px] relative">
                        <TableHeaderFilter
                          field="storageLevelBeforeClearPercent"
                          label="Хоослох үеийн дүүргэлт"
                          type="number"
                          currentSort={sortConfig}
                          activeFilters={activeFilters}
                          onSort={handleSort}
                          onFilterChange={setActiveFilters}
                        />
                      </TableHead>
                      <TableHead className="text-center w-[200px] relative">
                        <TableHeaderFilter
                          field="location"
                          label="Байршил"
                          type="text"
                          currentSort={sortConfig}
                          activeFilters={activeFilters}
                          onSort={handleSort}
                          onFilterChange={setActiveFilters}
                        />
                      </TableHead>
                      <TableHead className="text-right w-[80px]">Үйлдэл</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedBins.map((bin) => (
                      <TableRow 
                        key={bin.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/dashboard/bins/${bin.id}`)}
                      >
                        <TableCell className="font-medium">
                          <div 
                            className="cursor-pointer hover:bg-muted/30 px-2 py-1 rounded transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(bin.binName);
                              toast.success('Савны нэр хуулагдлаа');
                            }}
                            title="Хуулахын тулд дарна уу"
                          >
                            {bin.binName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={bin.active ? 'default' : 'secondary'}>
                            <IconWifi className="h-3 w-3 mr-1" />
                            {bin.active ? 'Идэвхтэй' : 'Идэвхгүй'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress value={bin.fillPercentage} className="w-16 h-2" />
                            <span className="text-sm font-medium">{bin.fillPercentage.toFixed(2)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{(bin as any).penetrationsSinceLastClear || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{bin.batteryLevel.toFixed(2)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {bin.clearedAt ? formatDate(bin.clearedAt) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress value={bin.storageLevelBeforeClear} className="w-16 h-2" />
                            <span className="text-sm font-medium">{bin.storageLevelBeforeClear.toFixed(2)}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          <div 
                            className="cursor-pointer hover:bg-muted/30 px-2 py-1 rounded transition-colors truncate"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(bin.location);
                              toast.success('Байршил хуулагдлаа');
                            }}
                            title={`${bin.location} - Хуулахын тулд дарна уу`}
                          >
                            {bin.location}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <IconDotsVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dashboard/bins/${bin.id}`);
                              }}>
                                <IconEye className="h-4 w-4 mr-2" />
                                Харах
                              </DropdownMenuItem>
                              {canPut && (
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingBin(bin);
                                  setIsEditDialogOpen(true);
                                }}>
                                  <IconEdit className="h-4 w-4 mr-2" />
                                  Засах
                                </DropdownMenuItem>
                              )}
                              {canDelete && (
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteBin(bin.id);
                                  }}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <IconTrash className="h-4 w-4 mr-2" />
                                  Устгах
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}

                    {paginatedBins.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <IconSearch className="h-8 w-8 text-muted-foreground" />
                            <p className="text-muted-foreground">
                              {activeFilters.length > 0
                                ? 'Хайлтын үр дүн олдсонгүй' 
                                : 'Бүртгэлтэй сав байхгүй'}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                </ScrollArea>
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
        )}



        {/* Clear Bin Dialog */}
        <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Хогийн сав цэвэрлэх</DialogTitle>
              <DialogDescription>
                Сав #{clearingBin?.id} - {clearingBin?.location} цэвэрлэх үйлдлийг баталгаажуулна уу?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Одоогийн дүүргэлт</Label>
                  <div className="text-lg font-semibold">{clearingBin?.fillPercentage?.toFixed(2)}%</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Нэвтрэлтийн тоо</Label>
                  <div className="text-lg font-semibold">{clearingBin?.usageCount}</div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsClearDialogOpen(false)}>
                Цуцлах
              </Button>
              <Button onClick={handleClearBin} className="bg-red-600 hover:bg-red-700">
                Цэвэрлэх
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageContainer>
  );
} 
