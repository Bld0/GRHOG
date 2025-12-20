'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
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
import { Input } from '@/components/ui/input';
import {
  ResponsiveTable as Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis
} from '@/components/ui/pagination';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, set } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PageContainer from '@/components/layout/page-container';
import {
  useClients,
  useBinUsages,
  useClientActivity
} from '@/hooks/use-api-data';
import { useClientActivityChange } from '@/hooks/use-api-data';
import { Client } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { useRolePermissions } from '@/hooks/use-role-permissions';
import { normalizeStorageLevel } from '@/lib/utils';
import { PaginationParams } from '@/hooks/use-pagination';
import { useDebounce } from '@/hooks/use-debounce';
import {
  useTotalCards,
  useTotalAccess,
  useActivityRate
} from '@/hooks/use-card-stats';
import {
  IconSearch,
  IconUser,
  IconEdit,
  IconBan,
  IconUserCheck,
  IconTrash,
  IconCreditCard,
  IconHome,
  IconCalendar,
  IconAlertTriangle,
  IconDownload,
  IconFilter,
  IconTrendingUp,
  IconTrendingDown,
  IconPlus,
  IconX
} from '@tabler/icons-react';
import React from 'react'; // Added missing import for React
import { toast } from 'sonner';
import { authUtils } from '@/lib/auth';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  TableHeaderFilter,
  useTableFilters,
  ActiveFilter
} from '@/components/ui/table-header-filter';
import { ActiveFilters } from '@/components/ui/active-filters';
import SwitchButton from '@/components/switch-button';
import { ca } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
export function CardsView() {
  const router = useRouter();
  // const [isCardIdConverted, setIsCardIdConverted] = useState(false);
  const { canPerformAction, canPost, canPut, canDelete } = useRolePermissions();
  const [currentPage, setCurrentPage] = useState(0); // Changed to 0-based for API
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deletingClientId, setDeletingClientId] = useState<number | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [selectedClients, setSelectedClients] = useState<Set<string>>(
    new Set()
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

  // Form state for creating new user
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    cardId: '',
    address: '',
    district: '',
    khoroo: '',
    streetBuilding: '',
    apartmentNumber: '',
    type: ''
  });

  // Form state for editing user
  const [editUser, setEditUser] = useState({
    name: '',
    email: '',
    phone: '',
    cardId: '',
    cardIdDec: '',
    cardIdConverted: false,
    address: '',
    district: '',
    khoroo: '',
    streetBuilding: '',
    apartmentNumber: '',
    type: ''
  });

  // Create pagination params for the API with filters
  const paginationParams: PaginationParams = useMemo(() => {
    const params: any = {
      page: currentPage,
      size: itemsPerPage,
      sortBy: sortConfig?.field || 'createdAt',
      sortDirection: sortConfig?.direction || 'desc'
    };

    // Build search query from advanced filters
    const searchParts: string[] = [];

    activeFilters.forEach((filter) => {
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
          if (
            filter.value &&
            typeof filter.value === 'object' &&
            'min' in filter.value &&
            'max' in filter.value
          ) {
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

  // Fetch real API data with pagination and filters
  const {
    data: apiClients,
    loading,
    error,
    pagination,
    refetch
  } = useClients(true, paginationParams);

  // Extract statistics from pagination object
  const statistics = useMemo(() => {
    return pagination.statistics;
  }, [pagination.statistics]);
  const {
    data: binUsages,
    loading: usagesLoading,
    error: usagesError
  } = useBinUsages();
  const {
    data: clientActivity,
    loading: activityLoading,
    error: activityError
  } = useClientActivity(selectedCardId);

  // Fetch statistics data
  const { data: totalCardsData, loading: totalCardsLoading } = useTotalCards();
  const { data: totalAccessData, loading: totalAccessLoading } =
    useTotalAccess();
  const { data: activityRateData, loading: activityRateLoading } =
    useActivityRate();

  // Create a map of cardId to usage data for efficient lookup
  const cardUsageMap = useMemo(() => {
    const usageMap = new Map<
      string,
      { count: number; lastUsage: Date | null }
    >();

    // Ensure binUsages is an array before calling forEach
    if (Array.isArray(binUsages)) {
      binUsages.forEach((usage) => {
        const cardId = usage.cardId;
        const usageDate = new Date(usage.createdAt);

        if (!usageMap.has(cardId)) {
          usageMap.set(cardId, { count: 0, lastUsage: null });
        }

        const cardData = usageMap.get(cardId)!;
        cardData.count += 1;

        // Update last usage if this usage is more recent
        if (!cardData.lastUsage || usageDate > cardData.lastUsage) {
          cardData.lastUsage = usageDate;
        }
      });
    }

    return usageMap;
  }, [binUsages]);

  // Transform API data to match component expectations
  const transformedResidents = useMemo(() => {
    return apiClients.map((client, index) => {
      return {
        id: `${String(client.id).padStart(3, '0')}`,
        name: client.name || `Хэрэглэгч ${client.id}`,
        cardId: client.cardId,
        cardIdDec: client.cardIdDec,
        cardIdConverted: client.cardIdConverted || false,
        email: client.email || '',
        phone: client.phone || '-',
        address: client.address || '',
        district: client.district || '',
        khoroo: client.khoroo || null,
        streetBuilding: client.streetBuilding || '',
        apartmentNumber: client.apartmentNumber || null,
        type: client.type || '',
        totalAccess: client.totalAccess || 0,
        cardUsedAt: client.cardUsedAt ? new Date(client.cardUsedAt) : null,
        createdAt: new Date(client.createdAt),
        status: 'active' as 'active' | 'blocked'
      };
    });
  }, [apiClients, cardUsageMap]);

  // Remove client-side filtering since we're now using server-side filtering
  const filteredResidents = transformedResidents;

  // Reset to first page when filters change
  useMemo(() => {
    setCurrentPage(0);
  }, [activeFilters, sortConfig]);

  const formatDate = (dateString: Date | null) => {
    if (!dateString) return '-';
    return dateString.toLocaleString();
  };

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.cardId) {
      alert('Нэр болон карт ID заавал бөглөнө үү');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/users/create-client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authUtils.getAuthHeader()
        },
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email || null,
          phone: newUser.phone || null,
          cardId: newUser.cardId,
          address: newUser.address || null,
          district: newUser.district || null,
          khoroo: newUser.khoroo ? parseInt(newUser.khoroo) : null,
          streetBuilding: newUser.streetBuilding || null,
          apartmentNumber: newUser.apartmentNumber
            ? parseInt(newUser.apartmentNumber)
            : null,
          type: newUser.type || null
        })
      });

      if (response.ok) {
        setIsCreateDialogOpen(false);
        setNewUser({
          name: '',
          email: '',
          phone: '',
          cardId: '',
          address: '',
          district: '',
          khoroo: '',
          streetBuilding: '',
          apartmentNumber: '',
          type: ''
        });
        // Refresh the page to show new data
        window.location.reload();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create client');
      }
    } catch (error) {
      console.error('Error creating client:', error);
      alert(
        'Карт үүсгэхэд алдаа гарлаа: ' +
        (error instanceof Error ? error.message : 'Unknown error')
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditUser = (resident: any) => {
    setEditingUser(resident);
    setEditUser({
      name: resident.name,
      email: resident.email || '', // Use email from resident data if available
      phone: resident.phone || '', // Use phone from resident data if available
      cardId: resident.cardId,
      cardIdDec: resident.cardIdDec,
      cardIdConverted: resident.cardIdConverted,
      address: resident.address || '', // Add address to editUser state
      district: resident.district || '',
      khoroo: resident.khoroo || '',
      streetBuilding: resident.streetBuilding || '',
      apartmentNumber: resident.apartmentNumber || '',
      type: resident.type || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser || !editingUser.id) return;
    setIsEditing(true);
    try {
      const bodyJson = JSON.stringify({
        name: editUser.name,
        email: editUser.email || null,
        phone: editUser.phone || null,
        cardId: editUser.cardId,
        cardIdConverted: editUser.cardIdConverted || false,
        address: editUser.address || null,
        district: editUser.district || null,
        khoroo: editUser.khoroo ? parseInt(editUser.khoroo) : null,
        streetBuilding: editUser.streetBuilding || null,
        apartmentNumber: editUser.apartmentNumber
          ? parseInt(editUser.apartmentNumber)
          : null,
        type: editUser.type || null
      });

      const response = await fetch(`/api/clients/${editingUser.id}`, {
        method: 'PUT',
        headers: authUtils.getAuthHeader(),
        body: bodyJson
      });

      if (response.ok) {
        setIsEditDialogOpen(false);
        setEditingUser(null);
        toast.success(
          'Картын мэдээлэл амжилттай шинэчлэгдлээ. Reload хийж шинэчлэгдсэн дата үзнэ үү.'
        );
        // window.location.reload();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update client');
      }
    } catch (error) {
      console.error('Error updating client:', error);
      alert(
        'Карт засахад алдаа гарлаа: ' +
        (error instanceof Error ? error.message : 'Unknown error')
      );
    } finally {
      setIsEditing(false);
    }
  };

  const toggleSelectClient = (clientId: string) => {
    const newSelected = new Set(selectedClients);
    if (newSelected.has(clientId)) {
      newSelected.delete(clientId);
    } else {
      newSelected.add(clientId);
    }
    setSelectedClients(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedClients.size === filteredResidents.length) {
      setSelectedClients(new Set());
    } else {
      const newSelected = new Set(
        filteredResidents.map((client) => String(client.id))
      );
      setSelectedClients(newSelected);
    }
  };

  const handleDeleteSelected = async () => {
    setIsDeleting(true);
    try {
      const deletePromises = Array.from(selectedClients).map((clientId) =>
        fetch(`/api/users/clients/${clientId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...authUtils.getAuthHeader()
          }
        })
      );

      await Promise.all(deletePromises);
      toast.success('Сонгосон картууд амжилттай устгагдлаа');
      refetch();
    } catch (error) {
      console.error('Error deleting clients:', error);
      toast.error('Карт устгахад алдаа гарлаа');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setSelectedClients(new Set());
    }
  };

  const exportToExcel = async () => {
    try {
      console.log('🚀 Starting Excel export...');

      // Build query parameters from active filters
      const queryParams = new URLSearchParams();

      // Add search query if there are active filters
      if (activeFilters.length > 0) {
        const searchParts: string[] = [];

        activeFilters.forEach((filter) => {
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
              if (
                filter.value &&
                typeof filter.value === 'object' &&
                'min' in filter.value &&
                'max' in filter.value
              ) {
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

      const url = `/api/export/cards?${queryParams.toString()}`;
      console.log('📤 Export URL:', url);

      // Get authentication headers
      const authHeaders = authUtils.getAuthHeader();
      console.log('🔐 Auth headers:', authHeaders);

      // Fetch the Excel file with authentication
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...authHeaders,
          Accept:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
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
      link.download = `cards_export_${new Date().toISOString().split('T')[0]}.xlsx`;

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
      toast.error(
        'Экспорт хийхэд алдаа гарлаа: ' +
        (error instanceof Error ? error.message : 'Unknown error')
      );
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

  const convertCardId = () => {
    const currentHex = editUser.cardId;
    const swapBytes = (hex: String) => {
      if (!hex) return '';
      const cleanHex = hex.replace(/\s+/g, '');
      const paddedHex = cleanHex.length % 2 !== 0 ? '0' + cleanHex : cleanHex;

      return (
        paddedHex
          .match(/.{1,2}/g)
          ?.reverse()
          .join('') || paddedHex
      );
    };

    const convertedValue = swapBytes(currentHex);

    setEditUser((prev) => ({
      ...prev,
      cardId: convertedValue,
      cardIdConverted: !prev.cardIdConverted
    }));
  };

  // Show loading state only on initial load
  const isInitialLoad = loading && !apiClients;
  if (isInitialLoad) {
    return (
      <PageContainer>
        <div className='flex flex-1 flex-col space-y-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold tracking-tight'>
                Картын жагсаалт
              </h1>
            </div>
          </div>
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

  // Show error state
  if (error || usagesError) {
    return (
      <PageContainer>
        <div className='flex flex-1 flex-col items-center justify-center space-y-4'>
          <IconAlertTriangle className='text-muted-foreground h-12 w-12' />
          <div className='text-center'>
            <h2 className='text-lg font-semibold'>Алдаа гарлаа</h2>
            <p className='text-muted-foreground'>
              Мэдээлэл ачааллахад алдаа гарлаа: {error || usagesError}
            </p>
            <Button onClick={() => window.location.reload()} className='mt-4'>
              Дахин оролдох
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-5 h-full'>
        <div className='flex items-center justify-between pr-6'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>
              Картын жагсаалт
            </h1>
          </div>
          <div className='flex items-center gap-2'>
            {selectedClients.size > 0 && (
              <Button
                variant='destructive'
                size='sm'
                onClick={() => setShowDeleteDialog(true)}
              >
                <IconTrash className='mr-2 h-4 w-4' />
                Устгах ({selectedClients.size})
              </Button>
            )}
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button size='sm'>
                  <IconPlus className='mr-2 h-4 w-4' />
                  Карт нэмэх
                </Button>
              </DialogTrigger>
              <DialogContent className='sm:max-w-[525px]'>
                <DialogHeader>
                  <DialogTitle>Шинэ карт нэмэх</DialogTitle>
                </DialogHeader>
                <div className='grid gap-4 py-4'>
                  {/* Name */}
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label htmlFor='name' className='text-right'>
                      Нэр *
                    </Label>
                    <Input
                      id='name'
                      value={newUser.name}
                      onChange={(e) =>
                        setNewUser({ ...newUser, name: e.target.value })
                      }
                      placeholder='Овог нэр'
                      className='col-span-3'
                    />
                  </div>
                  {/* Card ID */}
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label htmlFor='cardId' className='text-right'>
                      Карт ID *
                    </Label>
                    <Input
                      id='cardId'
                      value={newUser.cardId}
                      onChange={(e) =>
                        setNewUser({ ...newUser, cardId: e.target.value })
                      }
                      placeholder='1234567890'
                      className={`col-span-3 font-mono ${newUser.cardId ? 'border-green-500 bg-green-50' : ''}`}
                    />
                  </div>
                  {/* Email */}
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label htmlFor='email' className='text-right'>
                      И-мэйл
                    </Label>
                    <Input
                      id='email'
                      type='email'
                      value={newUser.email}
                      onChange={(e) =>
                        setNewUser({ ...newUser, email: e.target.value })
                      }
                      placeholder='example@email.com'
                      className='col-span-3'
                    />
                  </div>
                  {/* Phone */}
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label htmlFor='phone' className='text-right'>
                      Утас
                    </Label>
                    <Input
                      id='phone'
                      type='tel'
                      value={newUser.phone}
                      onChange={(e) =>
                        setNewUser({ ...newUser, phone: e.target.value })
                      }
                      placeholder='99112233'
                      className='col-span-3'
                    />
                  </div>
                  {/* District */}
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label htmlFor='district' className='text-right'>
                      Дүүрэг
                    </Label>
                    <Select
                      value={newUser.district}
                      onValueChange={(value) =>
                        setNewUser({ ...newUser, district: value })
                      }
                    >
                      <SelectTrigger className='col-span-3'>
                        <SelectValue placeholder='Дүүрэг сонгоно уу' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='Багануур'>Багануур</SelectItem>
                        <SelectItem value='Багахангай'>Багахангай</SelectItem>
                        <SelectItem value='Баянгол'>Баянгол</SelectItem>
                        <SelectItem value='Баянзүрх'>Баянзүрх</SelectItem>
                        <SelectItem value='Налайх'>Налайх</SelectItem>
                        <SelectItem value='Сонгинохайрхан'>
                          Сонгинохайрхан
                        </SelectItem>
                        <SelectItem value='Сүхбаатар'>Сүхбаатар</SelectItem>
                        <SelectItem value='Хан-Уул'>Хан-Уул</SelectItem>
                        <SelectItem value='Чингэлтэй'>Чингэлтэй</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Khoroo */}
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label htmlFor='khoroo' className='text-right'>
                      Хороо
                    </Label>
                    <Input
                      id='khoroo'
                      type='number'
                      value={newUser.khoroo}
                      onChange={(e) =>
                        setNewUser({ ...newUser, khoroo: e.target.value })
                      }
                      placeholder='Хороо'
                      className='col-span-3'
                    />
                  </div>
                  {/* Street Building */}
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label htmlFor='streetBuilding' className='text-right'>
                      Гудамж, байр
                    </Label>
                    <Input
                      id='streetBuilding'
                      value={newUser.streetBuilding}
                      onChange={(e) =>
                        setNewUser({
                          ...newUser,
                          streetBuilding: e.target.value
                        })
                      }
                      placeholder='Гудамж, байр'
                      className='col-span-3'
                    />
                  </div>
                  {/* Apartment Number */}
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label htmlFor='apartmentNumber' className='text-right'>
                      Тоот
                    </Label>
                    <Input
                      id='apartmentNumber'
                      type='number'
                      value={newUser.apartmentNumber}
                      onChange={(e) =>
                        setNewUser({
                          ...newUser,
                          apartmentNumber: e.target.value
                        })
                      }
                      placeholder='Тоот'
                      className='col-span-3'
                    />
                  </div>

                  {/* Address */}
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label htmlFor='address' className='text-left'>
                      Дэлгэрэнгүй хаяг
                    </Label>
                    <Input
                      id='address'
                      value={newUser.address}
                      onChange={(e) =>
                        setNewUser({ ...newUser, address: e.target.value })
                      }
                      placeholder='Дэлгэрэнгүй хаяг'
                      className='col-span-3'
                    />
                  </div>
                  {/* Client Type */}
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label htmlFor='type' className='text-right'>
                      Төрөл
                    </Label>
                    <Select
                      value={newUser.type}
                      onValueChange={(value) =>
                        setNewUser({ ...newUser, type: value })
                      }
                    >
                      <SelectTrigger className='col-span-3'>
                        <SelectValue placeholder='Төрөл сонгоно уу' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='ААНБ'>ААНБ</SelectItem>
                        <SelectItem value='СӨХ'>СӨХ</SelectItem>
                        <SelectItem value='Айл'>Айл</SelectItem>
                        <SelectItem value='Ажилтан'>Ажилтан</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setIsCreateDialogOpen(false)}
                    disabled={isCreating}
                  >
                    Цуцлах
                  </Button>
                  <Button
                    type='button'
                    onClick={handleCreateUser}
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <>
                        <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                        Үүсгэж байна...
                      </>
                    ) : (
                      'Карт үүсгэх'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit User Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className='sm:max-w-[525px]'>
                <DialogHeader>
                  <DialogTitle>Карт засварлах</DialogTitle>
                  <DialogDescription>
                    {editingUser?.name} ({editingUser?.cardId}) картын
                    мэдээллийг засварлах
                  </DialogDescription>
                </DialogHeader>
                <div className='grid gap-4 py-4'>
                  {/* Name */}
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label htmlFor='edit-name' className='text-right'>
                      Нэр
                    </Label>
                    <Input
                      id='edit-name'
                      value={editUser.name}
                      onChange={(e) =>
                        setEditUser({ ...editUser, name: e.target.value })
                      }
                      placeholder='Овог нэр'
                      className='col-span-3'
                    />
                  </div>
                  {/* Card ID */}
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label htmlFor='edit-cardId' className='text-right'>
                      Карт ID
                    </Label>
                    <Input
                      id='edit-cardId'
                      value={editUser.cardId}
                      onChange={(e) => {
                        setEditUser({ ...editUser, cardId: e.target.value });
                      }}
                      placeholder='C12345678'
                      className='bg-muted-foreground/10 font-mono'
                    />
                    <SwitchButton
                      value={editUser.cardIdConverted}
                      onChange={() => {
                        convertCardId();
                      }}
                      label={
                        editUser.cardIdConverted ? 'Хөрвүүлсэн' : 'Хөрвүүлээгүй'
                      }
                    />
                  </div>
                  {/* Email */}
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label htmlFor='edit-email' className='text-right'>
                      И-мэйл
                    </Label>
                    <Input
                      id='edit-email'
                      type='email'
                      value={editUser.email}
                      onChange={(e) =>
                        setEditUser({ ...editUser, email: e.target.value })
                      }
                      placeholder='example@email.com'
                      className='col-span-3'
                    />
                  </div>
                  {/* Phone */}
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label htmlFor='edit-phone' className='text-right'>
                      Утас
                    </Label>
                    <Input
                      id='edit-phone'
                      type='tel'
                      value={editUser.phone}
                      onChange={(e) =>
                        setEditUser({ ...editUser, phone: e.target.value })
                      }
                      placeholder='99112233'
                      className='col-span-3'
                    />
                  </div>

                  {/* District */}
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label htmlFor='edit-district' className='text-right'>
                      Дүүрэг
                    </Label>
                    <Select
                      value={editUser.district}
                      onValueChange={(value) =>
                        setEditUser({ ...editUser, district: value })
                      }
                    >
                      <SelectTrigger className='col-span-3'>
                        <SelectValue placeholder='Дүүрэг сонгоно уу' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='Багануур'>Багануур</SelectItem>
                        <SelectItem value='Багахангай'>Багахангай</SelectItem>
                        <SelectItem value='Баянгол'>Баянгол</SelectItem>
                        <SelectItem value='Баянзүрх'>Баянзүрх</SelectItem>
                        <SelectItem value='Налайх'>Налайх</SelectItem>
                        <SelectItem value='Сонгинохайрхан'>
                          Сонгинохайрхан
                        </SelectItem>
                        <SelectItem value='Сүхбаатар'>Сүхбаатар</SelectItem>
                        <SelectItem value='Хан-Уул'>Хан-Уул</SelectItem>
                        <SelectItem value='Чингэлтэй'>Чингэлтэй</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Khoroo */}
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label htmlFor='edit-khoroo' className='text-right'>
                      Хороо
                    </Label>
                    <Input
                      id='edit-khoroo'
                      type='number'
                      value={editUser.khoroo}
                      onChange={(e) =>
                        setEditUser({ ...editUser, khoroo: e.target.value })
                      }
                      placeholder='Хороо'
                      className='col-span-3'
                    />
                  </div>
                  {/* Street Building */}
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label htmlFor='edit-streetBuilding' className='text-right'>
                      Гудамж, байр
                    </Label>
                    <Input
                      id='edit-streetBuilding'
                      value={editUser.streetBuilding}
                      onChange={(e) =>
                        setEditUser({
                          ...editUser,
                          streetBuilding: e.target.value
                        })
                      }
                      placeholder='Гудамж, байр'
                      className='col-span-3'
                    />
                  </div>
                  {/* Apartment Number */}
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label
                      htmlFor='edit-apartmentNumber'
                      className='text-right'
                    >
                      Тоот
                    </Label>
                    <Input
                      id='edit-apartmentNumber'
                      type='number'
                      value={editUser.apartmentNumber}
                      onChange={(e) =>
                        setEditUser({
                          ...editUser,
                          apartmentNumber: e.target.value
                        })
                      }
                      placeholder='Тоот'
                      className='col-span-3'
                    />
                  </div>
                  {/* Address */}
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label htmlFor='edit-address' className='text-left'>
                      Дэлгэрэнгүй хаяг
                    </Label>
                    <Input
                      id='edit-address'
                      value={editUser.address}
                      onChange={(e) =>
                        setEditUser({ ...editUser, address: e.target.value })
                      }
                      placeholder='Дэлгэрэнгүй хаяг'
                      className='col-span-3'
                    />
                  </div>
                  {/* Client Type */}
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label htmlFor='edit-type' className='text-right'>
                      Төрөл
                    </Label>
                    <Select
                      value={editUser.type}
                      onValueChange={(value) =>
                        setEditUser({ ...editUser, type: value })
                      }
                    >
                      <SelectTrigger className='col-span-3'>
                        <SelectValue placeholder='Төрөл сонгоно уу' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='ААНБ'>ААНБ</SelectItem>
                        <SelectItem value='СӨХ'>СӨХ</SelectItem>
                        <SelectItem value='Айл'>Айл</SelectItem>
                        <SelectItem value='Ажилтан'>Ажилтан</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setIsEditDialogOpen(false)}
                    disabled={isEditing}
                  >
                    Цуцлах
                  </Button>
                  <Button
                    type='button'
                    onClick={handleSaveEdit}
                    disabled={isEditing}
                  >
                    {isEditing ? (
                      <>
                        <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                        Хадгалж байна...
                      </>
                    ) : (
                      'Хадгалах'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button onClick={exportToExcel} variant='outline' size='sm'>
              <IconDownload className='mr-2 h-4 w-4' />
              Excel татах
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-3 pr-6'>
          <Card>
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-sm font-medium'>Нийт Карт</CardTitle>
                <IconUser className='text-muted-foreground h-4 w-4' />
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {totalCardsLoading ? '...' : totalCardsData?.totalCards || 0}
              </div>
              <div className='text-muted-foreground flex items-center gap-1 text-xs'>
                <span className=''> идэвхтэй карт </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-sm font-medium'>
                  Нийт нэвтрэлт
                </CardTitle>
                <IconCreditCard className='text-muted-foreground h-4 w-4' />
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {totalAccessLoading
                  ? '...'
                  : totalAccessData?.totalAccess.toLocaleString() || '0'}
              </div>
              <div className='text-muted-foreground flex items-center gap-1 text-xs'>
                <span>
                  Дундаж:{' '}
                  {totalAccessLoading
                    ? '...'
                    : totalAccessData?.averageAccessPerCard.toFixed(2) || 0}
                  /хүн
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-sm font-medium'>
                  Идэвхжил хувь
                </CardTitle>
                <IconUserCheck className='text-muted-foreground h-4 w-4' />
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {activityRateLoading
                  ? '...'
                  : activityRateData?.activityRate.toFixed(2) || 0}
                %
              </div>
              <div className='flex items-center gap-1 text-xs'>
                {activityRateData && activityRateData.trend ? (
                  <>
                    {activityRateData.trend.isPositive ? (
                      <IconTrendingUp className='h-3 w-3 text-green-600' />
                    ) : (
                      <IconTrendingDown className='h-3 w-3 text-red-600' />
                    )}
                    <span
                      className={
                        activityRateData.trend.isPositive
                          ? 'text-green-600'
                          : 'text-red-600'
                      }
                    >
                      {activityRateData.trend.isPositive ? '+' : ''}
                      {activityRateData.trend.changePercentage.toFixed(2)}%
                    </span>
                    <span className='text-muted-foreground'>
                      {activityRateData.trend.period}
                    </span>
                  </>
                ) : (
                  <span className='text-muted-foreground'>Өгөгдөл байхгүй</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Residents Table */}
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle>Картын жагсаалт</CardTitle>
                <CardDescription>
                  {pagination.totalElements} карт олдлоо •{' '}
                  {pagination?.statistics?.totalAccessedCount || 0} нэвтрэлттэй
                  • Хуудас {currentPage + 1}/{pagination.totalPages}
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

            <div className='flex-1 overflow-auto rounded-md border relative'>
              <Table className='w-full'>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-[50px] text-center sticky top-0 z-10 bg-background'>
                      <Checkbox
                        checked={
                          filteredResidents.length > 0 &&
                          selectedClients.size === filteredResidents.length
                        }
                        onCheckedChange={toggleSelectAll}
                        aria-label='Select all'
                      />
                    </TableHead>
                    <TableHead className='relative text-center sticky top-0 z-10 bg-background'>
                      <TableHeaderFilter
                        field='district'
                        label='Дүүрэг'
                        type='text'
                        currentSort={sortConfig}
                        activeFilters={activeFilters}
                        onSort={handleSort}
                        onFilterChange={setActiveFilters}
                      />
                    </TableHead>
                    <TableHead className='relative text-center sticky top-0 z-10 bg-background'>
                      <TableHeaderFilter
                        field='khoroo'
                        label='Хороо'
                        type='number'
                        currentSort={sortConfig}
                        activeFilters={activeFilters}
                        onSort={handleSort}
                        onFilterChange={setActiveFilters}
                      />
                    </TableHead>
                    <TableHead className='relative text-center sticky top-0 z-10 bg-background'>
                      <TableHeaderFilter
                        field='streetBuilding'
                        label='Байр/гудамж'
                        type='text'
                        currentSort={sortConfig}
                        activeFilters={activeFilters}
                        onSort={handleSort}
                        onFilterChange={setActiveFilters}
                      />
                    </TableHead>
                    <TableHead className='relative text-center sticky top-0 z-10 bg-background'>
                      <TableHeaderFilter
                        field='apartmentNumber'
                        label='Тоот'
                        type='text'
                        currentSort={sortConfig}
                        activeFilters={activeFilters}
                        onSort={handleSort}
                        onFilterChange={setActiveFilters}
                      />
                    </TableHead>
                    <TableHead className='relative text-center sticky top-0 z-10 bg-background'>
                      <TableHeaderFilter
                        field='type'
                        label='Төрөл'
                        type='text'
                        currentSort={sortConfig}
                        activeFilters={activeFilters}
                        onSort={handleSort}
                        onFilterChange={setActiveFilters}
                      />
                    </TableHead>
                    <TableHead className='relative text-center sticky top-0 z-10 bg-background'>
                      <TableHeaderFilter
                        field='name'
                        label='Нэр'
                        type='text'
                        currentSort={sortConfig}
                        activeFilters={activeFilters}
                        onSort={handleSort}
                        onFilterChange={setActiveFilters}
                      />
                    </TableHead>
                    <TableHead className='relative text-center sticky top-0 z-10 bg-background'>
                      <TableHeaderFilter
                        field='cardIdDec'
                        label='Карт ID'
                        type='text'
                        currentSort={sortConfig}
                        activeFilters={activeFilters}
                        onSort={handleSort}
                        onFilterChange={setActiveFilters}
                      />
                    </TableHead>
                    <TableHead className='relative text-center sticky top-0 z-10 bg-background'>
                      <TableHeaderFilter
                        field='totalAccess'
                        label='Нэвтрэлт'
                        type='number'
                        currentSort={sortConfig}
                        activeFilters={activeFilters}
                        onSort={handleSort}
                        onFilterChange={setActiveFilters}
                      />
                    </TableHead>
                    <TableHead className='relative text-center sticky top-0 z-10 bg-background'>
                      <TableHeaderFilter
                        field='cardUsedAt'
                        label='Сүүлийн нэвтрэлт'
                        type='date'
                        currentSort={sortConfig}
                        activeFilters={activeFilters}
                        onSort={handleSort}
                        onFilterChange={setActiveFilters}
                      />
                    </TableHead>
                    <TableHead className='relative text-center sticky top-0 z-10 bg-background'>
                      <TableHeaderFilter
                        field='createdAt'
                        label='Бүртгэгдсэн огноо'
                        type='date'
                        currentSort={sortConfig}
                        activeFilters={activeFilters}
                        onSort={handleSort}
                        onFilterChange={setActiveFilters}
                      />
                    </TableHead>
                    <TableHead className='relative text-center sticky top-0 z-10 bg-background'>
                      <TableHeaderFilter
                        field='phone'
                        label='Утасны дугаар'
                        type='text'
                        currentSort={sortConfig}
                        activeFilters={activeFilters}
                        onSort={handleSort}
                        onFilterChange={setActiveFilters}
                      />
                    </TableHead>
                    <TableHead className='text-center sticky top-0 z-10 bg-background'>
                      Үйлдэл
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResidents.map((resident: any) => (
                    <TableRow
                      key={resident.id}
                      className='hover:bg-muted/50 cursor-pointer'
                      onClick={() => {
                        if (
                          editUser != null &&
                          editUser.cardId != null &&
                          editUser.cardId != ''
                        )
                          router.push(`/dashboard/card/${editUser.cardId}`);
                        else
                          router.push(`/dashboard/card/${resident.cardId}`);
                      }}
                    >
                      <TableCell className='text-center'>
                        <Checkbox
                          checked={selectedClients.has(String(resident.id))}
                          onCheckedChange={() =>
                            toggleSelectClient(String(resident.id))
                          }
                          onClick={(e) => e.stopPropagation()}
                          aria-label='Select row'
                        />
                      </TableCell>
                      <TableCell>
                        <div className='text-center text-sm font-medium'>
                          {resident.district || '-'}
                        </div>
                      </TableCell>
                      {/* Khoroo Column */}
                      <TableCell>
                        <div className='text-center text-sm'>
                          {resident.khoroo || '-'}
                        </div>
                      </TableCell>
                      {/* Street/Building Column */}
                      <TableCell>
                        <div className='text-center text-sm'>
                          {resident.streetBuilding || '-'}
                        </div>
                      </TableCell>
                      {/* Apartment Number Column */}
                      <TableCell>
                        <div className='text-center text-sm'>
                          {resident.apartmentNumber || '-'}
                        </div>
                      </TableCell>
                      {/* Type Column */}
                      <TableCell>
                        <div className='flex items-center gap-2 text-center'>
                          <Badge variant='outline' className='text-xs'>
                            {resident.type || '-'}
                          </Badge>
                        </div>
                      </TableCell>
                      {/* Name Column */}
                      <TableCell>
                        <div
                          className='hover:bg-muted/30 cursor-pointer rounded px-2 py-1 text-center font-medium transition-colors'
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(resident.name);
                            toast.success('Нэр хуулагдлаа');
                          }}
                          title='Хуулахын тулд дарна уу'
                        >
                          {resident.name}
                        </div>
                      </TableCell>
                      {/* Card ID Column */}
                      <TableCell>
                        <div className='flex flex-col gap-1 text-center'>
                          <div className='flex items-center gap-2'>
                            <IconCreditCard className='text-muted-foreground h-4 w-4' />
                            <span
                              className='bg-muted hover:bg-muted/70 cursor-pointer rounded px-2 py-1 font-mono text-sm transition-colors'
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(
                                  resident.cardIdDec
                                );
                                toast.success('Карт ID хуулагдлаа');
                              }}
                              title='Хуулахын тулд дарна уу'
                            >
                              {resident.cardIdDec}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      {/* Total Access Column */}
                      <TableCell>
                        <div className='text-center font-medium'>
                          {resident.totalAccess}
                        </div>
                      </TableCell>
                      {/* Last Access Column */}
                      <TableCell>
                        <div className='flex items-center gap-2 text-center'>
                          <IconCalendar className='text-muted-foreground h-4 w-4' />
                          <span className='text-sm'>
                            {formatDate(resident.cardUsedAt)}
                          </span>
                        </div>
                      </TableCell>
                      {/* Created Date Column */}
                      <TableCell>
                        <div className='flex items-center gap-2 text-center'>
                          <IconCalendar className='text-muted-foreground h-4 w-4' />
                          <span className='text-sm'>
                            {formatDate(resident.createdAt)}
                          </span>
                        </div>
                      </TableCell>
                      {/* Phone Column */}
                      <TableCell>
                        <div
                          className='hover:bg-muted/30 cursor-pointer rounded px-2 py-1 text-center font-medium transition-colors'
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(resident.phone);
                            toast.success('Утасны дугаар хуулагдлаа');
                          }}
                          title='Хуулахын тулд дарна уу'
                        >
                          {resident.phone}
                        </div>
                      </TableCell>
                      {/* Actions Column */}
                      <TableCell className='text-center'>
                        <div className='flex items-center justify-end gap-2'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => {
                              if (
                                editUser != null &&
                                editUser.cardId != null &&
                                editUser.cardId != ''
                              )
                                router.push(
                                  `/dashboard/card/${editUser.cardId}`
                                );
                              else
                                router.push(
                                  `/dashboard/card/${resident.cardId}`
                                );
                            }}
                          >
                            <IconUser className='h-4 w-4' />
                          </Button>
                          {canPerformAction('canEditClients') && (
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('Editing resident:', resident);
                                handleEditUser(resident);
                              }}
                            >
                              <IconEdit className='h-4 w-4' />
                            </Button>
                          )}

                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredResidents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={14} className='py-8 text-center'>
                        <div className='flex flex-col items-center gap-2'>
                          <IconSearch className='text-muted-foreground h-8 w-8' />
                          <p className='text-muted-foreground'>
                            {activeFilters.length > 0
                              ? 'Хайлтын үр дүн олдсонгүй'
                              : 'Бүртгэлтэй карт байхгүй'}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className='flex items-center justify-center space-x-2 py-4'>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href='#'
                        onClick={(e) => {
                          e.preventDefault();
                          if (pagination.hasPrevious)
                            setCurrentPage(currentPage - 1);
                        }}
                        className={
                          !pagination.hasPrevious
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
                          if (pagination.hasNext)
                            setCurrentPage(currentPage + 1);
                        }}
                        className={
                          !pagination.hasNext
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

        {/* Client Activity Dialog */}
        <Dialog
          open={isActivityDialogOpen}
          onOpenChange={setIsActivityDialogOpen}
        >
          <DialogContent className='max-h-[80vh] max-w-4xl overflow-y-auto'>
            <DialogHeader>
              <DialogTitle>Хэрэглэгчийн идэвх</DialogTitle>
              <DialogDescription>Карт ID: {selectedCardId}</DialogDescription>
            </DialogHeader>

            {activityLoading ? (
              <div className='flex items-center justify-center py-8'>
                <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600'></div>
              </div>
            ) : activityError ? (
              <div className='py-8 text-center text-red-600'>
                Алдаа гарлаа: {activityError}
              </div>
            ) : clientActivity ? (
              <div className='space-y-6'>
                {/* Summary Cards */}
                <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardTitle className='text-sm font-medium'>
                        Нийт нэвтрэлт
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold'>
                        {clientActivity.totalAccess}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className='pb-2'>
                      <CardTitle className='text-sm font-medium'>
                        Уникал сав
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold'>
                        {clientActivity.uniqueBins}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className='pb-2'>
                      <CardTitle className='text-sm font-medium'>
                        Өдөр тутмын нэвтрэлт
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold'>
                        {clientActivity.accessesPerDay.toFixed(1)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className='pb-2'>
                      <CardTitle className='text-sm font-medium'>
                        Сүүлийн 7 хоног
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold'>
                        {clientActivity.recentAccess}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Activity History */}
                <div>
                  <h3 className='mb-4 text-lg font-semibold'>Идэвхийн түүх</h3>
                  <div className='rounded-md border'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Сав ID</TableHead>
                          <TableHead>Байршил</TableHead>
                          <TableHead>Дүүргэлт</TableHead>
                          <TableHead>Огноо</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientActivity.activityHistory.map((activity) => (
                          <TableRow key={activity.id}>
                            <TableCell className='font-medium'>
                              {activity.binId}
                            </TableCell>
                            <TableCell>
                              {activity.binLocation || 'Тодорхойгүй'}
                            </TableCell>
                            <TableCell>
                              {normalizeStorageLevel(
                                activity.storageLevel
                              ).toFixed(2)}
                              %
                            </TableCell>
                            <TableCell>
                              {formatDate(new Date(activity.createdAt))}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            ) : (
              <div className='text-muted-foreground py-8 text-center'>
                Идэвхийн мэдээлэл олдсонгүй
              </div>
            )}

            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setIsActivityDialogOpen(false)}
              >
                Хаах
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className='z-[1000]'>
          <AlertDialogHeader>
            <AlertDialogTitle>Та итгэлтэй байна уу?</AlertDialogTitle>
            <AlertDialogDescription>
              Та {selectedClients.size} картыг устгах гэж байна. Энэ үйлдлийг
              буцаах боломжгүй.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Болих</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteSelected();
              }}
              className='bg-red-600 hover:bg-red-700'
              disabled={isDeleting}
            >
              {isDeleting ? 'Устгаж байна...' : 'Устгах'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
