'use client';

import { useState, useEffect } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  ResponsiveTable as Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { mn } from 'date-fns/locale';
import { authUtils } from '@/lib/auth';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis
} from '@/components/ui/pagination';
import PageContainer from '@/components/layout/page-container';
// Removed utility functions - now using backend percentage fields
import {
  IconBattery,
  IconWifi,
  IconDoor,
  IconTrash,
  IconMapPin,
  IconWeight,
  IconClock,
  IconNfc,
  IconAlertTriangle,
  IconArrowLeft,
  IconEdit,
  IconCalendar,
  IconActivity,
  IconTrendingUp,
  IconTrendingDown,
  IconCurrentLocation
} from '@tabler/icons-react';
import { Delete, Trash } from 'lucide-react';
import dynamic from 'next/dynamic';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

// Dynamically import LeafletMap to avoid SSR issues
const LeafletMap = dynamic(() => import('@/components/leaflet-map'), {
  ssr: false,
  loading: () => (
    <div className='flex h-48 w-full items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-100 md:h-[300px]'>
      <div className='text-muted-foreground text-center text-sm'>
        Зураг ачаалж байна...
      </div>
    </div>
  )
});

interface BinDetailViewProps {
  id: string;
}

export function BinDetailView({ id }: BinDetailViewProps) {
  const router = useRouter();
  const [bin, setBin] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [binClearings, setBinClearings] = useState<any[]>([]);
  const [dateFilter, setDateFilter] = useState<'7' | '30' | 'all'>('30');
  const [currentPage, setCurrentPage] = useState(0); // Changed to 0-based for consistency
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBin, setEditingBin] = useState<any>(null);
  const [editField, setEditField] = useState<
    'location' | 'coordinates' | 'type' | 'serialNumber'
  >('location');

  useEffect(() => {
    const fetchBinDetails = async () => {
      try {
        // Fetch bin details and clearings in parallel
        const [binResponse, clearingsResponse] = await Promise.all([
          fetch(`/api/bins/${id}`, {
            headers: authUtils.getAuthHeader()
          }),
          fetch(`/api/bins/${id}/clearings`, {
            headers: authUtils.getAuthHeader()
          })
        ]);

        if (!binResponse.ok) {
          if (binResponse.status === 404) {
            setError('Сав олдсонгүй');
            return;
          }
          throw new Error('Failed to fetch bin data');
        }

        const specificBin = await binResponse.json();
        const clearingsData = await clearingsResponse.json();

        // Handle different response structures
        const clearings = clearingsData.content || clearingsData || [];

        if (specificBin) {
          // Use the usageCount from the bin response directly
          const totalUsages = specificBin.usageCount || 0;
          let penetration = 0;

          if (clearings.length > 0 && totalUsages > 0) {
            // Calculate penetration based on total usages and number of clearings
            // Simple calculation: average usages per clearing period
            const averageUsagesPerPeriod = totalUsages / (clearings.length + 1); // +1 for current period
            // Scale to percentage (assuming 20 uses per clearing period = 100% penetration)
            penetration = Math.min((averageUsagesPerPeriod / 20) * 100, 100);
          }

          // Transform the data to match the frontend expectations
          setBin({
            id: specificBin.id,
            binId: specificBin.binId,
            khoroo: specificBin.khoroo || null,
            binName: specificBin.binName || `Савны нэр олгоогүй`,
            location: specificBin.location || 'Байршил тодорхойгүй',
            fillPercentage: specificBin.storageLevelPercent || 0,
            batteryLevel: specificBin.batteryLevelPercent || 0,
            active: specificBin.active || specificBin.isActive || false, // Use 'active' field, fallback to 'isActive'
            coordinates: {
              lat: specificBin.latitude || 0,
              lng: specificBin.longitude || 0
            },
            clearedAt: specificBin.clearedAt
              ? new Date(specificBin.clearedAt)
              : null,
            storageLevelBeforeClear:
              specificBin.storageLevelBeforeClearPercent || 0,
            createdAt: new Date(specificBin.createdAt),
            penetration: penetration,
            totalUsages: totalUsages,
            lastEmptied: specificBin.lastEmptied
              ? new Date(specificBin.lastEmptied)
              : new Date(specificBin.createdAt),
            lastEmptyFillLevel: specificBin.lastEmptyFillLevel || 0,
            type: specificBin.type || 'Стандарт',
            serialNumber:
              specificBin.serialNumber ||
              specificBin.binId ||
              `SN${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
            installDate: specificBin.installDate
              ? new Date(specificBin.installDate)
              : new Date(specificBin.createdAt)
          });

          // Set clearings data
          setBinClearings(clearings);
        } else {
          setError('Сав олдсонгүй');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Алдаа гарлаа');
      } finally {
        setLoading(false);
      }
    };

    fetchBinDetails();
  }, [id]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('mn-MN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatRelativeDate = (date: Date) => {
    return date.toLocaleString();
  };

  const getBinStatusColor = (storageLevel: number) => {
    if (storageLevel >= 90) return 'bg-red-500';
    if (storageLevel >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getBinStatusText = (storageLevel: number) => {
    if (storageLevel >= 90) return 'Дүүрэн';
    if (storageLevel >= 70) return 'Анхааруулга';
    return 'Хэвийн';
  };

  // Filter clearings based on date range
  const getFilteredClearings = () => {
    let filtered = binClearings;

    // Apply date range filter if dates are selected
    if (startDate && endDate) {
      filtered = filtered.filter((clearing) => {
        const clearingDate = new Date(clearing.clearedAt);
        return clearingDate >= startDate && clearingDate <= endDate;
      });
    } else if (dateFilter !== 'all') {
      const days = parseInt(dateFilter);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      filtered = filtered.filter(
        (clearing) => new Date(clearing.clearedAt) >= cutoffDate
      );
    }

    // Sort by date (most recent first)
    filtered = filtered.sort(
      (a, b) =>
        new Date(b.clearedAt).getTime() - new Date(a.clearedAt).getTime()
    );

    return filtered;
  };

  // Get paginated data
  const getPaginatedClearings = () => {
    const filtered = getFilteredClearings();
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const totalFilteredClearings = getFilteredClearings().length;
  const totalPages = Math.ceil(totalFilteredClearings / itemsPerPage);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

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

  // Handler to open edit dialog with current bin data
  const openEditDialog = () => {
    if (!bin) return;
    setEditingBin({ ...bin });
    setEditField('location');
    setIsEditDialogOpen(true);
  };

  // Handler to save the edited field
  const handleSaveEditBin = async () => {
    if (!editingBin?.id) return;
    let updatePayload: any = {};
    // Always include binId
    updatePayload.binId = editingBin.binId || editingBin.id;
    if (editField === 'location') updatePayload.location = editingBin.location;
    if (editField === 'coordinates') {
      updatePayload.latitude = editingBin.coordinates.lat;
      updatePayload.longitude = editingBin.coordinates.lng;
    }
    if (editField === 'type') updatePayload.type = editingBin.type;
    if (editField === 'serialNumber')
      updatePayload.serialNumber = editingBin.serialNumber;
    try {
      const authHeaders = authUtils.getAuthHeader();
      console.log('🔧 Bin update - Auth headers being sent:', authHeaders);

      const response = await fetch(`/api/bins/${editingBin.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify(updatePayload)
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
  };

  if (loading) {
    return (
      <PageContainer>
        <div className='flex flex-1 flex-col space-y-6'>
          <div className='flex items-center gap-4'>
            <Button variant='ghost' onClick={() => router.back()}>
              <IconArrowLeft className='mr-2 h-4 w-4' />
            </Button>
            <div>
              <div className='bg-muted h-8 w-48 animate-pulse rounded' />
            </div>
          </div>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader>
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

  if (error || !bin) {
    return (
      <PageContainer>
        <div className='flex flex-1 flex-col items-center justify-center space-y-4'>
          <IconAlertTriangle className='text-muted-foreground h-12 w-12' />
          <div className='text-center'>
            <h2 className='text-lg font-semibold'>Алдаа гарлаа</h2>
            <p className='text-muted-foreground'>{error}</p>
            <Button onClick={() => router.back()} className='mt-4'>
              <IconArrowLeft className='mr-2 h-4 w-4' />
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-6 overflow-y-auto'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <Button variant='ghost' onClick={() => router.back()}>
              <IconArrowLeft className='mr-2 h-4 w-4' />
            </Button>
            <div>
              <h1 className='text-3xl font-bold tracking-tight'>
                <span
                  className='hover:bg-muted/30 cursor-pointer rounded px-2 py-1 transition-colors'
                  onClick={() => {
                    navigator.clipboard.writeText(bin.binName);
                    toast.success('Савны нэр хуулагдлаа');
                  }}
                  title='Хуулахын тулд дарна уу'
                >
                  {bin.binName}
                </span>{' '}
                хогийн савны дэлгэрэнгүй
              </h1>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Badge
              variant={bin.fillPercentage < 90 ? 'default' : 'destructive'}
              className='p-[7px]'
            >
              <div
                className={`mr-2 h-2 w-2 rounded-full ${getBinStatusColor(bin.fillPercentage)}`}
              />
              {getBinStatusText(bin.fillPercentage)}
            </Badge>
            <Button size='sm' onClick={openEditDialog}>
              <IconEdit className='mr-2 h-4 w-4' />
              Засах
            </Button>
          </div>
        </div>

        {/* Main Status Cards */}
        <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-3'>
          <Card>
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-sm font-medium'>
                  Дүүргэлтийн түвшин
                </CardTitle>
                <IconWeight className='text-muted-foreground h-4 w-4' />
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {bin.fillPercentage.toFixed(2)}%
              </div>
              <div className='flex items-center gap-1 text-xs'>
                {bin.fillPercentage >= 90 ? (
                  <IconTrendingDown className='h-3 w-3 text-red-600' />
                ) : (
                  <IconTrendingUp className='h-3 w-3 text-green-600' />
                )}
                <span
                  className={
                    bin.fillPercentage >= 90 ? 'text-red-600' : 'text-green-600'
                  }
                >
                  {bin.fillPercentage >= 90 ? 'дүүрэн' : 'хэвийн'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-sm font-medium'>
                  Батарейн түвшин
                </CardTitle>
                <IconBattery className='text-muted-foreground h-4 w-4' />
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {bin.batteryLevel.toFixed(2)}%
              </div>
              <div className='text-muted-foreground flex items-center gap-1 text-xs'>
                <span
                  className={bin.active ? 'text-green-600' : 'text-gray-600'}
                >
                  {bin.active ? 'Идэвхтэй' : 'Идэвхгүй'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-sm font-medium'>
                  Ашиглалтын статистик
                </CardTitle>
                <IconActivity className='text-muted-foreground h-4 w-4' />
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{bin.totalUsages}</div>
              <div className='text-muted-foreground flex items-center gap-1 text-xs'>
                <span className='text-purple-600'>нэвтрэлт</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info Cards */}
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          {/* Technical Details */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <IconWeight className='h-5 w-5' />
                Техникийн мэдээлэл
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-sm'>
                  Серийн дугаар:
                </span>
                <span
                  className='hover:bg-muted/30 cursor-pointer rounded px-2 py-1 font-mono text-sm font-medium transition-colors'
                  onClick={() => {
                    const serialNumber =
                      bin.serialNumber.toUpperCase() === 'UNKNOWN'
                        ? 'SN' + bin.id
                        : bin.serialNumber;
                    navigator.clipboard.writeText(serialNumber);
                    toast.success('Серийн дугаар хуулагдлаа');
                  }}
                  title='Хуулахын тулд дарна уу'
                >
                  {bin.serialNumber.toUpperCase() === 'UNKNOWN'
                    ? 'SN' + bin.id
                    : bin.serialNumber}
                </span>
              </div>
              <Separator />
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-sm'>
                  Суурилуулсан огноо:
                </span>
                <span className='text-sm font-medium'>
                  {formatRelativeDate(bin.installDate)}
                </span>
              </div>
              <Separator />
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-sm'>
                  Сүүлийн хоослох:
                </span>
                <span className='text-sm font-medium'>
                  {bin.clearedAt
                    ? formatRelativeDate(bin.clearedAt)
                    : 'Хоослолт хийгдээгүй'}
                </span>
              </div>
              <Separator />
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-sm'>
                  Координат:
                </span>
                <span
                  className='text-muted-foreground hover:bg-muted/30 cursor-pointer rounded px-2 py-1 font-mono text-xs transition-colors'
                  onClick={() => {
                    const coordinates = `${bin.coordinates.lat.toFixed(4)}, ${bin.coordinates.lng.toFixed(4)}`;
                    navigator.clipboard.writeText(coordinates);
                    toast.success('Координат хуулагдлаа');
                  }}
                  title='Хуулахын тулд дарна уу'
                >
                  {bin.coordinates.lat.toFixed(4)},{' '}
                  {bin.coordinates.lng.toFixed(4)}
                </span>
              </div>
              <Separator />
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-sm'>Байршил:</span>
                <span
                  className='text-muted-foreground hover:bg-muted/30 cursor-pointer rounded px-2 py-1 font-mono text-xs transition-colors'
                  onClick={() => {
                    navigator.clipboard.writeText(bin.location);
                    toast.success('Байршил хуулагдлаа');
                  }}
                  title='Хуулахын тулд дарна уу'
                >
                  {bin.location}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Interactive Map */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <IconMapPin className='h-5 w-5' />
                Байршлын зураг
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='z-10 h-80 w-full overflow-hidden rounded-lg border border-gray-200'>
                {!isEditDialogOpen && (
                  <LeafletMap
                    selectedLocation={{
                      lat: bin.coordinates.lat,
                      lng: bin.coordinates.lng,
                      id: bin.id.toString(),
                      title: bin.binName,
                      fillLevel: bin.fillPercentage,
                      batteryLevel: bin.batteryLevel,
                      status: bin.active ? 'active' : 'inactive'
                    }}
                    readOnly={true}
                    height='300px'
                    zoom={15}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bin Clearing History Table */}
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle>Хоослох түүх</CardTitle>
              <div className='flex items-center gap-4'>
                {/* Date Range Picker */}
                <div className='flex items-center gap-2'>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        size='sm'
                        className='w-[200px] justify-start text-left font-normal'
                      >
                        <CalendarIcon className='mr-2 h-4 w-4' />
                        {startDate ? (
                          endDate ? (
                            <>
                              {format(startDate, 'LLL dd, y', { locale: mn })} -{' '}
                              {format(endDate, 'LLL dd, y', { locale: mn })}
                            </>
                          ) : (
                            format(startDate, 'LLL dd, y', { locale: mn })
                          )
                        ) : (
                          <span>Огноо сонгох</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0' align='start'>
                      <Calendar
                        initialFocus
                        mode='range'
                        defaultMonth={startDate}
                        selected={{
                          from: startDate,
                          to: endDate
                        }}
                        onSelect={(range) => {
                          setStartDate(range?.from);
                          setEndDate(range?.to);
                          setCurrentPage(0);
                        }}
                        numberOfMonths={2}
                        locale={mn}
                      />
                    </PopoverContent>
                  </Popover>
                  {(startDate || endDate) && (
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => {
                        setStartDate(undefined);
                        setEndDate(undefined);
                        setCurrentPage(0);
                      }}
                    >
                      Цэвэрлэх
                    </Button>
                  )}
                </div>

                {/* Rows Per Page Selection */}
                <div className='flex items-center gap-2'>
                  <span className='text-muted-foreground text-sm'>Мөр:</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(parseInt(value));
                      setCurrentPage(0);
                    }}
                  >
                    <SelectTrigger className='w-[70px]'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='10'>10</SelectItem>
                      <SelectItem value='20'>20</SelectItem>
                      <SelectItem value='25'>25</SelectItem>
                      <SelectItem value='50'>50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Filter Buttons */}
                <div className='flex items-center gap-2'>
                  <Button
                    variant={dateFilter === '7' ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => {
                      setDateFilter('7');
                      setStartDate(undefined);
                      setEndDate(undefined);
                      setCurrentPage(0);
                    }}
                  >
                    7 хоног
                  </Button>
                  <Button
                    variant={dateFilter === '30' ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => {
                      setDateFilter('30');
                      setStartDate(undefined);
                      setEndDate(undefined);
                      setCurrentPage(0);
                    }}
                  >
                    30 хоног
                  </Button>
                  <Button
                    variant={dateFilter === 'all' ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => {
                      setDateFilter('all');
                      setStartDate(undefined);
                      setEndDate(undefined);
                      setCurrentPage(0);
                    }}
                  >
                    Бүгд
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className='overflow-x-auto rounded-md border'>
              <div className='w-full min-w-[560px]'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Хоослосон огноо</TableHead>
                      <TableHead>Нэвтрэлтийн тоо</TableHead>
                      <TableHead>Дүүргэлтийн түвшин</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getPaginatedClearings().length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className='text-muted-foreground py-8 text-center'
                        >
                          Сонгосон хугацаанд хоослох түүх байхгүй
                        </TableCell>
                      </TableRow>
                    ) : (
                      getPaginatedClearings().map((clearing, index) => (
                        <TableRow key={clearing.id || index}>
                          <TableCell>
                            {formatDate(new Date(clearing.clearedAt))}
                          </TableCell>
                          <TableCell>
                            <span className='text-sm font-medium'>
                              {clearing.penetrationCount || 0}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-2'>
                              <div className='h-2 w-16 rounded-full bg-gray-200'>
                                <div
                                  className='h-2 rounded-full bg-green-600'
                                  style={{
                                    width: `${clearing.fillLevelBeforeClearPercent || 0}%`
                                  }}
                                />
                              </div>
                              <span className='text-sm font-medium'>
                                {(
                                  clearing.fillLevelBeforeClearPercent || 0
                                ).toFixed(2)}
                                %
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className='flex items-center justify-center space-x-2 py-4'>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href='#'
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 0) setCurrentPage(currentPage - 1);
                        }}
                        className={
                          currentPage <= 0
                            ? 'pointer-events-none opacity-50'
                            : ''
                        }
                      />
                    </PaginationItem>

                    {getPageNumbers().map((page, index) => (
                      <PaginationItem key={index}>
                        {page === 'ellipsis' ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            href='#'
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
                        href='#'
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages - 1)
                            setCurrentPage(currentPage + 1);
                        }}
                        className={
                          currentPage >= totalPages - 1
                            ? 'pointer-events-none opacity-50'
                            : ''
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-[700px]'>
          <DialogHeader>
            <DialogTitle>Сав засах</DialogTitle>
            <DialogDescription>Савны мэдээллийг засах</DialogDescription>
          </DialogHeader>
          {editingBin ? (
            <Tabs defaultValue='map' className='w-full'>
              <TabsList className='grid w-full grid-cols-2'>
                <TabsTrigger value='map' className='flex items-center gap-2'>
                  <IconMapPin className='h-4 w-4' />
                  Газрын зураг
                </TabsTrigger>
                <TabsTrigger value='manual' className='flex items-center gap-2'>
                  <IconCurrentLocation className='h-4 w-4' />
                  Гараар оруулах
                </TabsTrigger>
              </TabsList>
              <TabsContent value='map' className='space-y-4'>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <Label className='text-sm font-medium'>
                      Сав байрлуулах байршлыг сонгоно уу
                    </Label>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={async () => {
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition(
                            async (position) => {
                              const lat = position.coords.latitude;
                              const lng = position.coords.longitude;
                              setEditingBin((prev: any) => ({
                                ...prev,
                                coordinates: { lat, lng },
                                latitude: lat.toString(),
                                longitude: lng.toString(),
                                location:
                                  'Байршил тодорхойгүй (ачааллаж байна...)'
                              }));
                              const address = await reverseGeocode(lat, lng);
                              if (address) {
                                setEditingBin((prev: any) => ({
                                  ...prev,
                                  location: address
                                }));
                              }
                            }
                          );
                        }
                      }}
                      className='flex items-center gap-2'
                    >
                      <IconCurrentLocation className='h-4 w-4' />
                      Миний байршил
                    </Button>
                  </div>
                  <LeafletMap
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
                    height='300px'
                    zoom={15}
                  />
                </div>
                <div className='grid gap-4'>
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label htmlFor='edit-id' className='text-right'>
                      Сав ID
                    </Label>
                    <Input
                      disabled={true}
                      id='edit-id'
                      value={editingBin.id}
                      onChange={(e) =>
                        setEditingBin({ ...editingBin, id: e.target.value })
                      }
                      placeholder='BIN001'
                      className='col-span-3'
                    />
                  </div>
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label htmlFor='edit-name' className='text-right'>
                      Савны нэр
                    </Label>
                    <Input
                      id='edit-name'
                      value={editingBin.binName || ''}
                      onChange={(e) =>
                        setEditingBin({
                          ...editingBin,
                          binName: e.target.value
                        })
                      }
                      placeholder='Савны нэр'
                      className='col-span-3'
                    />
                  </div>
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label htmlFor='edit-khoroo' className='text-right'>
                      Хорооны дугаар
                    </Label>
                    <Input
                      id='edit-khoroo'
                      value={editingBin.khoroo || ''}
                      onChange={(e) =>
                        setEditingBin({
                          ...editingBin,
                          khoroo: Number(e.target.value)
                        })
                      }
                      placeholder='Хорооны дугаар'
                      className='col-span-3'
                    />
                  </div>
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label htmlFor='edit-location' className='text-right'>
                      Байршил
                    </Label>
                    <Textarea
                      id='edit-location'
                      value={editingBin.location}
                      onChange={(e) =>
                        setEditingBin({
                          ...editingBin,
                          location: e.target.value
                        })
                      }
                      placeholder='Байршлын дэлгэрэнгүй мэдээлэл'
                      className='col-span-3'
                      rows={2}
                    />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value='manual' className='space-y-4'>
                <div className='grid gap-4'>
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label htmlFor='edit-id-manual' className='text-right'>
                      Сав ID
                    </Label>
                    <Input
                      disabled={true}
                      id='edit-id-manual'
                      value={editingBin.id}
                      onChange={(e) =>
                        setEditingBin({ ...editingBin, id: e.target.value })
                      }
                      placeholder='BIN001'
                      className='col-span-3'
                    />
                  </div>
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label htmlFor='edit-name-manual' className='text-right'>
                      Савны нэр
                    </Label>
                    <Input
                      id='edit-name-manual'
                      value={editingBin.binName || ''}
                      onChange={(e) =>
                        setEditingBin({
                          ...editingBin,
                          binName: e.target.value
                        })
                      }
                      placeholder='Савны нэр'
                      className='col-span-3'
                    />
                  </div>
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label
                      htmlFor='edit-location-manual'
                      className='text-right'
                    >
                      Байршил
                    </Label>
                    <Textarea
                      id='edit-location-manual'
                      value={editingBin.location}
                      onChange={(e) =>
                        setEditingBin({
                          ...editingBin,
                          location: e.target.value
                        })
                      }
                      placeholder='Байршлын дэлгэрэнгүй мэдээлэл'
                      className='col-span-3'
                      rows={2}
                    />
                  </div>
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label
                      htmlFor='edit-latitude-manual'
                      className='text-right'
                    >
                      Өргөрөг
                    </Label>
                    <Input
                      id='edit-latitude-manual'
                      type='number'
                      step='any'
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
                      placeholder='47.9211'
                      className='col-span-3'
                    />
                  </div>
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label
                      htmlFor='edit-longitude-manual'
                      className='text-right'
                    >
                      Уртраг
                    </Label>
                    <Input
                      id='edit-longitude-manual'
                      type='number'
                      step='any'
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
                      placeholder='106.9154'
                      className='col-span-3'
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className='text-muted-foreground py-8 text-center'>
              Сонгосон сав олдсонгүй
            </div>
          )}
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsEditDialogOpen(false)}
            >
              Цуцлах
            </Button>
            <Button
              type='button'
              onClick={async () => {
                if (!editingBin?.id) return;
                try {
                  const authHeaders = authUtils.getAuthHeader();
                  console.log(
                    '🔧 Bin save - Auth headers being sent:',
                    authHeaders
                  );
                  console.log('🔧 Bin save - Payload:', editingBin);

                  const response = await fetch(`/api/bins/${editingBin.id}`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                      ...authHeaders
                    },
                    body: JSON.stringify({
                      binId: editingBin.binId || editingBin.id,
                      binName: editingBin.binName,
                      location: editingBin.location,
                      khoroo: editingBin.khoroo,
                      latitude: parseFloat(
                        editingBin.latitude || editingBin.coordinates.lat
                      ),
                      longitude: parseFloat(
                        editingBin.longitude || editingBin.coordinates.lng
                      ),
                      batteryLevel: editingBin.batteryLevel || '12V'
                    })
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
    </PageContainer>
  );
}

// Add reverseGeocode helper function
async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=mn,en`
    );
    const data = await response.json();
    return data?.display_name || null;
  } catch (error) {
    return null;
  }
}
