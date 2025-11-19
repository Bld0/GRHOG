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
  IconTrendingDown,
  IconCalendar,
  IconDownload,
  IconMapPin,
  IconWeight,
  IconRecycle,
  IconChartBar
} from '@tabler/icons-react';
import { RadialPerformanceChart } from './radial-performance-chart';
import { RadarPerformanceChart } from './radar-performance-chart';
import { PieInteractiveChart } from './pie-interactive-chart';
import { LineTrendsChart } from './line-trends-chart';
import { StackedBarChart } from './stacked-bar-chart';
import { 
  useBinStatistics, 
  useUsageStatistics, 
  usePenetrationAnalysis, 
  useClearingEfficiency 
} from '@/hooks/use-api-data';
import { normalizeStorageLevel } from '@/lib/utils';

export function AnalyticsView() {
  const [selectedDateRange, setSelectedDateRange] = useState('7d');
  
  // Use new analytics API endpoints
  const { data: binStats, loading: binStatsLoading, error: binStatsError } = useBinStatistics();
  const { data: usageStats, loading: usageStatsLoading, error: usageStatsError } = useUsageStatistics();
  const { data: penetrationAnalysis, loading: penetrationLoading, error: penetrationError } = usePenetrationAnalysis();
  const { data: clearingEfficiency, loading: clearingLoading, error: clearingError } = useClearingEfficiency();

  const isLoading = binStatsLoading || usageStatsLoading || penetrationLoading || clearingLoading;
  const hasError = binStatsError || usageStatsError || penetrationError || clearingError;

  // Use data from backend analytics
  const totalBins = binStats?.totalBins || 0;
  const onlineBins = binStats?.onlineBins || 0;
  const averageFillLevel = normalizeStorageLevel(binStats?.averageFillLevel || 0);
  const criticalBins = binStats?.criticalBins || 0;
  const warningBins = binStats?.warningBins || 0;
  const normalBins = binStats?.normalBins || 0;
  const penetrationRate = binStats?.penetrationRate || 0;

  const totalUsages = usageStats?.totalUsages || 0;
  const uniqueUsers = usageStats?.uniqueUsers || 0;
  const averageUsagesPerDay = usageStats?.averageUsagesPerDay || 0;

  const radialChartData = [{ 
    month: "current", 
    collected: Math.round(averageFillLevel * 0.7), 
    target: averageFillLevel 
  }];

  const radarChartData = [
    { month: "1-р сар", efficiency: 78, coverage: 85 },
    { month: "2-р сар", efficiency: 82, coverage: 88 },
    { month: "3-р сар", efficiency: 85, coverage: 92 },
    { month: "4-р сар", efficiency: 79, coverage: 86 },
    { month: "5-р сар", efficiency: 88, coverage: 94 },
    { month: "6-р сар", efficiency: 91, coverage: 96 },
  ];

  // Use penetration analysis data for pie chart
  const pieInteractiveData = penetrationAnalysis?.penetrationByLocation?.slice(0, 5).map((location, index) => ({
    month: location.location,
    binCount: location.binCount,
    fill: `hsl(var(--chart-${index % 3 === 0 ? 'efficiency' : index % 3 === 1 ? 'collected' : 'coverage'}))`
  })) || [];

  const lineChartData = [
    { month: "1-р сар", collected: 2850, recycled: 1420 },
    { month: "2-р сар", collected: 3120, recycled: 1650 },
    { month: "3-р сар", collected: 3480, recycled: 1890 },
    { month: "4-р сар", collected: 2920, recycled: 1560 },
    { month: "5-р сар", collected: 3650, recycled: 2100 },
    { month: "6-р сар", collected: 3890, recycled: 2340 },
  ];

  const stackedBarData = [
    { month: "1-р сар", organic: 850, plastic: 420, paper: 680, glass: 290 },
    { month: "2-р сар", organic: 920, plastic: 480, paper: 750, glass: 340 },
    { month: "3-р сар", organic: 1050, plastic: 560, paper: 820, glass: 380 },
    { month: "4-р сар", organic: 780, plastic: 390, paper: 590, glass: 260 },
    { month: "5-р сар", organic: 1150, plastic: 620, paper: 890, glass: 420 },
    { month: "6-р сар", organic: 1240, plastic: 680, paper: 950, glass: 460 },
  ];

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
        penetrationRate,
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
              <CardTitle className="text-sm font-medium">Нэвтрэх түвшин</CardTitle>
              <IconUsers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(penetrationRate)}%</div>
              <p className="text-xs text-muted-foreground">
                Идэвхтэй хэрэглэгч: {uniqueUsers}
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
          {/* Radial Performance Chart */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Гүйцэтгэлийн үзүүлэлт</CardTitle>
              <CardDescription>
                Одоогийн дүүрэлтийн түвшин
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-44 md:h-56">
                <RadialPerformanceChart data={radialChartData} />
              </div>
            </CardContent>
          </Card>

          {/* Radar Performance Chart */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Сарын гүйцэтгэл</CardTitle>
              <CardDescription>
                Үр ашиг болон хамрах хүрээ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-44 md:h-56">
                <RadarPerformanceChart data={radarChartData} />
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
                Цуглуулсан болон дахин боловсруулсан хог
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-56 md:h-[320px]">
                <LineTrendsChart data={lineChartData} />
              </div>
            </CardContent>
          </Card>

          {/* Stacked Bar Chart */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Хогийн төрөл</CardTitle>
              <CardDescription>
                Хогийн төрлүүдийн хуваарилалт
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-44 md:h-56">
                <StackedBarChart data={stackedBarData} />
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
                {clearingEfficiency?.efficiencyScore ? Math.round(clearingEfficiency.efficiencyScore) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Дундаж дүүрэлт: {clearingEfficiency?.averageFillLevelBeforeClear ? Math.round(clearingEfficiency.averageFillLevelBeforeClear) : 0}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <IconTrendingUp className="mr-2 h-4 w-4" />
                Нэвтрэх түвшин
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {penetrationAnalysis?.averagePenetration ? Math.round(penetrationAnalysis.averagePenetration) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Өндөр: {penetrationAnalysis?.highPenetrationBins || 0} | Дунд: {penetrationAnalysis?.mediumPenetrationBins || 0} | Бага: {penetrationAnalysis?.lowPenetrationBins || 0}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
} 