'use client';

import { useRouter } from 'next/navigation';

import {
  IconAlertTriangle,
  IconRefresh,
  IconSearch,
  IconUserCheck,
  IconUserOff
} from '@tabler/icons-react';

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
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useRolePermissions } from '@/hooks/use-role-permissions';
import {
  ActivityTab,
  BUCKET_LABEL,
  InactivityBucket,
  ReportFilters,
  UsageBucket,
  USAGE_BUCKET_LABEL
} from '../types';

import { KhorooBreakdown } from './activity/khoroo-breakdown';
import { ReportStatCards } from './activity/report-stat-cards';
import {
  PAGE_SIZE,
  useClientActivityReport
} from './activity/use-client-activity-report';

/**
 * Хэрэглэгчийн идэвхийн тайлан — зохицуулалт л хийнэ.
 *
 * Таталт `useClientActivityReport`-д, нэгдсэн үзүүлэлт ба хорооны задаргаа
 * `activity/` доторх component-уудад. Өмнө нь энэ бүхэн 669 мөрийн нэг
 * файлд байв.
 */
export function ClientActivityReport({ filters }: { filters: ReportFilters }) {
  const router = useRouter();
  const { isSuperAdmin } = useRolePermissions();
  const {
    report,
    isLoading,
    tab,
    setTab,
    bucket,
    setBucket,
    usageBucket,
    setUsageBucket,
    khorooFilter,
    setKhorooFilter,
    clients,
    totalClients,
    page,
    setPage,
    listLoading,
    search,
    setSearch,
    isActiveTab,
    isBackfilling,
    runBackfill
  } = useClientActivityReport(filters);

  /** Хорооны тоо дээр дарахад тухайн табыг нээж, шүүлтүүрийг сэлгэнэ. */
  const selectKhoroo = (target: ActivityTab, khoroo: number | null) => {
    const sameCell = tab === target && khorooFilter === khoroo;
    setTab(target);
    setKhorooFilter(sameCell ? null : khoroo);
  };

  const outOfSyncCount = clients.filter((c) => c.usageOutOfSync).length;
  const totalPages = Math.max(1, Math.ceil(totalClients / PAGE_SIZE));
  const formatDate = (value: string | null) =>
    value ? new Date(value).toLocaleDateString('mn-MN') : '—';

  const buckets: { key: InactivityBucket; count: number }[] = [
    { key: '7', count: report?.buckets.days7 ?? 0 },
    { key: '14', count: report?.buckets.days14 ?? 0 },
    { key: '30', count: report?.buckets.days30 ?? 0 },
    { key: 'never', count: report?.buckets.never ?? 0 }
  ];

  const usageBuckets: { key: UsageBucket; count: number }[] = [
    { key: 'low', count: report?.usageBuckets?.low ?? 0 },
    { key: 'mid', count: report?.usageBuckets?.mid ?? 0 },
    { key: 'high', count: report?.usageBuckets?.high ?? 0 }
  ];

  return (
    <div className='space-y-6'>
      <ReportStatCards report={report} loading={isLoading} />

      <KhorooBreakdown
        byKhoroo={report?.byKhoroo ?? []}
        loading={isLoading}
        tab={tab}
        selectedKhoroo={khorooFilter}
        onSelect={selectKhoroo}
      />

      <Card>
        <CardHeader className='space-y-4'>
          {/*
            Нэг хүснэгтийг хоёр таб хуваан ашиглана: мөрийн бүтэц ижил тул
            зөвхөн эх сурвалж (endpoint), эрэмбэ, багануудын нэр л ялгаатай.
          */}
          <Tabs
            value={tab}
            onValueChange={(value) => setTab(value as ActivityTab)}
          >
            <TabsList>
              <TabsTrigger value='inactive'>
                <IconUserOff className='mr-2 h-4 w-4' />
                Идэвхгүй
                <Badge variant='secondary' className='ml-2 tabular-nums'>
                  {report?.inactiveClients ?? 0}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value='active'>
                <IconUserCheck className='mr-2 h-4 w-4' />
                Идэвхтэй
                <Badge variant='secondary' className='ml-2 tabular-nums'>
                  {report?.activeClients ?? 0}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className='flex flex-col gap-1'>
            <CardTitle>
              {isActiveTab ? 'Идэвхтэй хэрэглэгчид' : 'Идэвхгүй хэрэглэгчид'}
            </CardTitle>
            <CardDescription>
              {isActiveTab ? (
                <>
                  Сонгосон хугацаанд карт уншуулсан хэрэглэгчид — хамгийн сүүлд
                  ашигласан нь эхэнд. Мөр дээр дарж дэлгэрэнгүй рүү орно.
                  Уншуулалтын ангилал нь &quot;Нийт хэрэглээ&quot; баганаар
                  шүүнэ — тэр нь бүх хугацааны нийлбэр
                </>
              ) : (
                <>
                  Хамгийн удаан ашиглаагүй нь эхэнд. Мөр дээр дарж дэлгэрэнгүй
                  рүү орно. &quot;Ашиглаагүй хоног&quot; нь сүүлд уншуулснаас
                  хойшхи хугацаа — хэзээ ч уншуулаагүй хэрэглэгчид энэ утга
                  байхгүй тул &quot;Бүртгэлээс хойш&quot; баганаар харна
                </>
              )}
            </CardDescription>
          </div>

          <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
            {/*
              Таб бүр өөрийн ангилалтай: идэвхгүй нь хэр удаан ашиглаагүйгээр,
              идэвхтэй нь хэдэн удаа уншуулснаар.
            */}
            {!isActiveTab ? (
              <div className='flex flex-wrap gap-2'>
                <Button
                  variant={bucket === 'all' ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setBucket('all')}
                >
                  {BUCKET_LABEL.all}
                </Button>
                {buckets.map((item) => (
                  <Button
                    key={item.key}
                    variant={bucket === item.key ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => setBucket(item.key)}
                  >
                    {BUCKET_LABEL[item.key]}
                    <Badge variant='secondary' className='ml-2 tabular-nums'>
                      {item.count}
                    </Badge>
                  </Button>
                ))}
              </div>
            ) : (
              /* Идэвхтэй табд уншуулалтын тоогоор шүүнэ — тоо нь хүснэгтийн
                 "Нийт хэрэглээ" баганатай ижил утга. */
              <div className='flex flex-wrap gap-2'>
                <Button
                  variant={usageBucket === 'all' ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setUsageBucket('all')}
                >
                  {USAGE_BUCKET_LABEL.all}
                </Button>
                {usageBuckets.map((item) => (
                  <Button
                    key={item.key}
                    variant={usageBucket === item.key ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => setUsageBucket(item.key)}
                  >
                    {USAGE_BUCKET_LABEL[item.key]}
                    <Badge variant='secondary' className='ml-2 tabular-nums'>
                      {item.count}
                    </Badge>
                  </Button>
                ))}
              </div>
            )}

            <div className='flex items-center gap-2'>
              {khorooFilter != null && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setKhorooFilter(null)}
                >
                  {khorooFilter}-р хороо ✕
                </Button>
              )}
              <div className='relative'>
                <IconSearch className='text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2' />
                <Input
                  placeholder='Нэр, утас, хаяг...'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className='w-full pl-8 sm:w-60'
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {outOfSyncCount > 0 && (
            <div className='mb-4 flex flex-col gap-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm sm:flex-row sm:items-center sm:justify-between dark:border-amber-900 dark:bg-amber-950/40'>
              <div className='flex items-start gap-2'>
                <IconAlertTriangle className='mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400' />
                <div>
                  <div className='font-medium'>
                    Энэ хуудсан дээрх {outOfSyncCount} мөрийн хэрэглээ бүртгэлд
                    дутуу тэмдэглэгдсэн байна
                  </div>
                  <div className='text-muted-foreground text-xs'>
                    Огноог савны уншилтын түүхээс (bin_usage) олов.
                    {isActiveTab
                      ? ' Жагсаалт хэрэглэгчийн бүртгэл дэх талбараар шүүгддэг тул зарим идэвхтэй хэрэглэгч энд огт харагдахгүй байж болно —'
                      : ' Ангиллын тоонууд хэрэглэгчийн бүртгэл дэх талбараар бодогддог тул эдгээр мөр буруу ангилалд орсон байж болно —'}
                    {isSuperAdmin
                      ? ' дахин тооцоолж залруулна уу.'
                      : ' супер админаар дахин тооцоолуулна уу.'}
                  </div>
                </div>
              </div>
              {isSuperAdmin && (
                <Button
                  variant='outline'
                  size='sm'
                  className='shrink-0'
                  disabled={isBackfilling}
                  onClick={runBackfill}
                >
                  <IconRefresh
                    className={`mr-2 h-4 w-4 ${isBackfilling ? 'animate-spin' : ''}`}
                  />
                  {isBackfilling ? 'Тооцоолж байна...' : 'Дахин тооцоолох'}
                </Button>
              )}
            </div>
          )}
          {listLoading ? (
            <div className='space-y-2'>
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className='h-12 w-full' />
              ))}
            </div>
          ) : clients.length === 0 ? (
            <div className='text-muted-foreground py-8 text-center text-sm'>
              {isActiveTab
                ? usageBucket === 'all'
                  ? 'Сонгосон хугацаанд карт уншуулсан хэрэглэгч алга.'
                  : `Сонгосон хугацаанд ${USAGE_BUCKET_LABEL[usageBucket].toLowerCase()} уншуулсан хэрэглэгч алга.`
                : 'Энэ ангилалд хэрэглэгч алга — бүгд саваа ашиглаж байна.'}
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Нэр</TableHead>
                    <TableHead>Утас</TableHead>
                    <TableHead>Байршил</TableHead>
                    <TableHead>Сүүлд ашигласан</TableHead>
                    <TableHead className='text-right'>
                      {isActiveTab
                        ? 'Сүүлд уншуулсанаас хойш'
                        : 'Ашиглаагүй хоног'}
                    </TableHead>
                    <TableHead className='text-right'>
                      Бүртгэлээс хойш
                    </TableHead>
                    <TableHead className='text-right'>Нийт хэрэглээ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow
                      key={client.id}
                      className='hover:bg-muted/50 cursor-pointer'
                      onClick={() =>
                        client.cardId &&
                        router.push(`/dashboard/card/${client.cardId}`)
                      }
                    >
                      <TableCell className='font-medium'>
                        {client.name || '—'}
                      </TableCell>
                      <TableCell>{client.phone || '—'}</TableCell>
                      <TableCell>
                        <div className='text-sm'>
                          {client.district || '—'}
                          {client.khoroo != null
                            ? `, ${client.khoroo}-р хороо`
                            : ''}
                        </div>
                        <div className='text-muted-foreground text-xs'>
                          {client.streetBuilding || client.address || '—'}
                          {client.apartmentNumber
                            ? ` — ${client.apartmentNumber}`
                            : ''}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-1.5'>
                          {client.neverUsed ? (
                            <Badge
                              variant='outline'
                              className='border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                            >
                              Уншуулж байгаагүй
                            </Badge>
                          ) : (
                            formatDate(client.lastUsedAt)
                          )}
                          {client.usageOutOfSync && (
                            <IconAlertTriangle
                              className='h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400'
                              title='Энэ огноог bin_usage-аас олов — client хүснэгтэд бүртгэгдээгүй байна. Тиймээс энэ мөр ангилалдаа буруу орсон байж болно.'
                            />
                          )}
                        </div>
                      </TableCell>
                      {/*
                        Хэзээ ч уншуулаагүй хэрэглэгчид "ашиглаагүй хоног" гэж
                        байхгүй — түүнийг зөвхөн бүртгэлээс хойшхи хугацаагаар
                        хэмжинэ. Хоёуланг нэг баганад нийлүүлбэл "Хэзээ ч / 749
                        хоног" гэсэн зөрчилтэй хос харагдана.
                      */}
                      <TableCell className='text-right font-medium tabular-nums'>
                        {client.daysInactive ?? '—'}
                      </TableCell>
                      <TableCell className='text-muted-foreground text-right tabular-nums'>
                        {client.daysSinceRegistered ?? '—'}
                      </TableCell>
                      <TableCell className='text-muted-foreground text-right tabular-nums'>
                        {client.totalAccess}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {totalClients > PAGE_SIZE && (
            <div className='flex items-center justify-between pt-4'>
              <div className='text-muted-foreground text-sm'>
                Нийт {totalClients} хэрэглэгч · {page + 1}/{totalPages}-р хуудас
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
  );
}
