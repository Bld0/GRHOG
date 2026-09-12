'use client';

import {
  IconAlertTriangle,
  IconUserCheck,
  IconUserOff,
  IconUsersGroup
} from '@tabler/icons-react';

import type { ClientActivityReport } from '../../types';
import { ReportStatsGrid } from '../report-stats-grid';

/** Тайлангийн дөрвөн нэгдсэн үзүүлэлт. */
export function ReportStatCards({
  report,
  loading
}: {
  report: ClientActivityReport | null;
  loading: boolean;
}) {
  const stats = [
    {
      title: 'Нийт хэрэглэгч',
      value: report?.totalClients ?? 0,
      hint: 'Сонгосон хороонд бүртгэлтэй',
      icon: IconUsersGroup,
      tone: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Идэвхтэй',
      value: report?.activeClients ?? 0,
      hint: `Нийтийн ${report?.activePercent ?? 0}%`,
      icon: IconUserCheck,
      tone: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Идэвхгүй',
      value: report?.inactiveClients ?? 0,
      hint: `Нийтийн ${report?.inactivePercent ?? 0}%`,
      icon: IconUserOff,
      tone: 'text-amber-600 dark:text-amber-400'
    },
    {
      title: 'Хэзээ ч ашиглаагүй',
      value: report?.buckets.never ?? 0,
      hint: 'Картаа огт эхлүүлээгүй',
      icon: IconAlertTriangle,
      tone: 'text-red-600 dark:text-red-400'
    }
  ];

  return <ReportStatsGrid stats={stats} loading={loading} />;
}
