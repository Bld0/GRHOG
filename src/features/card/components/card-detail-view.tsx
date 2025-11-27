'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import {
  IconUser,
  IconCreditCard,
  IconActivity,
  IconCalendar,
  IconPhone,
  IconMail,
  IconMapPin,
  IconAlertTriangle,
  IconArrowLeft,
  IconEdit,
  IconBan,
  IconUserCheck,
  IconClock,
  IconTrendingUp,
  IconTrendingDown,
  IconTrash
} from '@tabler/icons-react';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { authUtils } from '@/lib/auth';
import { normalizeStorageLevel } from '@/lib/utils';
import { toast } from 'sonner';

interface CardData {
  id: number;
  name: string;
  cardId: string;
  cardIdDec: string | null;
  address: string | null;
  status: 'active' | 'inactive';
  totalAccess: number;
  uniqueBins: number;
  accessesPerDay: number;
  recentAccess: number;
  lastAccess: Date | null;
  averageAccessPerWeek: number;
  monthlyAccess: number;
  activityScore: number;
  email: string | null;
  phone: string | null;
  createdAt: Date | undefined;
  updatedAt: Date | undefined;
  mostUsedBin: string;
  // New address fields
  district: string | null;
  khoroo: number | null;
  streetBuilding: string | null;
  apartmentNumber: number | null;
  // New client type field
  type: 'ААНБ' | 'СӨХ' | 'Айл' | 'Ажилтан' | null;
}

interface AccessHistoryItem {
  id: number;
  binId: string | number;
  binName: string;
  binLocation: string;
  createdAt: string;
  storageLevel: number;
  batteryLevel: string;
}

interface CardDetailViewProps {
  cardId: string;
}

