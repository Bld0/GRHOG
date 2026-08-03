import { Metadata } from 'next';
import ComplaintsView from '@/features/complaints/components/complaints-view';

export const metadata: Metadata = {
  title: 'Санал гомдол | GRHOG'
};

export default function ComplaintsPage() {
  return <ComplaintsView />;
}
