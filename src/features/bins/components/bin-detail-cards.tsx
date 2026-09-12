'use client';

import { toast } from 'sonner';
import {
  IconActivity,
  IconBattery,
  IconMapPin,
  IconTrendingDown,
  IconTrendingUp,
  IconWeight
} from '@tabler/icons-react';
import dynamic from 'next/dynamic';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { BinDetail } from './use-bin-detail';

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

const localDateTime = (date: Date) => date.toLocaleString('mn-MN');

/** Дүүргэлт, батерей, ашиглалтын гурван нэгдсэн үзүүлэлт. */
export function BinStatusCards({ bin }: { bin: BinDetail }) {
  const isFull = bin.fillPercentage >= 90;

  return (
    <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-3'>
      <StatCard
        title='Дүүргэлтийн түвшин'
        icon={<IconWeight className='text-muted-foreground h-4 w-4' />}
        value={`${bin.fillPercentage.toFixed(2)}%`}
      >
        <div className='flex items-center gap-1 text-xs'>
          {isFull ? (
            <IconTrendingDown className='h-3 w-3 text-red-600' />
          ) : (
            <IconTrendingUp className='h-3 w-3 text-green-600' />
          )}
          <span className={isFull ? 'text-red-600' : 'text-green-600'}>
            {isFull ? 'дүүрэн' : 'хэвийн'}
          </span>
        </div>
      </StatCard>

      <StatCard
        title='Батарейн түвшин'
        icon={<IconBattery className='text-muted-foreground h-4 w-4' />}
        value={`${bin.batteryLevel.toFixed(2)}%`}
      >
        <div className='text-muted-foreground flex items-center gap-1 text-xs'>
          <span className={bin.active ? 'text-green-600' : 'text-gray-600'}>
            {bin.active ? 'Идэвхтэй' : 'Идэвхгүй'}
          </span>
        </div>
      </StatCard>

      <StatCard
        title='Ашиглалтын статистик'
        icon={<IconActivity className='text-muted-foreground h-4 w-4' />}
        value={String(bin.totalUsages)}
      >
        <div className='text-muted-foreground flex items-center gap-1 text-xs'>
          <span className='text-purple-600'>нэвтрэлт</span>
        </div>
      </StatCard>
    </div>
  );
}

/** Техникийн мэдээлэл ба байршлын зураг. */
export function BinTechnicalDetails({ bin }: { bin: BinDetail }) {
  const serial =
    bin.serialNumber.toUpperCase() === 'UNKNOWN'
      ? `SN${bin.id}`
      : bin.serialNumber;
  const coordinates = `${bin.coordinates.lat.toFixed(4)}, ${bin.coordinates.lng.toFixed(4)}`;

  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <IconWeight className='h-5 w-5' />
            Техникийн мэдээлэл
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <DetailRow label='Серийн дугаар:' value={serial} copy mono />
          <DetailRow
            label='Утасны дугаар:'
            value={bin.phone ?? '-'}
            copyValue={bin.phone === '-' ? '' : (bin.phone ?? '')}
            copy
            mono
          />
          <DetailRow
            label='Суурилуулсан огноо:'
            value={localDateTime(bin.installDate)}
          />
          <DetailRow
            label='Сүүлийн хоослох:'
            value={
              bin.clearedAt ? localDateTime(bin.clearedAt) : 'Хоослолт хийгдээгүй'
            }
          />
          <DetailRow label='Координат:' value={coordinates} copy mono small />
          <DetailRow label='Байршил:' value={bin.location} copy mono small />
          <DetailRow label='Тайлбар:' value={bin.details ?? '-'} last />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <IconMapPin className='h-5 w-5' />
            Байршлын зураг
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='z-10 h-80 w-full overflow-hidden rounded-lg border border-gray-200'>
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  icon,
  value,
  children
}: {
  title: string;
  icon: React.ReactNode;
  value: string;
  children: React.ReactNode;
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
        <div className='text-2xl font-bold'>{value}</div>
        {children}
      </CardContent>
    </Card>
  );
}

/**
 * Техникийн мэдээллийн нэг мөр. Долоон мөр тус бүрдээ ижил 14 мөр JSX-ийг
 * давтаж, зургаа нь дарахад хуулах логикоо тус тусдаа бичсэн байв.
 */
function DetailRow({
  label,
  value,
  copyValue,
  copy = false,
  mono = false,
  small = false,
  last = false
}: {
  label: string;
  value: string;
  copyValue?: string;
  copy?: boolean;
  mono?: boolean;
  small?: boolean;
  last?: boolean;
}) {
  const base = small ? 'text-muted-foreground text-xs' : 'text-sm font-medium';
  const className = [
    copy ? 'hover:bg-muted/30 cursor-pointer rounded px-2 py-1 transition-colors' : '',
    mono ? 'font-mono' : '',
    base
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <div className='flex items-center justify-between'>
        <span className='text-muted-foreground text-sm'>{label}</span>
        <span
          className={className}
          onClick={
            copy
              ? () => {
                  navigator.clipboard.writeText(copyValue ?? value);
                  toast.success(
                    `${label.replace(':', '')} хуулагдлаа`
                  );
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
