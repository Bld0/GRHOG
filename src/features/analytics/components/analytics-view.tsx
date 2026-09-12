'use client';

import * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import PageContainer from '@/components/layout/page-container';
import { 
  IconTrash,
  IconUsers,
  IconTrendingUp,
  IconCalendar,
  IconDownload,
  IconMapPin,
  IconWeight,
  IconRecycle,
  IconChartBar
} from '@tabler/icons-react';
import { RadarPerformanceChart } from './radar-performance-chart';
import { PieInteractiveChart } from './pie-interactive-chart';
import { LineTrendsChart } from './line-trends-chart';
import { 
  useBinStatistics, 
  useUsageStatistics, 
  usePenetrationAnalysis, 
  useClearingEfficiency,
  useCollectionTrends
} from '@/hooks/use-api-data';
import { normalizeStorageLevel } from '@/lib/utils';

export function AnalyticsView() {
  const [selectedDateRange, setSelectedDateRange] = useState('7d');
  
  // Use new analytics API endpoints
  const { data: binStats, loading: binStatsLoading, error: binStatsError } = useBinStatistics();
  const { data: usageStats, loading: usageStatsLoading, error: usageStatsError } = useUsageStatistics();
  const { data: penetrationAnalysis, loading: penetrationLoading, error: penetrationError } = usePenetrationAnalysis();
  const { data: clearingEfficiency, loading: clearingLoading, error: clearingError } = useClearingEfficiency();
  // Сарын графикууд бодит `/dashboard/collection-trends`-ээс тэжээгдэнэ.
  const { data: collectionTrends } = useCollectionTrends();

  const isLoading = binStatsLoading || usageStatsLoading || penetrationLoading || clearingLoading;
  const hasError = binStatsError || usageStatsError || penetrationError || clearingError;

  // Use data from backend analytics
  const totalBins = binStats?.totalBins || 0;
  const onlineBins = binStats?.onlineBins || 0;
  const averageFillLevel = normalizeStorageLevel(binStats?.averageFillLevel || 0);
  const criticalBins = binStats?.criticalBins || 0;
  const warningBins = binStats?.warningBins || 0;
  const normalBins = binStats?.normalBins || 0;
  const activeClientRate = binStats?.activeClientRate || 0;

  const totalUsages = usageStats?.totalUsages || 0;
  const uniqueUsers = usageStats?.uniqueUsers || 0;
  const averageUsagesPerDay = usageStats?.averageUsagesPerDay || 0;

  // Сарын бодит цуглуулалт ба хоослолт. Өмнө нь энд 6 сарын тоо гараар
  // бичигдсэн байсан (`efficiency: 78, coverage: 85` г.м.) — хэмжилттэй
  // ямар ч холбоогүй.
  const monthlyTrends = (collectionTrends?.trends ?? []).map((trend) => ({
    month: trend.month,
    collection: trend.collection,
    clearings: trend.clearings
  }));

  // Use penetration analysis data for pie chart
  const pieInteractiveData = penetrationAnalysis?.penetrationByLocation?.slice(0, 5).map((location, index) => ({
    month: location.location,
    binCount: location.binCount,
    fill: `hsl(var(--chart-${index % 3 === 0 ? 'efficiency' : index % 3 === 1 ? 'collected' : 'coverage'}))`
  })) || [];

  const lineChartData = (collectionTrends?.trends ?? []).map((trend) => ({
    month: trend.month,
    collected: trend.collection
  }));

  const exportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalBins,
        onlineBins,
        averageFillLevel,
        criticalBins,
        warningBins,
        normalBins,
        activeClientRate,
        totalUsages,
        uniqueUsers,
        averageUsagesPerDay
      },
      analytics: {
        binStatistics: binStats,
        usageStatistics: usageStats,
        penetrationAnalysis,
        clearingEfficiency
      }
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { 
      type: 'application/json;charset=utf-8;' 
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `analytics_report_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  // Show loading state only on initial load
  const isInitialLoad = isLoading && !binStats && !usageStats && !penetrationAnalysis && !clearingEfficiency;
  if (isInitialLoad) {
    return (
      <PageContainer>
        <div className="flex flex-1 flex-col space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Аналитик тайлан</h1>
              <p className="text-muted-foreground">
                Мэдээлэл ачааллаж байна...
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <div className="h-4 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted animate-pulse rounded mb-2" />
                  <div className="h-3 bg-muted animate-pulse rounded mb-2" />
                  <div className="h-1 bg-muted animate-pulse rounded" />
                </CardContent>
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
        <div className="flex flex-1 flex-col space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Аналитик тайлан</h1>
              <p className="text-muted-foreground text-red-600">
                Мэдээлэл ачаалахад алдаа гарлаа: {binStatsError || usageStatsError || penetrationError || clearingError}
              </p>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Аналитик тайлан</h1>
            <p className="text-muted-foreground">
              Хогийн савны системийн дэлгэрэнгүй аналитик мэдээлэл
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <IconCalendar className="mr-2 h-4 w-4" />
              {selectedDateRange === '7d' ? '7 хоног' : 
               selectedDateRange === '30d' ? '30 хоног' : 
               selectedDateRange === '90d' ? '90 хоног' : '1 жил'}
            </Button>
            <Button onClick={exportReport} variant="outline" size="sm">
              <IconDownload className="mr-2 h-4 w-4" />
              Тайлан татах
            </Button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Нийт хогийн сав</CardTitle>
              <IconTrash className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalBins}</div>
              <p className="text-xs text-muted-foreground">
                Онлайн: {onlineBins} | Офлайн: {totalBins - onlineBins}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Дундаж дүүрэлт</CardTitle>
              <IconWeight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(averageFillLevel)}%</div>
              <div className="flex items-center space-x-2">
                <Progress value={averageFillLevel} className="flex-1" />
                <IconTrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Иргэдийн хамрагдалт</CardTitle>
              <IconUsers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(activeClientRate)}%</div>
              <p className="text-xs text-muted-foreground">
                30 хоногт уншуулсан: {binStats?.activeClients ?? 0} / {binStats?.totalClients ?? 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Өдөр тутмын хэрэглээ</CardTitle>
              <IconChartBar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(averageUsagesPerDay)}</div>
              <p className="text-xs text-muted-foreground">
                Нийт хэрэглээ: {totalUsages}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Radar Performance Chart */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Сарын гүйцэтгэл</CardTitle>
              <CardDescription>
                Цуглуулалт ба хоослолтын харьцуулалт
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-44 md:h-56">
                <RadarPerformanceChart data={monthlyTrends} />
              </div>
            </CardContent>
          </Card>

          {/* Pie Interactive Chart */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Байршлын хуваарилалт</CardTitle>
              <CardDescription>
                Хогийн савны байршлын хуваарилалт
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-44 md:h-56">
                <PieInteractiveChart data={pieInteractiveData} />
              </div>
            </CardContent>
          </Card>

          {/* Line Trends Chart */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Хугацааны тренд</CardTitle>
              <CardDescription>
                Цуглуулсан хог
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-56 md:h-[320px]">
                <LineTrendsChart data={lineChartData} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Analytics Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <IconMapPin className="mr-2 h-4 w-4" />
                Хогийн савны төлөв
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Критик түвшин</span>
                <span className="font-semibold text-red-600">{criticalBins}</span>
              </div>
              <div className="flex justify-between">
                <span>Сануулга</span>
                <span className="font-semibold text-yellow-600">{warningBins}</span>
              </div>
              <div className="flex justify-between">
                <span>Хэвийн</span>
                <span className="font-semibold text-green-600">{normalBins}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <IconRecycle className="mr-2 h-4 w-4" />
                Цэвэрлэлтийн үр ашиг
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(clearingEfficiency?.efficiencyScore ?? 0)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {clearingEfficiency?.onTimeClearings ?? 0} / {clearingEfficiency?.totalClearings ?? 0} хоослолт
                {' '}{Math.round(clearingEfficiency?.shouldClearPercent ?? 90)}%-аас дээш дүүрэлттэй үед
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <IconTrendingUp className="mr-2 h-4 w-4" />
                Нэг хоослолтод ногдох уншилт
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {penetrationAnalysis?.averagePenetration ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Хэмжигдсэн сав: {penetrationAnalysis?.measuredBins ?? 0} / {penetrationAnalysis?.totalBins ?? 0}
                {' '}· сүүлийн {penetrationAnalysis?.windowDays ?? 30} хоног
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
} 