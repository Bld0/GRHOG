'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconEdit,
  IconTrash
} from '@tabler/icons-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import PageContainer from '@/components/layout/page-container';
import { useRolePermissions } from '@/hooks/use-role-permissions';

import { BinBatteryHistory } from './bin-battery-history';
import { BinClearingHistory } from './bin-clearing-history';
import { BinDeleteDialog } from './bin-delete-dialog';
import { BinEditDialog } from './bin-edit-dialog';
import { BinStatusCards, BinTechnicalDetails } from './bin-detail-cards';
import { BinDetail, useBinDetail } from './use-bin-detail';

interface BinDetailViewProps {
  id: string;
}

/**
 * Савны дэлгэрэнгүй хуудас — зохицуулалт л хийнэ.
 *
 * Өгөгдөл татах, төлөвийн карт, техникийн мэдээлэл, хоослох түүх, засах ба
 * устгах цонх тус бүр өөрийн файлтай. Өмнө нь энэ бүхэн 1424 мөрийн нэг
 * функц дотор байв.
 */
export function BinDetailView({ id }: BinDetailViewProps) {
  const router = useRouter();
  const { canPerformAction } = useRolePermissions();
  const { bin, clearings, loading, error, refetch } = useBinDetail(id);
  const [editingBin, setEditingBin] = useState<BinDetail | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (loading) return <BinDetailSkeleton onBack={() => router.back()} />;

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
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <Button variant='ghost' onClick={() => router.back()}>
              <IconArrowLeft className='mr-2 h-4 w-4' />
            </Button>
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
          <div className='flex items-center gap-2'>
            <Badge
              variant={bin.fillPercentage < 90 ? 'default' : 'destructive'}
              className='p-[7px]'
            >
              <div
                className={`mr-2 h-2 w-2 rounded-full ${fillColor(bin.fillPercentage)}`}
              />
              {fillLabel(bin.fillPercentage)}
            </Badge>
            {canPerformAction('canEditBins') && (
              <Button size='sm' onClick={() => setEditingBin(bin)}>
                <IconEdit className='mr-2 h-4 w-4' />
                Засах
              </Button>
            )}
            {canPerformAction('canDeleteBins') && (
              <Button
                variant='destructive'
                size='sm'
                onClick={() => setShowDeleteDialog(true)}
              >
                <IconTrash className='mr-2 h-4 w-4' />
                Устгах
              </Button>
            )}
          </div>
        </div>

        <BinStatusCards bin={bin} />
        <BinTechnicalDetails bin={bin} />

        {/* Батерейн түүх — цэнэглэлт ба зарцуулалтын хурд харагдана */}
        <BinBatteryHistory binId={id} />

        <BinClearingHistory clearings={clearings} />
      </div>

      <BinEditDialog
        bin={editingBin}
        onClose={() => setEditingBin(null)}
        onSaved={refetch}
      />

      <BinDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        binIds={[Number(bin.id)]}
        onDeleted={() => router.push('/dashboard/bins')}
      />
    </PageContainer>
  );
}

const fillColor = (level: number) =>
  level >= 90 ? 'bg-red-500' : level >= 70 ? 'bg-yellow-500' : 'bg-green-500';

const fillLabel = (level: number) =>
  level >= 90 ? 'Дүүрэн' : level >= 70 ? 'Анхааруулга' : 'Хэвийн';

function BinDetailSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-6'>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' onClick={onBack}>
            <IconArrowLeft className='mr-2 h-4 w-4' />
          </Button>
          <div className='bg-muted h-8 w-48 animate-pulse rounded' />
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
