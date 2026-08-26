'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageContainer from '@/components/layout/page-container';
import { apiClient } from '@/lib/api-client';
import { downloadReport, ReportFilters, ReportType } from '../types';
import { BatteryReport } from './battery-report';
import { ClientActivityReport } from './client-activity-report';
import { ClearingReport } from './clearing-report';
import { MaintenanceReport } from './maintenance-report';
import {
  IconDownload,
  IconFileTypePdf,
  IconFileTypeXls
} from '@tabler/icons-react';
import { toast } from 'sonner';

/**
 * yyyy-MM-dd — <input type="date"> болон backend хоёулаа хүлээж авна.
 *
 * toISOString() ашиглаж болохгүй: тэр нь UTC руу шилжүүлдэг тул Улаанбаатарын
 * (UTC+8) шөнө дунд хүртэлх цагт өмнөх өдөр болж унана. Өдрийн мужид энэ нь
 * анзаарагдахгүй ч "Өнөөдөр" гэсэн нэг өдрийн сонголтод шууд хоосон тайлан
 * болж харагдана.
 */
function isoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function today(): string {
  return isoDate(new Date());
}

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return isoDate(date);
}

const QUICK_RANGES = [
  { label: 'Өнөөдөр', days: 0 },
  { label: '7 хоног', days: 7 },
  { label: '30 хоног', days: 30 },
  { label: '90 хоног', days: 90 }
];

/**
 * Тайлангийн дэлгэц: хугацаа, дүүрэг, хороогоор шүүсэн хоёр тайлан.
 *
 * Шүүлтүүр нь хоёр табд НИЙТЛЭГ — хэрэглэгч хугацаагаа нэг удаа сонгоод
 * "энэ сард энэ хороонд" гэсэн нэг асуултыг хоёр өнцгөөс хардаг.
 */
