import { delay } from '@/constants/mock-api';
import { RecentTransactions } from '@/features/overview/components/recent-transactions';

export default async function Sales() {
  await delay(1000);
  return <RecentTransactions />;
}
