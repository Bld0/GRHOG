'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconAlertTriangle, IconPlus, IconSearch } from '@tabler/icons-react';

import PageContainer from '@/components/layout/page-container';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { TablePagination } from '@/components/ui/table-pagination';
import { LeaderAreaBadge } from '@/components/layout/leader-area-badge';
import { useRolePermissions } from '@/hooks/use-role-permissions';
import { apiClient } from '@/lib/api-client';
import { AddressOption, DISTRICTS } from '@/features/address/types';

import { AddressDeleteDialog } from './address-delete-dialog';
import { AddressFormDialog } from './address-form-dialog';
import { ResidentTabs } from './resident-tabs';

const ALL = '__all';

/**
 * Хаягийн (өрхийн) жагсаалт.
 *
 * Карт бүртгэлийн үндсэн нэгж нь хаяг: мөр бүр нэг өрх, нэг өрх дор олон карт.
 * Картын жагсаалт (`/dashboard/card`) нь мөр бүр нэг КАРТ хэвээрээ — хоёр
 * дэлгэц өөр нэгж тоолдог тул тоо нь давхцахгүй.
 */
export function AddressView() {
  const router = useRouter();
  const { canPerformAction, isKhorooLeader } = useRolePermissions();
  const [district, setDistrict] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);

  const [rows, setRows] = useState<AddressOption[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AddressOption | null>(null);
  const [deleting, setDeleting] = useState<AddressOption | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        size: String(size)
      });
      if (district) params.set('district', district);
      if (query.trim()) params.set('q', query.trim());

      const response = await apiClient.fetchWithAuth(
        `/api/addresses?${params.toString()}`
      );
      if (!response.ok) throw new Error(await response.text());
      const json = await response.json();
      setRows(Array.isArray(json?.content) ? json.content : []);
      setTotalPages(json?.totalPages ?? 0);
      setTotalElements(json?.totalElements ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Алдаа');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [district, query, page, size]);

  // Хайлт бичих бүрд хүсэлт явуулахгүй.
  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  // Шүүлтүүр солигдвол эхний хуудас руу. `page` аль хэдийн 0 бол төлөвийг
  // хөдөлгөхгүй — эс бөгөөс нэг шүүлтүүрийн өөрчлөлт хоёр хүсэлт явуулна.
  useEffect(() => {
    setPage((prev) => (prev === 0 ? prev : 0));
  }, [district, query, size]);

  if (error) {
    return (
      <PageContainer>
        <div className='flex flex-1 flex-col items-center justify-center space-y-4'>
          <IconAlertTriangle className='text-muted-foreground h-12 w-12' />
          <div className='text-center'>
            <h2 className='text-lg font-semibold'>Алдаа гарлаа</h2>
            <p className='text-muted-foreground'>{error}</p>
            <Button onClick={load} className='mt-4'>
              Дахин оролдох
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className='flex h-full flex-1 flex-col space-y-5'>
        <div className='flex flex-wrap items-center justify-between gap-3 pr-6'>
          <div className='flex items-center gap-4'>
            <h1 className='text-3xl font-bold tracking-tight'>Хэрэглэгч</h1>
            <ResidentTabs active='address' />
          </div>
          {canPerformAction('canCreateClients') && (
            <Button
              size='sm'
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <IconPlus className='mr-2 h-4 w-4' />
              Хаяг нэмэх
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <div>
                <CardTitle>Өрхийн жагсаалт</CardTitle>
                <CardDescription>
                  {totalElements} хаяг олдлоо
                  {totalPages > 0 && ` • Хуудас ${page + 1}/${totalPages}`}
                </CardDescription>
              </div>
              <div className='flex items-center gap-2'>
                {isKhorooLeader ? (
                  <LeaderAreaBadge />
                ) : (
                  <Select
                    value={district === '' ? ALL : district}
                    onValueChange={(value) =>
                      setDistrict(value === ALL ? '' : value)
                    }
                  >
                    <SelectTrigger className='w-[170px]'>
                      <SelectValue placeholder='Бүх дүүрэг' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>Бүх дүүрэг</SelectItem>
                      {DISTRICTS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <div className='relative'>
                  <IconSearch className='text-muted-foreground absolute top-2.5 left-2 h-4 w-4' />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder='Байр, тоот, нэрээр хайх'
                    className='w-[220px] pl-8'
                  />
                </div>
                <Select
                  value={String(size)}
                  onValueChange={(value) => setSize(Number(value))}
                >
                  <SelectTrigger className='w-[90px]'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 50, 100].map((option) => (
                      <SelectItem key={option} value={String(option)}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дүүрэг</TableHead>
                  <TableHead>Хороо</TableHead>
                  <TableHead>Гудамж, байр</TableHead>
                  <TableHead>Тоот</TableHead>
                  <TableHead>Төрөл</TableHead>
                  <TableHead>Холбоо барих</TableHead>
                  <TableHead className='text-right'>Карт</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className='text-muted-foreground'>
                      Уншиж байна...
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className='text-muted-foreground'>
                      Хаяг олдсонгүй.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className='cursor-pointer'
                      onClick={() =>
                        router.push(`/dashboard/address/${row.id}`)
                      }
                    >
                      <TableCell>{row.district}</TableCell>
                      <TableCell>{row.khoroo}</TableCell>
                      <TableCell>{row.streetBuilding || '-'}</TableCell>
                      <TableCell>{row.apartmentNumber || '-'}</TableCell>
                      <TableCell>{row.type || '-'}</TableCell>
                      <TableCell>
                        {row.contactName || '-'}
                        {row.contactPhone ? ` • ${row.contactPhone}` : ''}
                      </TableCell>
                      <TableCell className='text-right'>
                        {row.cardCount}
                      </TableCell>
                      <TableCell className='text-right'>
                        {canPerformAction('canEditClients') && (
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditing(row);
                              setFormOpen(true);
                            }}
                          >
                            Засах
                          </Button>
                        )}
                        {/* Карттай хаяг устахгүй (backend 406 буцаана) —
                            товчийг нь хааж, шалтгааныг `title`-д бичнэ. */}
                        {canPerformAction('canDeleteClients') && (
                          <Button
                            variant='ghost'
                            size='sm'
                            className='text-destructive'
                            disabled={row.cardCount > 0}
                            title={
                              row.cardCount > 0
                                ? 'Эхлээд энэ хаягийн картуудыг устгах эсвэл өөр хаяг руу шилжүүлнэ үү'
                                : undefined
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleting(row);
                            }}
                          >
                            Устгах
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <TablePagination
              currentPage={page}
              totalPages={totalPages}
              hasPrevious={page > 0}
              hasNext={page + 1 < totalPages}
              onPageChange={setPage}
            />
          </CardContent>
        </Card>
      </div>

      <AddressFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        address={editing}
        onSaved={load}
      />

      <AddressDeleteDialog
        address={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={load}
      />
    </PageContainer>
  );
}
