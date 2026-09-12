'use client';

import { IconBan, IconTrash, IconUserCheck } from '@tabler/icons-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

import type { CollectorCard } from './collector-model';

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleString('mn-MN') : '—';

interface CollectorCardsTableProps {
  cards: CollectorCard[];
  isLoading: boolean;
  onToggleActive: (card: CollectorCard) => void;
  onDelete: (card: CollectorCard) => void;
}

/** Бүртгэлтэй хоослогчийн картуудын жагсаалт. */
export function CollectorCardsTable({
  cards,
  isLoading,
  onToggleActive,
  onDelete
}: CollectorCardsTableProps) {
  return (
    <>
  {isLoading ? (
    <div className='space-y-2'>
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className='h-12 w-full' />
      ))}
    </div>
  ) : cards.length === 0 ? (
    <div className='text-muted-foreground py-6 text-center text-sm'>
      Бүртгэлтэй карт алга байна.
    </div>
  ) : (
    <div className='overflow-x-auto'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Нэр</TableHead>
            <TableHead>Утас</TableHead>
            <TableHead>Машин</TableHead>
            <TableHead>Карт</TableHead>
            <TableHead className='text-right'>Хоослолт</TableHead>
            <TableHead>Сүүлд уншуулсан</TableHead>
            <TableHead>Төлөв</TableHead>
            <TableHead className='text-right'>Үйлдэл</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cards.map((card) => (
            <TableRow key={card.id}>
              <TableCell className='font-medium'>{card.name}</TableCell>
              <TableCell>{card.phone || '-'}</TableCell>
              <TableCell>{card.vehicleNumber || '-'}</TableCell>
              <TableCell>
                <div className='font-mono text-xs'>{card.cardId}</div>
                <div className='text-muted-foreground font-mono text-xs'>
                  {card.cardIdDec || '-'}
                </div>
              </TableCell>
              <TableCell className='text-right'>
                {card.totalClearings}
              </TableCell>
              <TableCell className='text-sm'>
                {formatDate(card.lastUsedAt)}
              </TableCell>
              <TableCell>
                <Badge variant={card.active ? 'default' : 'secondary'}>
                  {card.active ? 'Идэвхтэй' : 'Хүчингүй'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className='flex justify-end gap-1'>
                  <Button
                    variant='outline'
                    size='sm'
                    title={
                      card.active ? 'Хүчингүй болгох' : 'Идэвхжүүлэх'
                    }
                    onClick={() => onToggleActive(card)}
                  >
                    {card.active ? (
                      <IconBan className='h-4 w-4' />
                    ) : (
                      <IconUserCheck className='h-4 w-4' />
                    )}
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    title='Устгах'
                    onClick={() => onDelete(card)}
                  >
                    <IconTrash className='h-4 w-4' />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )}
    </>
  );
}
