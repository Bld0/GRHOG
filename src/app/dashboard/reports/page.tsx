'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ReportsView } from '@/features/reports/components/reports-view';
import { useRolePermissions } from '@/hooks/use-role-permissions';
import { Icons } from '@/components/icons';

/**
 * Тайлан — SUPER_ADMIN ба хорооны дарга.
 *
 * Цэснээс нуух нь хангалтгүй: хаягаар нь шууд орж болно. Backend тал ч
 * (ReportController) татгалзах ба энэ хуудас нь эрхгүй хэрэглэгчийг хоосон
 * алдаанууд харуулахын оронд буцаана.
 *
 * Хорооны дарга нэмэгдэв: ReportController-ийн класс түвшний @PreAuthorize
 * түүнийг нэрлэсэн ба доор нь зогсох ReportService/BatteryReportService/
 * BatteryHistoryService гурав CallerScope-оор ӨӨРИЙНХ НЬ хорооны мөрөөр
 * шүүдэг тул тайлан нь бүсийн хэмжээнд утгатай.
 *
 * ADMIN-ийг ЗОРИУД нэмээгүй: backend түүнд нээлттэй ч веб дээр тайлан нь
 * цэсэндээ ч `requiresRole: 'SUPER_ADMIN'` — энэ нь бүтээгдэхүүний тусдаа
 * шийдвэр бөгөөд энэ ажлын хүрээнд өөрчлөх зүйл биш.
 */
export default function ReportsPage() {
  const router = useRouter();
  const { isSuperAdmin, isKhorooLeader, isLoading } = useRolePermissions();
  const canReadReports = isSuperAdmin || isKhorooLeader;

  useEffect(() => {
    if (!isLoading && !canReadReports) {
      router.push('/dashboard/overview');
    }
  }, [isLoading, canReadReports, router]);

  if (isLoading) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <Icons.spinner className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (!canReadReports) {
    return null;
  }

  return <ReportsView />;
}