export function CardDetailView({ cardId }: CardDetailViewProps) {
  const router = useRouter();
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessHistory, setAccessHistory] = useState<AccessHistoryItem[]>([]);
  const [dateFilter, setDateFilter] = useState<'7' | '30' | 'all'>('30');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editUser, setEditUser] = useState({
    name: '',
    email: '',
    phone: '',
    district: '',
    khoroo: '',
    streetBuilding: '',
    apartmentNumber: '',
    type: ''
  });

  useEffect(() => {
    const fetchCardDetails = async () => {
      try {
        // Fetch client activity and stats from backend
        const response = await fetch(`/api/clients/${cardId}/activity`, {
          headers: authUtils.getAuthHeader()
        });
        if (!response.ok) {
          if (response.status === 404) {
            setError('Карт олдсонгүй');
            return;
          }
          throw new Error('Failed to fetch card activity');
        }
        const activityData = await response.json();
        setAccessHistory(activityData.activityHistory || []);
        setCardData({
          id: activityData.id,
          name: activityData.clientName,
          cardId: activityData.cardId,
          cardIdDec: activityData.clientCardIdDec,
          address: activityData.clientAddress,
          status: activityData.clientStatus || 'active',
          totalAccess: activityData.totalAccess,
          uniqueBins: activityData.uniqueBins,
          accessesPerDay: activityData.accessesPerDay || 0,
          recentAccess: activityData.recentAccess,
          lastAccess: activityData.lastAccess
            ? new Date(activityData.lastAccess)
            : null,
          averageAccessPerWeek: (activityData.accessesPerDay || 0) * 7,
          monthlyAccess: (activityData.accessesPerDay || 0) * 30,
          activityScore: Math.min(
            ((activityData.accessesPerDay || 0) / 2) * 100,
            100
          ),
          email: activityData.clientEmail,
          phone: activityData.clientPhone,
          createdAt: activityData.clientCreatedAt
            ? new Date(activityData.clientCreatedAt)
            : undefined,
          updatedAt: activityData.clientUpdatedAt
            ? new Date(activityData.clientUpdatedAt)
            : undefined,
          mostUsedBin: activityData.mostUsedBin,
          district: activityData.clientDistrict || null,
          khoroo: activityData.clientKhoroo || null,
          streetBuilding: activityData.clientStreetBuilding || null,
          apartmentNumber: activityData.clientApartmentNumber || null,
          type: activityData.clientType || null
        });
        setEditUser({
          name: activityData.clientName || '',
          email: activityData.clientEmail || '',
          phone: activityData.clientPhone || '',
          district: activityData.clientDistrict || '',
          khoroo: activityData.clientKhoroo || '',
          streetBuilding: activityData.clientStreetBuilding || '',
          apartmentNumber: activityData.clientApartmentNumber || '',
          type: activityData.clientType || ''
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Алдаа гарлаа');
      } finally {
        setLoading(false);
      }
    };

    fetchCardDetails();
  }, [cardId]);

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

  const getActivityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getActivityScoreText = (score: number) => {
    if (score >= 80) return 'Өндөр идэвхтэй';
    if (score >= 50) return 'Дунд зэргийн идэвхтэй';
    return 'Бага идэвхтэй';
  };

  // Filter access history based on date range
  const getFilteredHistory = () => {
    if (dateFilter === 'all') return accessHistory;

    const days = parseInt(dateFilter);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return accessHistory.filter(
      (access) => new Date(access.createdAt) >= cutoffDate
    );
  };

  // Get paginated data
  const getPaginatedHistory = () => {
    const filtered = getFilteredHistory();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const totalFilteredAccess = getFilteredHistory().length;
  const totalPages = Math.ceil(totalFilteredAccess / itemsPerPage);

  // Generate page numbers for pagination (same as card-view.tsx)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 2) {
        for (let i = 1; i <= 3; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 2; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handleSaveEdit = async () => {
    if (!cardData) return;
    setIsEditing(true);
    try {
      const response = await fetch(`/api/clients/${cardData.id}`, {
        headers: authUtils.getAuthHeader(),
        method: 'PUT',
        body: JSON.stringify({
          name: editUser.name,
          email: editUser.email,
          phone: editUser.phone,
          district: editUser.district || null,
          khoroo: editUser.khoroo ? parseInt(editUser.khoroo) : null,
          streetBuilding: editUser.streetBuilding || null,
          apartmentNumber: editUser.apartmentNumber
            ? parseInt(editUser.apartmentNumber)
            : null,
          type: editUser.type || null
        })
      });
      if (response.ok) {
        setCardData((prev) =>
          prev
            ? {
                ...prev,
                name: editUser.name,
                email: editUser.email,
                phone: editUser.phone,
                district: editUser.district,
                khoroo: editUser.khoroo ? parseInt(editUser.khoroo) : null,
                streetBuilding: editUser.streetBuilding,
                apartmentNumber: editUser.apartmentNumber
                  ? parseInt(editUser.apartmentNumber)
                  : null,
                type: editUser.type as 'ААНБ' | 'СӨХ' | 'Айл' | 'Ажилтан' | null
              }
            : null
        );
        setIsEditDialogOpen(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
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

  if (error || !cardData) {
    return (
      <PageContainer>
        <div className='flex flex-1 flex-col items-center justify-center space-y-4'>
          <IconAlertTriangle className='text-muted-foreground h-12 w-12' />
          <div className='text-center'>
            <h2 className='text-lg font-semibold'>Алдаа гарлаа</h2>
            <p className='text-muted-foreground'>{error}</p>
            <Button onClick={() => router.back()} className='mt-4'>
              <IconArrowLeft className='mr-2 h-4 w-4' />
              Буцах
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <Button variant='ghost' onClick={() => router.back()}>
              <IconArrowLeft className='mr-2 h-4 w-4' />
            </Button>
            <div className='flex items-center gap-4'>
              <Avatar className='h-12 w-12'>
                <AvatarFallback className='text-lg'>
                  {cardData.name === 'Unknown'
                    ? `ХЗ`
                    : cardData.name
                        .split(' ')
                        .map((n: string) => n[0])
                        .join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className='text-3xl font-bold tracking-tight'>
                  <span
                    className='hover:bg-muted/30 cursor-pointer rounded px-2 py-1 transition-colors'
                    onClick={() => {
                      const displayName =
                        cardData.name === 'Unknown'
                          ? `Хэрэглэгч ${cardData.id}`
                          : cardData.name;
                      navigator.clipboard.writeText(displayName);
                      toast.success('Нэр хуулагдлаа');
                    }}
                    title='Хуулахын тулд дарна уу'
                  >
                    {cardData.name === 'Unknown'
                      ? `Хэрэглэгч ${cardData.id}`
                      : cardData.name}
                  </span>
                </h1>
                <p className='text-muted-foreground'>
                  Card ID:
                  <span
                    className='hover:bg-muted/30 cursor-pointer rounded px-2 py-1 font-mono transition-colors'
                    onClick={() => {
                      if (cardData.cardIdDec) {
                        navigator.clipboard.writeText(cardData.cardIdDec);
                        toast.success('Карт ID хуулагдлаа');
                      }
                    }}
                    title='Хуулахын тулд дарна уу'
                  >
                    {cardData.cardIdDec}
                  </span>
                  ({cardData.cardId})
                </p>
              </div>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Badge
              variant={cardData.status === 'active' ? 'default' : 'secondary'}
              className='p-[7px]'
            >
              <div
                className={`mr-2 h-2 w-2 rounded-full ${cardData.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}`}
              />
              {cardData.status === 'active' ? 'Идэвхтэй' : 'Идэвхгүй'}
            </Badge>
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button size='sm' onClick={() => setIsEditDialogOpen(true)}>
                  <IconEdit className='mr-2 h-4 w-4' />
                  Засах
                </Button>
              </DialogTrigger>
              <DialogContent className='sm:max-w-[525px]'>
                <DialogHeader>
                  <DialogTitle>Карт засварлах</DialogTitle>
                  <DialogDescription>
                    {cardData.name} ({cardData.cardId}) картын мэдээллийг
                    засварлах
                  </DialogDescription>
                </DialogHeader>
                <div className='grid gap-4 py-4'>
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label htmlFor='edit-name' className='text-right'>
                      Нэр *
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
          </div>
        </div>

        {/* Main Stats Cards */}
        <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-sm font-medium'>
                  Нийт нэвтрэлт
                </CardTitle>
                <IconActivity className='text-muted-foreground h-4 w-4' />
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{cardData.totalAccess}</div>
              <div className='text-muted-foreground flex items-center gap-1 text-xs'>
                <span className='text-blue-600'>
                  Өдөрт {cardData.accessesPerDay.toFixed(1)}
                </span>
                <span>•</span>
                <span className='text-green-600'>
                  Сүүлийн 7 хоногт {cardData.recentAccess}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-sm font-medium'>
                  Идэвхжилийн оноо
                </CardTitle>
                <IconTrendingUp className='text-muted-foreground h-4 w-4' />
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {cardData.activityScore.toFixed(0)}%
              </div>
              <div className='flex items-center gap-1 text-xs'>
                <span className={getActivityScoreColor(cardData.activityScore)}>
                  {getActivityScoreText(cardData.activityScore)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-sm font-medium'>
                  Ашигласан сав
                </CardTitle>
                <IconMapPin className='text-muted-foreground h-4 w-4' />
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{cardData.uniqueBins}</div>
              <div className='text-muted-foreground flex items-center gap-1 text-xs'>
                <span className='text-purple-600'>
                  Сав бүрт{' '}
                  {cardData.uniqueBins > 0
                    ? (cardData.totalAccess / cardData.uniqueBins).toFixed(1)
                    : 0}{' '}
                  удаа
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-sm font-medium'>
                  Сүүлийн нэвтрэлт
                </CardTitle>
                <IconClock className='text-muted-foreground h-4 w-4' />
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-xl font-bold'>
                {cardData.lastAccess
                  ? formatRelativeDate(cardData.lastAccess)
                  : 'Нэвтрэлт байхгүй'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Information */}
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          {/* Personal Details */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <IconUser className='h-5 w-5' />
                Хувийн мэдээлэл
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-sm'>Нэр:</span>
                <span
                  className='hover:bg-muted/30 cursor-pointer rounded px-2 py-1 text-sm font-medium transition-colors'
                  onClick={() => {
                    const displayName =
                      cardData.name === 'Unknown'
                        ? `Хэрэглэгч ${cardData.id}`
                        : cardData.name;
                    navigator.clipboard.writeText(displayName);
                    toast.success('Нэр хуулагдлаа');
                  }}
                  title='Хуулахын тулд дарна уу'
                >
                  {cardData.name === 'Unknown'
                    ? `Хэрэглэгч ${cardData.id}`
                    : cardData.name}
                </span>
              </div>
              <Separator />
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-sm'>И-мэйл:</span>
                <span
                  className='hover:bg-muted/30 cursor-pointer rounded px-2 py-1 text-sm font-medium transition-colors'
                  onClick={() => {
                    if (cardData.email) {
                      navigator.clipboard.writeText(cardData.email);
                      toast.success('И-мэйл хуулагдлаа');
                    }
                  }}
                  title={cardData.email ? 'Хуулахын тулд дарна уу' : ''}
                >
                  {cardData.email || 'Тодорхойгүй'}
                </span>
              </div>
              <Separator />
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-sm'>Утас:</span>
                <span
                  className='hover:bg-muted/30 cursor-pointer rounded px-2 py-1 text-sm font-medium transition-colors'
                  onClick={() => {
                    if (cardData.phone) {
                      navigator.clipboard.writeText(cardData.phone);
                      toast.success('Утасны дугаар хуулагдлаа');
                    }
                  }}
                  title={cardData.phone ? 'Хуулахын тулд дарна уу' : ''}
                >
                  {cardData.phone || 'Тодорхойгүй'}
                </span>
              </div>
              <Separator />
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-sm'>Дүүрэг:</span>
                <span className='text-sm font-medium'>
                  {cardData.district || 'Тодорхойгүй'}
                </span>
              </div>
              <Separator />
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-sm'>Хороо:</span>
                <span className='text-sm font-medium'>
                  {cardData.khoroo || 'Тодорхойгүй'}
                </span>
              </div>
              <Separator />
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-sm'>
                  Гудамж, байр:
                </span>
                <span className='text-sm font-medium'>
                  {cardData.streetBuilding || 'Тодорхойгүй'}
                </span>
              </div>
              <Separator />
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-sm'>Тоот:</span>
                <span className='text-sm font-medium'>
                  {cardData.apartmentNumber || 'Тодорхойгүй'}
                </span>
              </div>
              <Separator />
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-sm'>Төрөл:</span>
                <span className='text-sm font-medium'>
                  {cardData.type || 'Тодорхойгүй'}
                </span>
              </div>
              <Separator />
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-sm'>
                  Дэлгэрэнгүй хаяг:
                </span>
                <span
                  className='hover:bg-muted/30 cursor-pointer rounded px-2 py-1 text-sm font-medium transition-colors'
                  onClick={() => {
                    if (cardData.address) {
                      navigator.clipboard.writeText(cardData.address);
                      toast.success('Хаяг хуулагдлаа');
                    }
                  }}
                  title={cardData.address ? 'Хуулахын тулд дарна уу' : ''}
                >
                  {cardData.address || 'Тодорхойгүй'}
                </span>
              </div>
              <Separator />
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-sm'>
                  Бүртгэгдсэн:
                </span>
                <span className='text-sm font-medium'>
                  {cardData.createdAt
                    ? formatDate(cardData.createdAt)
                    : 'Тодорхойгүй'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Usage Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <IconActivity className='h-5 w-5' />
                Ашиглалтын статистик
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-sm'>
                  Долоо хоногт дунджаар:
                </span>
                <span className='text-sm font-medium'>
                  {cardData.averageAccessPerWeek.toFixed(1)} удаа
                </span>
              </div>
              <Separator />
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-sm'>
                  Сард дунджаар:
                </span>
                <span className='text-sm font-medium'>
                  {cardData.monthlyAccess.toFixed(1)} удаа
                </span>
              </div>
              <Separator />
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-sm'>
                  Идэвхжилийн хувь:
                </span>
                <span
                  className={`text-sm font-medium ${getActivityScoreColor(cardData.activityScore)}`}
                >
                  {cardData.activityScore.toFixed(1)}%
                </span>
              </div>
              <Separator />
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-sm'>
                  Хамгийн их ашиглах сав:
                </span>
                <span className='text-sm font-medium'>
                  {cardData.mostUsedBin || 'Тодорхойгүй'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Access History Table */}
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle>Нэвтрэлтийн түүх</CardTitle>
              <div className='flex items-center gap-4'>
                {/* Rows Per Page Selection */}
                <div className='flex items-center gap-2'>
                  <span className='text-muted-foreground text-sm'>Мөр:</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(parseInt(value));
                      setCurrentPage(1);
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
                      setCurrentPage(1);
                    }}
                  >
                    7 хоног
                  </Button>
                  <Button
                    variant={dateFilter === '30' ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => {
                      setDateFilter('30');
                      setCurrentPage(1);
                    }}
                  >
                    30 хоног
                  </Button>
                  <Button
                    variant={dateFilter === 'all' ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => {
                      setDateFilter('all');
                      setCurrentPage(1);
                    }}
                  >
                    Бүгд
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Огноо</TableHead>
                    <TableHead>Цаг</TableHead>
                    <TableHead>Сав</TableHead>
                    <TableHead>Байршил</TableHead>
                    <TableHead>Төлөв</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getPaginatedHistory().length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className='text-muted-foreground py-8 text-center'
                      >
                        Сонгосон хугацаанд нэвтрэлт байхгүй
                      </TableCell>
                    </TableRow>
                  ) : (
                    getPaginatedHistory().map((access, index) => (
                      <TableRow key={access.id || index}>
                        <TableCell>
                          {new Date(access.createdAt).toLocaleDateString(
                            'mn-MN'
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(access.createdAt).toLocaleTimeString(
                            'mn-MN',
                            {
                              hour: '2-digit',
                              minute: '2-digit'
                            }
                          )}
                        </TableCell>
                        <TableCell className='font-mono text-sm'>
                          <Link
                            href={`/dashboard/bins/${access.binId}`}
                            className='text-primary hover:text-primary/80 cursor-pointer font-medium hover:underline'
                          >
                            {access.binName || 'Тодорхойгүй'}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {access.binLocation || 'Байршил тодорхойгүй'}
                        </TableCell>
                        <TableCell>
                          <Badge variant='outline' className='text-xs'>
                            Амжилттай
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
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
                          setCurrentPage((prev) => Math.max(prev - 1, 1));
                        }}
                        className={
                          currentPage === 1
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
                            {page}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        href='#'
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages)
                          );
                        }}
                        className={
                          currentPage === totalPages
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
    </PageContainer>
  );
}
