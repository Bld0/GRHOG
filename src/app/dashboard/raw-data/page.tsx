'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRolePermissions } from '@/hooks/use-role-permissions';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import PageContainer from '@/components/layout/page-container';
import { IotGroupedCard } from './iot-grouped-card';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface Dataset {
  key: string;
  label: string;
  description: string;
  url: string;
}

interface TabDef {
  value: string;
  label: string;
  datasets: Dataset[];
}

const TABS: TabDef[] = [
  {
    value: 'bin',
    label: 'Хогийн сав',
    datasets: [
      {
        key: 'bin',
        label: 'Хогийн сав (bin)',
        description: 'GET /api/raw-data/bin — bin хүснэгтийн түүхий мөрүүд',
        url: '/api/raw-data/bin'
      },
      {
        key: 'bin_message',
        label: 'Төхөөрөмжийн мессеж (bin_message)',
        description: 'GET /api/raw-data/bin-message — bin_message хүснэгтийн түүхий мөрүүд',
        url: '/api/raw-data/bin-message'
      },
      {
        key: 'bin_usage',
        label: 'Ашиглалт (bin_usage)',
        description: 'GET /api/raw-data/bin-usage — bin_usage хүснэгтийн түүхий мөрүүд',
        url: '/api/raw-data/bin-usage'
      }
    ]
  },
  {
    value: 'iot',
    label: 'IOT',
    datasets: [
      {
        key: 'iot_request_log',
        label: 'IOT хүсэлтийн лог (iot_request_log)',
        description: 'GET /api/raw-data/iot-request-log — iot_request_log хүснэгтийн түүхий мөрүүд',
        url: '/api/raw-data/iot-request-log'
      }
    ]
  },
  {
    value: 'card',
    label: 'Карт',
    datasets: [
      {
        key: 'client',
        label: 'Карт / Үйлчлүүлэгч (client)',
        description: 'GET /api/raw-data/client — client хүснэгтийн түүхий мөрүүд',
        url: '/api/raw-data/client'
      }
    ]
  }
];

const ALL_DATASETS = TABS.flatMap(t => t.datasets);

/** Filter an array of rows by a free-text query matched against each row's JSON. */
function filterRows(rows: unknown, query: string): { rows: unknown[]; total: number } {
  const arr = Array.isArray(rows) ? rows : [];
  const q = query.trim().toLowerCase();
  if (!q) return { rows: arr, total: arr.length };
  const filtered = arr.filter(row => JSON.stringify(row).toLowerCase().includes(q));
  return { rows: filtered, total: arr.length };
}

