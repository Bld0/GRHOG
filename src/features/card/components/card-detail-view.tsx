'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { IconAlertTriangle, IconArrowLeft, IconEdit } from '@tabler/icons-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import PageContainer from '@/components/layout/page-container';
import { useRolePermissions } from '@/hooks/use-role-permissions';

import { CardAccessHistory } from './card-access-history';
import { CardDetailStats, CardPersonalDetails } from './card-detail-cards';
import { CardEditDialog, EditableCard } from './card-edit-dialog';
import { useCardDetail } from './use-card-detail';

interface CardDetailViewProps {
  cardId: string;
}

/**
 * Картын дэлгэрэнгүй хуудас — зохицуулалт л хийнэ.
 *
 * Өгөгдөл татах, нэгдсэн үзүүлэлт, хувийн мэдээлэл, нэвтрэлтийн түүх, засах
 * цонх тус бүр өөрийн файлтай. Өмнө нь энэ бүхэн 1160 мөрийн нэг функц дотор
 * байв.
 */
export function CardDetailView({ cardId }: CardDetailViewProps) {
  const router = useRouter();
  const { canPerformAction } = useRolePermissions();
  const { card, history, loading, error, refetch } = useCardDetail(cardId);
  const [isEditing, setIsEditing] = useState(false);

  if (loading) return <CardDetailSkeleton />;

  if (error || !card) {
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

  const displayName =
    card.name === 'Unknown' ? `Хэрэглэгч ${card.id}` : card.name;
  const initials =
    card.name === 'Unknown'
      ? 'ХЗ'
      : card.name
          .split(' ')
          .map((part) => part[0])
          .join('');

  const editable: EditableCard | null = isEditing
    ? {
        id: String(card.id),
        name: card.name,
        cardId: card.cardId,
        cardIdConverted: card.cardIdConverted,
        email: card.email ?? '',
        phone: card.phone ?? '',
        address: card.address ?? '',
        district: card.district ?? '',
        khoroo: card.khoroo,
        streetBuilding: card.streetBuilding ?? '',
        apartmentNumber: card.apartmentNumber,
        type: card.type ?? ''
      }
    : null;

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-6'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <Button variant='ghost' onClick={() => router.back()}>
              <IconArrowLeft className='mr-2 h-4 w-4' />
            </Button>
            <Avatar className='h-12 w-12'>
              <AvatarFallback className='text-lg'>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className='text-3xl font-bold tracking-tight'>
                <span
                  className='hover:bg-muted/30 cursor-pointer rounded px-2 py-1 transition-colors'
                  onClick={() => {
                    navigator.clipboard.writeText(displayName);
                    toast.success('Нэр хуулагдлаа');
                  }}
                  title='Хуулахын тулд дарна уу'
                >
                  {displayName}
                </span>
              </h1>
              <p className='text-muted-foreground'>
                Card ID:
                <span
                  className='hover:bg-muted/30 cursor-pointer rounded px-2 py-1 font-mono transition-colors'
                  onClick={() => {
                    if (!card.cardIdDec) return;
                    navigator.clipboard.writeText(card.cardIdDec);
                    toast.success('Карт ID хуулагдлаа');
                  }}
                  title='Хуулахын тулд дарна уу'
                >
                  {card.cardIdDec}
                </span>
                ({card.cardId})
              </p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Badge
              variant={card.status === 'active' ? 'default' : 'secondary'}
              className='p-[7px]'
            >
              <div
                className={`mr-2 h-2 w-2 rounded-full ${
                  card.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
                }`}
              />
              {card.status === 'active' ? 'Идэвхтэй' : 'Идэвхгүй'}
            </Badge>
            {canPerformAction('canEditClients') && (
              <Button size='sm' onClick={() => setIsEditing(true)}>
                <IconEdit className='mr-2 h-4 w-4' />
                Засах
              </Button>
            )}
          </div>
        </div>

        <CardDetailStats card={card} history={history} />
        <CardPersonalDetails card={card} history={history} />
        <CardAccessHistory history={history} />
      </div>

      <CardEditDialog
        card={editable}
        onClose={() => setIsEditing(false)}
        onSaved={refetch}
      />
    </PageContainer>
  );
}

function CardDetailSkeleton() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-6'>
        <div className='bg-muted h-10 w-64 animate-pulse rounded' />
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
