'use client';

import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardFooter,
  CardContent
} from '@/components/ui/card';
import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-react';
import {
  useBins,
  useClients,
  useBinUsages,
  useDashboardActiveBins,
  useDashboardActiveCards,
  useDashboardCurrentUsage,
  useDashboardAverageFilling
} from '@/hooks/use-api-data';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';
import { normalizeStorageLevel } from '@/lib/utils';
import AllBinsMap from '@/features/overview/components/all-bins-map';

export default function OverViewLayout({
  bar_stats,
  pie_stats
}: {
  bar_stats: React.ReactNode;
  pie_stats: React.ReactNode;
}) {
  // Authentication
  const { isLoading: authLoading, error: authError } = useAuth();
  const [useFallbacks, setUseFallbacks] = useState(false);

  // Use authenticated dashboard API hooks (primary data source)
  const {
    data: activeBins,
    loading: activeBinsLoading,
    error: activeBinsError
  } = useDashboardActiveBins();
  const {
    data: activeCards,
    loading: activeCardsLoading,
    error: activeCardsError
  } = useDashboardActiveCards();
  const {
    data: currentUsage,
    loading: currentUsageLoading,
    error: currentUsageError
  } = useDashboardCurrentUsage();
  const {
    data: averageFilling,
    loading: averageFillingLoading,
    error: averageFillingError
  } = useDashboardAverageFilling();

  // Check if dashboard data failed and trigger fallbacks
  const dashboardFailed =
    activeBinsError ||
    activeCardsError ||
    currentUsageError ||
    averageFillingError;

  useEffect(() => {
    if (dashboardFailed && !useFallbacks) {
      setUseFallbacks(true);
    }
  }, [dashboardFailed, useFallbacks]);

  // Conditional fallback data fetching - only when dashboard fails
  const {
    data: bins,
    loading: binsLoading,
    error: binsError
  } = useBins(useFallbacks);
  const {
    data: clients,
    loading: clientsLoading,
    error: clientsError
  } = useClients(useFallbacks);
  const {
    data: binUsages,
    loading: usagesLoading,
    error: usagesError
  } = useBinUsages(useFallbacks);

  // Only show fallback loading if dashboard failed and fallbacks are loading
  const fallbackLoading =
    useFallbacks && (binsLoading || clientsLoading || usagesLoading);
  const dashboardLoading =
    activeBinsLoading ||
    activeCardsLoading ||
    currentUsageLoading ||
    averageFillingLoading;

  const isLoading = authLoading || dashboardLoading || fallbackLoading;
  const hasError =
    authError || (useFallbacks && (binsError || clientsError || usagesError));

  // Use dashboard data when available, fallback to calculated data only when needed
  const totalBins = activeBins?.total || (useFallbacks ? bins.length : 0);
  const onlineBins =
    activeBins?.active ||
    (useFallbacks ? bins.filter((bin) => bin.batteryLevel !== null).length : 0);
  const averageFillLevel = averageFilling
    ? Math.round(normalizeStorageLevel(averageFilling['filling-today']))
    : useFallbacks && bins.length > 0
      ? Math.round(
          bins.reduce(
            (sum, bin) => sum + normalizeStorageLevel(bin.storageLevel || 0),
            0
          ) / bins.length
        )
      : 0;

  const totalClients =
    activeCards?.total || (useFallbacks ? clients.length : 0);
  // activeClients not currently used on this layout

  // Use dashboard usage data when available, fallback only when needed
  const todayUsages = currentUsage
    ? currentUsage['usage-today']
    : useFallbacks
      ? (() => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return Array.isArray(binUsages)
            ? binUsages.filter((usage) => {
                const usageDate = new Date(usage.createdAt);
                usageDate.setHours(0, 0, 0, 0);
                return usageDate.getTime() === today.getTime();
              }).length
            : 0;
        })()
      : 0;

  const yesterdayUsages = currentUsage
    ? currentUsage['usage-prev-day']
    : useFallbacks
      ? (() => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          return Array.isArray(binUsages)
            ? binUsages.filter((usage) => {
                const usageDate = new Date(usage.createdAt);
                usageDate.setHours(0, 0, 0, 0);
                return usageDate.getTime() === yesterday.getTime();
              }).length
            : 0;
        })()
      : 0;

  const fillPercentageChange =
    averageFillLevel > 60 ? 'Өсөж байна' : 'Буурч байна';
  const usageChange =
    todayUsages > yesterdayUsages ? 'Өсөж байна' : 'Буурч байна';

  if (isLoading) {
    return (
      <PageContainer>
        <div className='flex flex-1 flex-col space-y-6'>
          <div className='flex items-center justify-between space-y-2'>
            <h2 className='text-2xl font-bold tracking-tight'>GRHOG систем</h2>
          </div>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
            {[...Array(4)].map((_, i) => (
              <Card key={i} className='@container/card'>
                <CardHeader>
                  <div className='bg-muted mb-2 h-4 animate-pulse rounded' />
                  <div className='bg-muted mb-2 h-8 animate-pulse rounded' />
                  <div className='bg-muted h-6 animate-pulse rounded' />
                </CardHeader>
                <CardFooter>
                  <div className='bg-muted h-4 w-full animate-pulse rounded' />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  if (hasError) {
    return (
      <PageContainer>
        <div className='flex flex-1 flex-col space-y-6'>
          <div className='flex items-center justify-between space-y-2'>
            <h2 className='text-2xl font-bold tracking-tight'>
              GRHOG систем - Алдаа
            </h2>
          </div>
          <Card>
            <CardContent className='pt-6'>
              <p className='text-red-600'>
                Мэдээлэл ачаалахад алдаа гарлаа:{' '}
                {useFallbacks
                  ? binsError || clientsError || usagesError
                  : activeBinsError ||
                    activeCardsError ||
                    currentUsageError ||
                    averageFillingError}
              </p>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-6'>
        <div className='flex items-center justify-between space-y-2'>
          <h2 className='text-2xl font-bold tracking-tight'>GRHOG систем</h2>
        </div>

        {/* Main Statistics Cards */}
        <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4'>
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Нийт сав</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {totalBins}
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  <IconTrendingUp />
                  {onlineBins} онлайн
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='line-clamp-1 flex gap-2 font-medium'>
                {onlineBins}/{totalBins} сав идэвхтэй
              </div>
              <div className='text-muted-foreground'>
                Системийн холболт тогтмол
              </div>
            </CardFooter>
          </Card>

          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Дундаж дүүргэлт</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {averageFillLevel} %
              </CardTitle>
              <CardAction>
                <Badge
                  variant={averageFillLevel > 60 ? 'destructive' : 'outline'}
                >
                  {averageFillLevel > 60 ? (
                    <IconTrendingUp />
                  ) : (
                    <IconTrendingDown />
                  )}
                  {fillPercentageChange}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='line-clamp-1 flex gap-2 font-medium'>
                Сүүлийн долоо хоногт дүүргэлт
              </div>
            </CardFooter>
          </Card>

          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Өнөөдрийн хэрэглээ</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {todayUsages}
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  {todayUsages > yesterdayUsages ? (
                    <IconTrendingUp />
                  ) : (
                    <IconTrendingDown />
                  )}
                  {usageChange}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='text-muted-foreground'>
                Өдөр тутмын савны хэрэглээ
              </div>
            </CardFooter>
          </Card>

          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Идэвхтэй карт</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {totalClients}
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  <IconTrendingUp />
                  {totalClients} бүртгэлтэй
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='text-muted-foreground'>Системийн хэрэглээ</div>
            </CardFooter>
          </Card>
        </div>
        {/* Dashboard chart slots (provided by nested route outlets) */}
        <div className='flex-1'>
          {/* Stack vertically on small screens, side-by-side on md+ */}
          <div className='flex flex-col md:flex-row items-start gap-4'>
            <div className='w-full md:w-7/12'>
              <div>{bar_stats}</div>
              {/* All bins map - use responsive height classes for mobile */}
              <div className='mt-4'>
                <AllBinsMap height='480px' className='h-56 sm:h-72 md:h-[480px]' />
              </div>
            </div>
            <div className='w-full md:w-5/12'>{pie_stats}</div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
