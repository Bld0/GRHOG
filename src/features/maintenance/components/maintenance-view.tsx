'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { IconEdit, IconPlus, IconSearch, IconTrash } from '@tabler/icons-react';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/page-container';
import { apiClient } from '@/lib/api-client';
import { useDebounce } from '@/hooks/use-debounce';
import { useRolePermissions } from '@/hooks/use-role-permissions';
import { CATEGORY_LABEL, MaintenanceRecord } from '@/features/reports/types';

const PAGE_SIZE = 20;

interface BinOption {
  id: number;
  binId: string;
  location: string | null;
  district: string | null;
  khoroo: number | null;
}

const EMPTY_FORM = {
  binId: '',
  performedAt: '',
  category: 'OTHER',
  reason: '',
  actionTaken: '',
  performedBy: '',
  cost: ''
};

/** datetime-local талбарын хэлбэр (yyyy-MM-ddTHH:mm). */
function toLocalInput(value?: string): string {
  const date = value ? new Date(value) : new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

/**
 * Засвар үйлчилгээний бүртгэл.
 *
 * Төхөөрөмж өөрөө засвараа мэдээлэх боломжгүй тул мэдээллийг оператор гараар
 * оруулна. Ангиллыг чөлөөт бичвэр биш, жагсаалтаас сонгуулдаг нь давтамжийн
 * тайланг утга учиртай болгодог.
 */
export function MaintenanceView() {
  const router = useRouter();
  const {
    isSuperAdmin,
    isAdmin,
    isLoading: authLoading
  } = useRolePermissions();
  const canEdit = isSuperAdmin || isAdmin;

  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const debouncedSearch = useDebounce(search, 400);

  const [bins, setBins] = useState<BinOption[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MaintenanceRecord | null>(null);
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    performedAt: toLocalInput()
  });
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<MaintenanceRecord | null>(
    null
  );

  // Бүртгэл нь эхлээд өнөөдрөөс хойшхи биш, өргөн хугацааг харуулна: засвар
  // ховор үйл явдал тул 30 хоногоор хязгаарлавал жагсаалт байнга хоосон болно.
  const range = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setFullYear(start.getFullYear() - 1);
    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10)
    };
  }, []);

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: range.startDate,
        endDate: range.endDate,
        page: String(page),
        size: String(PAGE_SIZE)
      });
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
      if (category !== 'ALL') params.set('category', category);

      const response = await apiClient.fetchWithAuth(
        `/api/maintenance?${params}`
      );
      if (!response.ok)
        throw new Error('Засварын жагсаалт татахад алдаа гарлаа');
      const data = await response.json();
      setRecords(data.content ?? []);
      setTotal(data.totalElements ?? 0);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Жагсаалт татахад алдаа гарлаа'
      );
    } finally {
      setIsLoading(false);
    }
  }, [range, page, debouncedSearch, category]);

  const fetchBins = useCallback(async () => {
    try {
      const response = await apiClient.fetchWithAuth('/api/dashboard/all-bins');
      if (response.ok) setBins(await response.json());
    } catch {
      // Савны жагсаалт татагдахгүй бол шинэ бүртгэл нэмэх боломжгүй — форм
      // нээхэд мэдэгдэнэ.
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    fetchBins();
  }, [fetchBins]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, category]);

  const readError = async (response: Response, fallback: string) => {
    const raw = await response.text();
    try {
      const parsed = JSON.parse(raw);
      return parsed.message || parsed.error || fallback;
    } catch {
      return raw || fallback;
    }
  };

  const openCreate = () => {
    if (bins.length === 0) {
      toast.error('Хогийн савны жагсаалт татагдаагүй байна');
      return;
    }
    setEditing(null);
    setForm({ ...EMPTY_FORM, performedAt: toLocalInput() });
    setDialogOpen(true);
  };

  const openEdit = (record: MaintenanceRecord) => {
    setEditing(record);
    setForm({
      binId: record.bin ? String(record.bin.id) : '',
      performedAt: toLocalInput(record.performedAt),
      category: record.category,
      reason: record.reason ?? '',
      actionTaken: record.actionTaken ?? '',
      performedBy: record.performedBy ?? '',
      cost: record.cost != null ? String(record.cost) : ''
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.binId || !form.performedAt) {
      toast.error('Хогийн сав болон огноог сонгоно уу');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        performedAt:
          form.performedAt.length === 16
            ? `${form.performedAt}:00`
            : form.performedAt,
        category: form.category,
        reason: form.reason.trim() || null,
        actionTaken: form.actionTaken.trim() || null,
        performedBy: form.performedBy.trim() || null,
        cost: form.cost.trim() ? Number(form.cost) : null
      };

      const url = editing
        ? `/api/maintenance/${editing.id}?binId=${form.binId}`
        : `/api/maintenance?binId=${form.binId}`;

      const response = await apiClient.fetchWithAuth(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(await readError(response, 'Хадгалахад алдаа гарлаа'));
      }

      toast.success(
        editing ? 'Бүртгэл шинэчлэгдлээ' : 'Засварын бүртгэл нэмэгдлээ'
      );
      setDialogOpen(false);
      setEditing(null);
      fetchRecords();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Хадгалахад алдаа гарлаа'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      const response = await apiClient.fetchWithAuth(
        `/api/maintenance/${pendingDelete.id}`,
        { method: 'DELETE' }
      );
      if (!response.ok) {
        throw new Error(await readError(response, 'Устгахад алдаа гарлаа'));
      }
      toast.success('Бүртгэл устгагдлаа');
      setPendingDelete(null);
      fetchRecords();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Устгахад алдаа гарлаа'
      );
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const formatDateTime = (value: string | null) =>
    value ? new Date(value).toLocaleString('mn-MN') : '—';

  if (authLoading) {
    return null;
  }

  return (
    <PageContainer>
      <div className='w-full space-y-6'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>
              Засвар үйлчилгээ
            </h1>
            <p className='text-muted-foreground'>
              Хогийн саванд хийгдсэн засварын бүртгэл — тайланг «Тайлан» хэсгээс
              харна
            </p>
          </div>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              onClick={() => router.push('/dashboard/reports')}
            >
              Тайлан харах
            </Button>
            {canEdit && (
              <Button onClick={openCreate}>
                <IconPlus className='mr-2 h-4 w-4' />
                Шинэ бүртгэл
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
            <div>
              <CardTitle>Бүртгэлүүд</CardTitle>
              <CardDescription>
                Сүүлийн нэг жилийн засварын түүх
              </CardDescription>
            </div>
            <div className='flex flex-col gap-2 sm:flex-row'>
              <div className='relative'>
                <IconSearch className='text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2' />
                <Input
                  placeholder='Сав, шалтгаан, ажилтан...'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className='w-full pl-8 sm:w-64'
                />
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className='w-full sm:w-48'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='ALL'>Бүх ангилал</SelectItem>
                  {Object.keys(CATEGORY_LABEL).map((key) => (
                    <SelectItem key={key} value={key}>
                      {CATEGORY_LABEL[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className='space-y-2'>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className='h-12 w-full' />
                ))}
              </div>
            ) : records.length === 0 ? (
              <div className='text-muted-foreground py-10 text-center text-sm'>
                Засварын бүртгэл алга.
                {canEdit && ' «Шинэ бүртгэл» товчоор нэмнэ үү.'}
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Огноо</TableHead>
                      <TableHead>Хогийн сав</TableHead>
                      <TableHead>Ангилал</TableHead>
                      <TableHead>Шалтгаан</TableHead>
                      <TableHead>Хийсэн ажил</TableHead>
                      <TableHead>Гүйцэтгэсэн</TableHead>
                      <TableHead className='text-right'>Зардал</TableHead>
                      {canEdit && (
                        <TableHead className='text-right'>Үйлдэл</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className='text-sm whitespace-nowrap'>
                          {formatDateTime(record.performedAt)}
                        </TableCell>
                        <TableCell>
                          <div className='font-medium'>
                            {record.bin?.binName || record.bin?.binId || '—'}
                          </div>
                          <div className='text-muted-foreground text-xs'>
                            {record.bin?.location || ''}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant='secondary'>
                            {CATEGORY_LABEL[record.category] ?? record.category}
                          </Badge>
                        </TableCell>
                        <TableCell className='max-w-xs text-sm'>
                          {record.reason || '—'}
                        </TableCell>
                        <TableCell className='max-w-xs text-sm'>
                          {record.actionTaken || '—'}
                        </TableCell>
                        <TableCell className='text-sm'>
                          {record.performedBy || '—'}
                        </TableCell>
                        <TableCell className='text-right tabular-nums'>
                          {record.cost != null
                            ? `${record.cost.toLocaleString('mn-MN')}₮`
                            : '—'}
                        </TableCell>
                        {canEdit && (
                          <TableCell>
                            <div className='flex justify-end gap-1'>
                              <Button
                                variant='outline'
                                size='sm'
                                title='Засах'
                                onClick={() => openEdit(record)}
                              >
                                <IconEdit className='h-4 w-4' />
                              </Button>
                              {isSuperAdmin && (
                                <Button
                                  variant='outline'
                                  size='sm'
                                  title='Устгах'
                                  onClick={() => setPendingDelete(record)}
                                >
                                  <IconTrash className='h-4 w-4' />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {total > PAGE_SIZE && (
              <div className='flex items-center justify-between pt-4'>
                <div className='text-muted-foreground text-sm'>
                  Нийт {total} бүртгэл · {page + 1}/{totalPages}-р хуудас
                </div>
                <div className='flex gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    Өмнөх
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={page + 1 >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Дараах
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='sm:max-w-[600px]'>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Засварын бүртгэл засах' : 'Шинэ засварын бүртгэл'}
            </DialogTitle>
            <DialogDescription>
              Аль саванд, хэзээ, ямар шалтгаанаар засвар хийснийг бүртгэнэ.
            </DialogDescription>
          </DialogHeader>

          <div className='grid grid-cols-1 gap-4 py-2 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='maintenance-bin'>Хогийн сав *</Label>
              <Select
                value={form.binId}
                onValueChange={(value) => setForm({ ...form, binId: value })}
              >
                <SelectTrigger id='maintenance-bin'>
                  <SelectValue placeholder='Сав сонгоно уу' />
                </SelectTrigger>
                <SelectContent className='max-h-72'>
                  {bins.map((bin) => (
                    <SelectItem key={bin.id} value={String(bin.id)}>
                      {bin.binId}
                      {bin.location ? ` — ${bin.location}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='maintenance-date'>Засвар хийсэн огноо *</Label>
              <Input
                id='maintenance-date'
                type='datetime-local'
                value={form.performedAt}
                onChange={(e) =>
                  setForm({ ...form, performedAt: e.target.value })
                }
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='maintenance-category'>Шалтгааны ангилал *</Label>
              <Select
                value={form.category}
                onValueChange={(value) => setForm({ ...form, category: value })}
              >
                <SelectTrigger id='maintenance-category'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(CATEGORY_LABEL).map((key) => (
                    <SelectItem key={key} value={key}>
                      {CATEGORY_LABEL[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='maintenance-by'>Гүйцэтгэсэн ажилтан</Label>
              <Input
                id='maintenance-by'
                value={form.performedBy}
                onChange={(e) =>
                  setForm({ ...form, performedBy: e.target.value })
                }
                placeholder='Ж: Б.Батаа'
              />
            </div>

            <div className='space-y-2 sm:col-span-2'>
              <Label htmlFor='maintenance-reason'>Гэмтлийн шалтгаан</Label>
              <Textarea
                id='maintenance-reason'
                rows={2}
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder='Ж: Мэдрэгч заалт өгөхөө больсон'
              />
            </div>

            <div className='space-y-2 sm:col-span-2'>
              <Label htmlFor='maintenance-action'>Хийсэн ажил</Label>
              <Textarea
                id='maintenance-action'
                rows={2}
                value={form.actionTaken}
                onChange={(e) =>
                  setForm({ ...form, actionTaken: e.target.value })
                }
                placeholder='Ж: Мэдрэгч солив'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='maintenance-cost'>Зардал (₮)</Label>
              <Input
                id='maintenance-cost'
                type='number'
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                placeholder='50000'
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>
              Цуцлах
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !form.binId}>
              {isSaving ? 'Хадгалж байна...' : 'Хадгалах'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Бүртгэлийг устгах уу?</AlertDialogTitle>
            <AlertDialogDescription>
              Устгасан бүртгэл давтамжийн тайлангаас хасагдана. Энэ үйлдлийг
              буцаах боломжгүй.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Цуцлах</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Устгах</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
