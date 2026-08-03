'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Icons } from '@/components/icons';
import { apiClient } from '@/lib/api-client';

interface ComplaintClient {
  id: number;
  name?: string;
  phone?: string;
  address?: string;
}

export interface Complaint {
  id: number;
  text?: string;
  location?: string;
  status?: 'NEW' | 'REPLIED';
  createdAt?: string;
  replyText?: string;
  repliedAt?: string;
  repliedBy?: string;
  imageCount?: number;
  client?: ComplaintClient;
  images?: string[];
}

const PAGE_SIZE = 20;

function formatDate(value?: string) {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' });
}

export function StatusBadge({ status }: { status?: string }) {
  const replied = status === 'REPLIED';
  return (
    <Badge
      variant='outline'
      className={
        replied
          ? 'border-green-500/40 bg-green-500/10 text-green-600'
          : 'border-amber-500/40 bg-amber-500/10 text-amber-600'
      }
    >
      {replied ? 'Хариу өгсөн' : 'Шинэ'}
    </Badge>
  );
}

export default function ComplaintsView() {
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [newCount, setNewCount] = useState(0);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.fetchWithAuth(
        `/api/complaints?page=${page}&size=${PAGE_SIZE}`
      );
      if (response.ok) {
        const data = await response.json();
        setComplaints(data.content ?? []);
        setTotalPages(data.totalPages ?? 0);
        setTotalElements(data.totalElements ?? 0);
        setNewCount(data.newCount ?? 0);
      }
    } catch {
      // алдааг чимээгүй өнгөрөөж, хоосон жагсаалт харуулна
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  return (
    <PageContainer scrollable>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Санал гомдол</h2>
            <p className='text-muted-foreground text-sm'>
              Нийт {totalElements} гомдол, {newCount} шинэ
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Гомдлын жагсаалт</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className='flex justify-center py-12'>
                <Icons.spinner className='h-6 w-6 animate-spin' />
              </div>
            ) : complaints.length === 0 ? (
              <div className='text-muted-foreground py-12 text-center'>
                Санал гомдол байхгүй байна
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Төлөв</TableHead>
                    <TableHead>Гомдол гаргагч</TableHead>
                    <TableHead>Гомдол</TableHead>
                    <TableHead>Байршил</TableHead>
                    <TableHead className='text-center'>Зураг</TableHead>
                    <TableHead>Огноо</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complaints.map((c) => (
                    <TableRow
                      key={c.id}
                      className='cursor-pointer'
                      onClick={() =>
                        router.push(`/dashboard/complaints/${c.id}`)
                      }
                    >
                      <TableCell>
                        <StatusBadge status={c.status} />
                      </TableCell>
                      <TableCell className='font-medium'>
                        {c.client?.name || '-'}
                      </TableCell>
                      <TableCell className='max-w-[320px] truncate'>
                        {c.text || '-'}
                      </TableCell>
                      <TableCell className='max-w-[200px] truncate'>
                        {c.location || '-'}
                      </TableCell>
                      <TableCell className='text-center'>
                        {c.imageCount ? c.imageCount : '-'}
                      </TableCell>
                      <TableCell className='whitespace-nowrap'>
                        {formatDate(c.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {totalPages > 1 && (
              <div className='flex items-center justify-end gap-2 pt-4'>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Өмнөх
                </Button>
                <span className='text-muted-foreground text-sm'>
                  {page + 1} / {totalPages}
                </span>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Дараах
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
