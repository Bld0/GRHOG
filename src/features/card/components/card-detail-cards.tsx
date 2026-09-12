'use client';

import { toast } from 'sonner';
import {
  IconActivity,
  IconCalendar,
  IconClock,
  IconMapPin,
  IconUser
} from '@tabler/icons-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { AccessHistoryItem, CardDetail } from './use-card-detail';
import { countRecent } from './use-card-detail';

const localDateTime = (date: Date) => date.toLocaleString('mn-MN');

/** Картын дээрх дөрвөн нэгдсэн үзүүлэлт. */
export function CardDetailStats({
  card,
  history
}: {
  card: CardDetail;
  history: AccessHistoryItem[];
}) {
  const perBin =
    card.uniqueBins > 0 ? (card.totalAccess / card.uniqueBins).toFixed(1) : 0;

  return (
    <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4'>
      <StatCard
        title='Нийт нэвтрэлт'
        icon={<IconActivity className='text-muted-foreground h-4 w-4' />}
        value={String(card.totalAccess)}
      >
        <div className='text-muted-foreground flex items-center gap-1 text-xs'>
          <span className='text-blue-600'>
            Өдөрт {card.accessesPerDay.toFixed(1)}
          </span>
          <span>•</span>
          <span className='text-green-600'>
            Сүүлийн 7 хоногт {card.recentAccess}
          </span>
        </div>
      </StatCard>

      {/* Өмнө нь энд «Идэвхжилийн оноо» гэж `accessesPerDay / 2 * 100` гэсэн
          зохиомол хувь харуулдаг байсныг бодит тоогоор сольсон. */}
      <StatCard
        title='Сүүлийн 30 хоног'
        icon={<IconCalendar className='text-muted-foreground h-4 w-4' />}
        value={String(countRecent(history, 30))}
      >
        <div className='text-muted-foreground flex items-center gap-1 text-xs'>
          <span>нэвтрэлт</span>
        </div>
      </StatCard>

      <StatCard
        title='Ашигласан сав'
        icon={<IconMapPin className='text-muted-foreground h-4 w-4' />}
        value={String(card.uniqueBins)}
      >
        <div className='text-muted-foreground flex items-center gap-1 text-xs'>
          <span className='text-purple-600'>Сав бүрт {perBin} удаа</span>
        </div>
      </StatCard>

      <StatCard
        title='Сүүлийн нэвтрэлт'
        icon={<IconClock className='text-muted-foreground h-4 w-4' />}
        value={card.lastAccess ? localDateTime(card.lastAccess) : 'Нэвтрэлт байхгүй'}
        small
      />
    </div>
  );
}

/** Хувийн мэдээлэл ба ашиглалтын статистикийн хос карт. */
export function CardPersonalDetails({
  card,
  history
}: {
  card: CardDetail;
  history: AccessHistoryItem[];
}) {
  const displayName =
    card.name === 'Unknown' ? `Хэрэглэгч ${card.id}` : card.name;

  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <IconUser className='h-5 w-5' />
            Хувийн мэдээлэл
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <DetailRow label='Нэр:' value={displayName} copy />
          <DetailRow
            label='И-мэйл:'
            value={card.email || 'Тодорхойгүй'}
            copy={Boolean(card.email)}
          />
          <DetailRow
            label='Утас:'
            value={card.phone || 'Тодорхойгүй'}
            copy={Boolean(card.phone)}
          />
          <DetailRow label='Дүүрэг:' value={card.district || 'Тодорхойгүй'} />
          <DetailRow
            label='Хороо:'
            value={card.khoroo ? String(card.khoroo) : 'Тодорхойгүй'}
          />
          <DetailRow
            label='Гудамж, байр:'
            value={card.streetBuilding || 'Тодорхойгүй'}
          />
          <DetailRow
            label='Тоот:'
            value={card.apartmentNumber ? String(card.apartmentNumber) : 'Тодорхойгүй'}
          />
          <DetailRow label='Төрөл:' value={card.type || 'Тодорхойгүй'} />
          <DetailRow
            label='Дэлгэрэнгүй хаяг:'
            value={card.address || 'Тодорхойгүй'}
            copy={Boolean(card.address)}
          />
          <DetailRow
            label='Бүртгэгдсэн огноо:'
            value={card.createdAt ? localDateTime(card.createdAt) : 'Тодорхойгүй'}
            last
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <IconActivity className='h-5 w-5' />
            Ашиглалтын статистик
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          {/* Өмнө нь эдгээр нь `accessesPerDay`-г 7 ба 30-аар үржүүлсэн
              ҮРЖВЭР байсан — хэмжилт биш. Одоо түүхээс бодитоор тоолно. */}
          <DetailRow
            label='Сүүлийн 7 хоногт:'
            value={`${card.recentAccess} удаа`}
          />
          <DetailRow
            label='Сүүлийн 30 хоногт:'
            value={`${countRecent(history, 30)} удаа`}
          />
          <DetailRow
            label='Өдрийн дундаж:'
            value={`${card.accessesPerDay.toFixed(1)} удаа`}
          />
          <DetailRow
            label='Хамгийн их ашиглах сав:'
            value={card.mostUsedBin || 'Тодорхойгүй'}
            last
          />
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  icon,
  value,
  small = false,
  children
}: {
  title: string;
  icon: React.ReactNode;
  value: string;
  small?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-sm font-medium'>{title}</CardTitle>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className={small ? 'text-xl font-bold' : 'text-2xl font-bold'}>
          {value}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

/**
 * Нэг мөр: шошго + утга (+ дарахад хуулах). Хувийн мэдээллийн 10 мөр тус
 * бүрдээ ижил бүтэц, хуулах логикоо давтаж бичсэн байв.
 */
function DetailRow({
  label,
  value,
  copy = false,
  last = false
}: {
  label: string;
  value: string;
  copy?: boolean;
  last?: boolean;
}) {
  return (
    <>
      <div className='flex items-center justify-between'>
        <span className='text-muted-foreground text-sm'>{label}</span>
        <span
          className={`text-sm font-medium${
            copy
              ? ' hover:bg-muted/30 cursor-pointer rounded px-2 py-1 transition-colors'
              : ''
          }`}
          onClick={
            copy
              ? () => {
                  navigator.clipboard.writeText(value);
                  toast.success(`${label.replace(':', '')} хуулагдлаа`);
                }
              : undefined
          }
          title={copy ? 'Хуулахын тулд дарна уу' : undefined}
        >
          {value}
        </span>
      </div>
      {!last && <Separator />}
    </>
  );
}