export function ReportsView() {
  const [tab, setTab] = useState<ReportType>('client-activity');
  const [downloading, setDownloading] = useState<'excel' | 'pdf' | null>(null);
  // Өгөгдмөл нь өнөөдөр: ихэнх асуулт "яг одоо юу болж байна" гэсэн байдаг.
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState(today());
  const [district, setDistrict] = useState('all');
  const [khoroo, setKhoroo] = useState('all');

  const [districts, setDistricts] = useState<string[]>([]);
  const [khoroos, setKhoroos] = useState<number[]>([]);

  // Хэрэглэгч бичиж дуусаагүй байхад тайлан дахин татагдахгүйн тулд
  // шүүлтүүрийг "Тайлан гаргах" дарахад л хэрэглэнэ.
  const [applied, setApplied] = useState<ReportFilters>({
    startDate: today(),
    endDate: today(),
    district: '',
    khoroo: ''
  });

  const fetchDistricts = useCallback(async () => {
    try {
      const response = await apiClient.fetchWithAuth(
        '/api/dashboard/getDistrict'
      );
      if (response.ok) setDistricts(await response.json());
    } catch {
      // Дүүргийн жагсаалт татагдахгүй бол шүүлтгүйгээр ажиллана.
    }
  }, []);

  const fetchKhoroos = useCallback(async (selectedDistrict: string) => {
    try {
      const query =
        selectedDistrict && selectedDistrict !== 'all'
          ? `?district=${encodeURIComponent(selectedDistrict)}`
          : '';
      const response = await apiClient.fetchWithAuth(
        `/api/dashboard/getKhoroo${query}`
      );
      if (response.ok) setKhoroos(await response.json());
    } catch {
      setKhoroos([]);
    }
  }, []);

  useEffect(() => {
    fetchDistricts();
  }, [fetchDistricts]);

  useEffect(() => {
    fetchKhoroos(district);
    setKhoroo('all');
  }, [district, fetchKhoroos]);

  const apply = () => {
    setApplied({
      startDate,
      endDate,
      district: district === 'all' ? '' : district,
      khoroo: khoroo === 'all' ? '' : khoroo
    });
  };

  const applyQuickRange = (days: number) => {
    // days = 0 бол эхлэл ба төгсгөл хоёулаа өнөөдөр — нэг өдрийн муж.
    const from = daysAgo(days);
    const to = today();
    setStartDate(from);
    setEndDate(to);
    setApplied({
      startDate: from,
      endDate: to,
      district: district === 'all' ? '' : district,
      khoroo: khoroo === 'all' ? '' : khoroo
    });
  };

  /** Идэвхтэй табын тайланг файлаар татна. */
  const download = async (format: 'excel' | 'pdf') => {
    setDownloading(format);
    try {
      await downloadReport(
        (url, options) => apiClient.fetchWithAuth(url, options),
        tab,
        format,
        applied
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Тайлан татахад алдаа гарлаа'
      );
    } finally {
      setDownloading(null);
    }
  };

  const periodLabel = useMemo(
    () => `${applied.startDate} — ${applied.endDate}`,
    [applied.startDate, applied.endDate]
  );

  return (
    <PageContainer>
      <div className='w-full space-y-6'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Тайлан</h1>
          <p className='text-muted-foreground'>
            Сонгосон хугацаа, байршлаар хэрэглэгчийн ашиглалт болон хоослолтын
            мэдээллийг нэгтгэн харна
          </p>
        </div>

        <Card>
          <CardContent className='flex flex-col gap-4 pt-6'>
            {/*
              Дөрвөн шүүлтүүр тэнцүү хуваагдаж, товч нь өөрийн өргөнөөр
              (auto) сууна — 5 тэнцүү багана хийвэл товч талбаруудаас илүү
              өргөн авч, огнооны нүд шахагдана. Дунд өргөнд товч ганцаараа
              хагас багана эзэлж өнчрөхгүйн тулд хоёр багана дамжина.
            */}
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto]'>
              <div className='min-w-0 space-y-1'>
                <Label className='text-xs'>Эхлэх огноо</Label>
                <Input
                  type='date'
                  value={startDate}
                  max={endDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className='min-w-0 space-y-1'>
                <Label className='text-xs'>Дуусах огноо</Label>
                <Input
                  type='date'
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className='min-w-0 space-y-1'>
                <Label className='text-xs'>Дүүрэг</Label>
                <Select value={district} onValueChange={setDistrict}>
                  <SelectTrigger>
                    <SelectValue placeholder='Бүх дүүрэг' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Бүх дүүрэг</SelectItem>
                    {districts.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='min-w-0 space-y-1'>
                <Label className='text-xs'>Хороо</Label>
                <Select value={khoroo} onValueChange={setKhoroo}>
                  <SelectTrigger>
                    <SelectValue placeholder='Бүх хороо' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Бүх хороо</SelectItem>
                    {khoroos.map((item) => (
                      <SelectItem key={item} value={String(item)}>
                        {item}-р хороо
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='flex items-end sm:col-span-2 lg:col-span-1'>
                <Button className='w-full' onClick={apply}>
                  Тайлан гаргах
                </Button>
              </div>
            </div>

            <div className='flex flex-wrap items-center gap-2'>
              <span className='text-muted-foreground text-xs'>
                Түргэн сонголт:
              </span>
              {QUICK_RANGES.map((range) => (
                <Button
                  key={range.days}
                  variant='outline'
                  size='sm'
                  onClick={() => applyQuickRange(range.days)}
                >
                  {range.label}
                </Button>
              ))}
              <span className='text-muted-foreground ml-auto text-xs'>
                Харуулж буй хугацаа: {periodLabel}
              </span>
            </div>
          </CardContent>
        </Card>

        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as ReportType)}
          className='space-y-4'
        >
          <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
            <TabsList>
              <TabsTrigger value='client-activity'>
                Хэрэглэгчийн идэвх
              </TabsTrigger>
              <TabsTrigger value='clearings'>Хоослолт</TabsTrigger>
              <TabsTrigger value='battery'>Батерей</TabsTrigger>
              <TabsTrigger value='maintenance'>Засвар үйлчилгээ</TabsTrigger>
            </TabsList>

            {/* Татах товч нь ИДЭВХТЭЙ табын тайланг сонгосон шүүлтүүрээр татна. */}
            <div className='flex items-center gap-2'>
              <span className='text-muted-foreground hidden text-xs sm:inline'>
                <IconDownload className='mr-1 inline h-4 w-4' />
                Тайлан татах:
              </span>
              <Button
                variant='outline'
                size='sm'
                disabled={downloading !== null}
                onClick={() => download('excel')}
              >
                <IconFileTypeXls className='mr-2 h-4 w-4' />
                {downloading === 'excel' ? 'Бэлдэж байна...' : 'Excel'}
              </Button>
              <Button
                variant='outline'
                size='sm'
                disabled={downloading !== null}
                onClick={() => download('pdf')}
              >
                <IconFileTypePdf className='mr-2 h-4 w-4' />
                {downloading === 'pdf' ? 'Бэлдэж байна...' : 'PDF'}
              </Button>
            </div>
          </div>

          <TabsContent value='client-activity'>
            <ClientActivityReport filters={applied} />
          </TabsContent>

          <TabsContent value='clearings'>
            <ClearingReport filters={applied} />
          </TabsContent>

          <TabsContent value='battery'>
            <BatteryReport filters={applied} />
          </TabsContent>

          <TabsContent value='maintenance'>
            <MaintenanceReport filters={applied} />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
