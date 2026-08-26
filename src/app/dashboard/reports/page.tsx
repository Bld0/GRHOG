'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ReportsView } from '@/features/reports/components/reports-view';
import { useRolePermissions } from '@/hooks/use-role-permissions';
import { Icons } from '@/components/icons';

/**
 * Тайлан — зөвхөн SUPER_ADMIN.
 *
 * Цэснээс нуух нь хангалтгүй: хаягаар нь шууд орж болно. Backend тал ч
 * (ReportController) татгалзах ба энэ хуудас нь эрхгүй хэрэглэгчийг хоосон
 * алдаанууд харуулахын оронд буцаана.
 */
export default function ReportsPage() {
  const router = useRouter();
  const { isSuperAdmin, isLoading } = useRolePermissions();

  useEffect(() => {
    if (!isLoading && !isSuperAdmin) {
      router.push('/dashboard/overview');
    }
  }, [isLoading, isSuperAdmin, router]);

  if (isLoading) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <Icons.spinner className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return <ReportsView />;
}
