'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRolePermissions } from '@/hooks/use-role-permissions';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import PageContainer from '@/components/layout/page-container';

interface RawDataState {
  bins: unknown;
  binUsages: unknown;
  dashboard: unknown;
  analytics: unknown;
}

interface FetchStatus {
  bins: 'idle' | 'loading' | 'success' | 'error';
  binUsages: 'idle' | 'loading' | 'success' | 'error';
  dashboard: 'idle' | 'loading' | 'success' | 'error';
  analytics: 'idle' | 'loading' | 'success' | 'error';
}

const ENDPOINTS = [
  {
    key: 'bins' as const,
    label: 'Хогийн савнууд',
    description: 'GET /api/bins — hardware sensor readings (fill level, battery, IoT activity)',
    url: '/api/bins'
  },
  {
    key: 'binUsages' as const,
    label: 'Ашиглалтын бүртгэл',
    description: 'GET /api/bin-usages — raw bin usage events from hardware',
    url: '/api/bin-usages'
  },
  {
    key: 'dashboard' as const,
    label: 'Дашбоардын мэдээлэл',
    description: 'GET /api/dashboard/bin-summary — aggregated bin summary',
    url: '/api/dashboard/bin-summary'
  },
  {
    key: 'analytics' as const,
    label: 'Аналитик статистик',
    description: 'GET /api/analytics/bin-statistics — bin statistics',
    url: '/api/analytics/bin-statistics'
  }
];

export default function RawDataPage() {
  const { isSuperAdmin, isDeveloper, isLoading: authLoading } = useRolePermissions();
  const router = useRouter();

  const [data, setData] = useState<RawDataState>({
    bins: null,
    binUsages: null,
    dashboard: null,
    analytics: null
  });
  const [status, setStatus] = useState<FetchStatus>({
    bins: 'idle',
    binUsages: 'idle',
    dashboard: 'idle',
    analytics: 'idle'
  });
  const [lastFetched, setLastFetched] = useState<string | null>(null);

  // Only DEVELOPER and SUPER_ADMIN may access this page
  useEffect(() => {
    if (!authLoading && !isDeveloper && !isSuperAdmin) {
      router.push('/dashboard/overview');
      toast.error('Хандалт хаалттай. Хөгжүүлэгчийн эрх шаардлагатай.');
    }
  }, [isDeveloper, isSuperAdmin, router, authLoading]);

  const fetchEndpoint = useCallback(async (key: keyof RawDataState, url: string) => {
    setStatus(prev => ({ ...prev, [key]: 'loading' }));
    try {
      const response = await apiClient.fetchWithAuth(url);
      if (response.ok) {
        const json = await response.json();
        setData(prev => ({ ...prev, [key]: json }));
        setStatus(prev => ({ ...prev, [key]: 'success' }));
      } else {
        setData(prev => ({ ...prev, [key]: { error: `HTTP ${response.status}`, statusText: response.statusText } }));
        setStatus(prev => ({ ...prev, [key]: 'error' }));
      }
    } catch (err) {
      setData(prev => ({ ...prev, [key]: { error: err instanceof Error ? err.message : String(err) } }));
      setStatus(prev => ({ ...prev, [key]: 'error' }));
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLastFetched(null);
    await Promise.all(ENDPOINTS.map(ep => fetchEndpoint(ep.key, ep.url)));
    setLastFetched(new Date().toLocaleTimeString());
  }, [fetchEndpoint]);

  useEffect(() => {
    if (!authLoading && (isDeveloper || isSuperAdmin)) {
      fetchAll();
    }
  }, [authLoading, isDeveloper, isSuperAdmin, fetchAll]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isDeveloper && !isSuperAdmin) {
    return null;
  }

  const allLoading = ENDPOINTS.every(ep => status[ep.key] === 'loading');

  return (
    <PageContainer>
      <div className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Түүхий өгөгдөл</h1>
            <p className="text-muted-foreground">
              Хэрэглэгчийн тоног төхөөрөмжөөс ирж буй бүх өгөгдөл JSON форматаар
            </p>
            {lastFetched && (
              <p className="text-xs text-muted-foreground mt-1">
                Сүүлд татсан: {lastFetched}
              </p>
            )}
          </div>
          <Button
            onClick={fetchAll}
            disabled={allLoading}
            className="bg-primary hover:bg-primary/90 text-white shadow-sm"
          >
            {allLoading ? (
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

        {ENDPOINTS.map(ep => (
          <Card key={ep.key}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold">{ep.label}</CardTitle>
                <CardDescription className="font-mono text-xs">{ep.description}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {status[ep.key] === 'loading' && (
                  <Icons.spinner className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {status[ep.key] === 'success' && (
                  <Icons.check className="h-4 w-4 text-green-500" />
                )}
                {status[ep.key] === 'error' && (
                  <Icons.warning className="h-4 w-4 text-red-500" />
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchEndpoint(ep.key, ep.url)}
                  disabled={status[ep.key] === 'loading'}
                >
                  Татах
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {status[ep.key] === 'idle' && (
                <p className="text-sm text-muted-foreground">Өгөгдөл татагдаагүй байна.</p>
              )}
              {status[ep.key] === 'loading' && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icons.spinner className="h-4 w-4 animate-spin" />
                  <span>Татаж байна...</span>
                </div>
              )}
              {(status[ep.key] === 'success' || status[ep.key] === 'error') && data[ep.key] !== null && (
                <pre className="whitespace-pre-wrap bg-muted p-4 rounded-lg text-xs overflow-auto max-h-[500px]">
                  {JSON.stringify(data[ep.key], null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