function DatasetCard({
  dataset,
  data,
  status,
  search,
  onSearch,
  onFetch
}: {
  dataset: Dataset;
  data: unknown;
  status: Status;
  search: string;
  onSearch: (value: string) => void;
  onFetch: () => void;
}) {
  const isArray = Array.isArray(data);
  const { rows, total } = useMemo(
    () => (isArray ? filterRows(data, search) : { rows: [], total: 0 }),
    [data, search, isArray]
  );

  return (
    <Card>
      <CardHeader className="space-y-3 pb-3">
        <div className="flex flex-row items-start justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">{dataset.label}</CardTitle>
            <CardDescription className="font-mono text-xs">{dataset.description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {status === 'loading' && (
              <Icons.spinner className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {status === 'success' && <Icons.check className="h-4 w-4 text-green-500" />}
            {status === 'error' && <Icons.warning className="h-4 w-4 text-red-500" />}
            <Button variant="outline" size="sm" onClick={onFetch} disabled={status === 'loading'}>
              Татах
            </Button>
          </div>
        </div>
        <div className="relative">
          <Icons.search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="JSON дотор хайх..."
            className="pl-8"
            disabled={!isArray || status !== 'success'}
          />
        </div>
        {status === 'success' && isArray && (
          <p className="text-xs text-muted-foreground">
            {search.trim()
              ? `${rows.length} / ${total} мөр тохирлоо`
              : `Нийт ${total} мөр`}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {status === 'idle' && (
          <p className="text-sm text-muted-foreground">Өгөгдөл татагдаагүй байна.</p>
        )}
        {status === 'loading' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icons.spinner className="h-4 w-4 animate-spin" />
            <span>Татаж байна...</span>
          </div>
        )}
        {status === 'error' && (
          <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-xs overflow-auto max-h-[500px]">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
        {status === 'success' && isArray && (
          <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-xs overflow-auto max-h-[600px]">
            {JSON.stringify(rows, null, 2)}
          </pre>
        )}
        {status === 'success' && !isArray && (
          <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-xs overflow-auto max-h-[600px]">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}

export default function RawDataPage() {
  const { isSuperAdmin, isDeveloper, isLoading: authLoading } = useRolePermissions();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<string>(TABS[0].value);
  const [data, setData] = useState<Record<string, unknown>>({});
  const [status, setStatus] = useState<Record<string, Status>>(
    () => Object.fromEntries(ALL_DATASETS.map(d => [d.key, 'idle' as Status]))
  );
  const [search, setSearch] = useState<Record<string, string>>(
    () => Object.fromEntries(ALL_DATASETS.map(d => [d.key, '']))
  );

  const canAccess = isDeveloper || isSuperAdmin;

  // Only DEVELOPER and SUPER_ADMIN may access this page
  useEffect(() => {
    if (!authLoading && !canAccess) {
      router.push('/dashboard/overview');
      toast.error('Хандалт хаалттай. Хөгжүүлэгчийн эрх шаардлагатай.');
    }
  }, [canAccess, router, authLoading]);

  const fetchDataset = useCallback(async (key: string, url: string) => {
    setStatus(prev => ({ ...prev, [key]: 'loading' }));
    try {
      const response = await apiClient.fetchWithAuth(url);
      if (response.ok) {
        const json = await response.json();
        setData(prev => ({ ...prev, [key]: json }));
        setStatus(prev => ({ ...prev, [key]: 'success' }));
      } else {
        setData(prev => ({
          ...prev,
          [key]: { error: `HTTP ${response.status}`, statusText: response.statusText }
        }));
        setStatus(prev => ({ ...prev, [key]: 'error' }));
      }
    } catch (err) {
      setData(prev => ({
        ...prev,
        [key]: { error: err instanceof Error ? err.message : String(err) }
      }));
      setStatus(prev => ({ ...prev, [key]: 'error' }));
    }
  }, []);

  // Lazily fetch the datasets of the active tab the first time it is shown.
  useEffect(() => {
    if (authLoading || !canAccess) return;
    const tab = TABS.find(t => t.value === activeTab);
    if (!tab) return;
    tab.datasets.forEach(ds => {
      if (status[ds.key] === 'idle') {
        fetchDataset(ds.key, ds.url);
      }
    });
  }, [activeTab, authLoading, canAccess, status, fetchDataset]);

  const refreshActiveTab = useCallback(() => {
    const tab = TABS.find(t => t.value === activeTab);
    if (!tab) return;
    tab.datasets.forEach(ds => fetchDataset(ds.key, ds.url));
  }, [activeTab, fetchDataset]);

  if (authLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!canAccess) {
    return null;
  }

  const activeTabLoading = (TABS.find(t => t.value === activeTab)?.datasets ?? []).some(
    ds => status[ds.key] === 'loading'
  );

  return (
    <PageContainer>
      <div className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Түүхий өгөгдөл</h1>
            <p className="text-muted-foreground">
              Датабазын хүснэгтүүдийн түүхий өгөгдөл JSON форматаар. JSON дотроос хайлт хийх боломжтой.
            </p>
          </div>
          <Button
            onClick={refreshActiveTab}
            disabled={activeTabLoading}
            className="bg-primary text-white shadow-sm hover:bg-primary/90"
          >
            {activeTabLoading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Татаж байна...
              </>
            ) : (
              <>
                <Icons.rawData className="mr-2 h-4 w-4" />
                Дахин татах
              </>
            )}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            {TABS.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {TABS.map(tab => (
            <TabsContent key={tab.value} value={tab.value} className="space-y-6">
              {tab.value === 'iot' && <IotGroupedCard />}
              {tab.datasets.map(ds => (
                <DatasetCard
                  key={ds.key}
                  dataset={ds}
                  data={data[ds.key] ?? null}
                  status={status[ds.key] ?? 'idle'}
                  search={search[ds.key] ?? ''}
                  onSearch={value => setSearch(prev => ({ ...prev, [ds.key]: value }))}
                  onFetch={() => fetchDataset(ds.key, ds.url)}
                />
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </PageContainer>
  );
}
